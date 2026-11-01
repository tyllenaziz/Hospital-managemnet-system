const axios = require('axios');
const db = require('../config/dbconfig');

/**
 * M-Pesa Daraja API Service
 * Handles STK Push (Lipa na M-Pesa Online) and callbacks
 */

class MpesaService {
    constructor() {
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        this.shortCode = process.env.MPESA_SHORTCODE;
        this.passkey = process.env.MPESA_PASSKEY;
        this.callbackUrl = process.env.MPESA_CALLBACK_URL;
        this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';

        this.baseUrl = this.environment === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    /**
     * Get OAuth access token from Daraja API
     */
    async getAccessToken() {
        try {
            const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

            const response = await axios.get(
                `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
                {
                    headers: {
                        'Authorization': `Basic ${auth}`
                    }
                }
            );

            return response.data.access_token;
        } catch (error) {
            console.error('M-Pesa OAuth Error:', error.response?.data || error.message);
            throw new Error('Failed to get M-Pesa access token');
        }
    }

    /**
     * Generate password for STK Push
     */
    generatePassword() {
        const timestamp = this.getTimestamp();
        const password = Buffer.from(
            `${this.shortCode}${this.passkey}${timestamp}`
        ).toString('base64');
        return { password, timestamp };
    }

    /**
     * Get current timestamp in format YYYYMMDDHHmmss
     */
    getTimestamp() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    /**
     * Format phone number to 254XXXXXXXXX format
     */
    formatPhoneNumber(phone) {
        // Remove any spaces or dashes
        phone = phone.replace(/[\s-]/g, '');

        // Handle different formats
        if (phone.startsWith('+254')) {
            return phone.substring(1); // Remove +
        } else if (phone.startsWith('254')) {
            return phone;
        } else if (phone.startsWith('0')) {
            return '254' + phone.substring(1);
        } else if (phone.startsWith('7') || phone.startsWith('1')) {
            return '254' + phone;
        }
        return phone;
    }

    /**
     * Initiate STK Push (Lipa na M-Pesa Online)
     * @param {Object} params - Payment parameters
     * @param {string} params.phone - Customer phone number
     * @param {number} params.amount - Amount to charge
     * @param {string} params.accountReference - Bill/Invoice reference
     * @param {string} params.description - Transaction description
     * @param {number} params.billId - Internal bill ID for tracking
     */
    async stkPush({ phone, amount, accountReference, description, billId }) {
        try {
            const accessToken = await this.getAccessToken();
            const { password, timestamp } = this.generatePassword();
            const formattedPhone = this.formatPhoneNumber(phone);

            const payload = {
                BusinessShortCode: this.shortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: Math.ceil(amount), // M-Pesa requires whole numbers
                PartyA: formattedPhone,
                PartyB: this.shortCode,
                PhoneNumber: formattedPhone,
                CallBackURL: this.callbackUrl,
                AccountReference: accountReference || `BILL-${billId}`,
                TransactionDesc: description || 'Hospital Bill Payment'
            };

            console.log('STK Push Request:', { ...payload, Password: '[HIDDEN]' });

            const response = await axios.post(
                `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('STK Push Response:', response.data);

            // Store the transaction request
            if (response.data.ResponseCode === '0') {
                await this.storeTransaction({
                    checkoutRequestId: response.data.CheckoutRequestID,
                    merchantRequestId: response.data.MerchantRequestID,
                    phone: formattedPhone,
                    amount: amount,
                    billId: billId,
                    status: 'pending'
                });
            }

            return {
                success: response.data.ResponseCode === '0',
                message: response.data.ResponseDescription || response.data.CustomerMessage,
                checkoutRequestId: response.data.CheckoutRequestID,
                merchantRequestId: response.data.MerchantRequestID
            };

        } catch (error) {
            console.error('STK Push Error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.errorMessage || error.message || 'STK Push failed'
            };
        }
    }

    /**
     * Query STK Push status
     */
    async queryStatus(checkoutRequestId) {
        try {
            const accessToken = await this.getAccessToken();
            const { password, timestamp } = this.generatePassword();

            const response = await axios.post(
                `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
                {
                    BusinessShortCode: this.shortCode,
                    Password: password,
                    Timestamp: timestamp,
                    CheckoutRequestID: checkoutRequestId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: response.data.ResultCode === '0',
                resultCode: response.data.ResultCode,
                message: response.data.ResultDesc
            };

        } catch (error) {
            console.error('Query Status Error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.errorMessage || 'Status query failed'
            };
        }
    }

    /**
     * Store transaction in database
     */
    async storeTransaction({ checkoutRequestId, merchantRequestId, phone, amount, billId, status }) {
        const sql = `
            INSERT INTO mpesa_transactions 
            (checkout_request_id, merchant_request_id, phone, amount, bill_id, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        try {
            await db.query(sql, [checkoutRequestId, merchantRequestId, phone, amount, billId, status]);
        } catch (error) {
            console.error('Store Transaction Error:', error);
            // Don't throw - logging failure shouldn't break payment
        }
    }

    /**
     * Process callback from M-Pesa
     */
    async processCallback(callbackData) {
        try {
            const { Body } = callbackData;
            const { stkCallback } = Body;

            const checkoutRequestId = stkCallback.CheckoutRequestID;
            const resultCode = stkCallback.ResultCode;
            const resultDesc = stkCallback.ResultDesc;

            console.log('M-Pesa Callback:', { checkoutRequestId, resultCode, resultDesc });

            // Get the pending transaction
            const [transactions] = await db.query(
                'SELECT * FROM mpesa_transactions WHERE checkout_request_id = ?',
                [checkoutRequestId]
            );

            if (transactions.length === 0) {
                console.error('Transaction not found:', checkoutRequestId);
                return { success: false, message: 'Transaction not found' };
            }

            const transaction = transactions[0];

            if (resultCode === 0) {
                // Payment successful - extract callback metadata
                const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];

                let mpesaReceiptNumber = '';
                let transactionDate = '';
                let phoneNumber = '';

                callbackMetadata.forEach(item => {
                    if (item.Name === 'MpesaReceiptNumber') mpesaReceiptNumber = item.Value;
                    if (item.Name === 'TransactionDate') transactionDate = item.Value;
                    if (item.Name === 'PhoneNumber') phoneNumber = item.Value;
                });

                // Update transaction status
                await db.query(
                    `UPDATE mpesa_transactions 
                     SET status = 'completed', 
                         mpesa_receipt = ?,
                         transaction_date = ?,
                         result_code = ?,
                         result_desc = ?,
                         updated_at = NOW()
                     WHERE checkout_request_id = ?`,
                    [mpesaReceiptNumber, transactionDate, resultCode, resultDesc, checkoutRequestId]
                );

                // Add payment to bill
                const Bill = require('../models/Bill');
                await Bill.addPayment(transaction.bill_id, {
                    amount: transaction.amount,
                    payment_method: 'mpesa',
                    reference_number: mpesaReceiptNumber
                });

                return {
                    success: true,
                    message: 'Payment completed',
                    mpesaReceipt: mpesaReceiptNumber
                };

            } else {
                // Payment failed or cancelled
                await db.query(
                    `UPDATE mpesa_transactions 
                     SET status = 'failed', 
                         result_code = ?,
                         result_desc = ?,
                         updated_at = NOW()
                     WHERE checkout_request_id = ?`,
                    [resultCode, resultDesc, checkoutRequestId]
                );

                return {
                    success: false,
                    message: resultDesc || 'Payment failed'
                };
            }

        } catch (error) {
            console.error('Callback Processing Error:', error);
            return { success: false, message: 'Callback processing failed' };
        }
    }

    /**
     * Get transaction status by checkout request ID
     */
    async getTransactionStatus(checkoutRequestId) {
        try {
            const [transactions] = await db.query(
                'SELECT * FROM mpesa_transactions WHERE checkout_request_id = ?',
                [checkoutRequestId]
            );

            if (transactions.length === 0) {
                return { found: false };
            }

            return {
                found: true,
                transaction: transactions[0]
            };
        } catch (error) {
            console.error('Get Transaction Status Error:', error);
            return { found: false, error: error.message };
        }
    }
}

module.exports = new MpesaService();
