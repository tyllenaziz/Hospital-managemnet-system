const mpesaService = require('../utils/mpesaService');

const mpesaController = {
    /**
     * Initiate STK Push payment
     * POST /mpesa/stkpush
     */
    initiatePayment: async (req, res) => {
        try {
            const { phone, amount, billId, accountReference, description } = req.body;

            // Validate required fields
            if (!phone || !amount || !billId) {
                return res.status(400).json({
                    success: false,
                    error: 'Phone number, amount, and bill ID are required'
                });
            }

            // Validate phone number format
            if (!/^(0|254|\+254|7|1)[0-9]{8,9}$/.test(phone.replace(/[\s-]/g, ''))) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid phone number format'
                });
            }

            // Validate amount
            if (amount <= 0 || amount > 150000) {
                return res.status(400).json({
                    success: false,
                    error: 'Amount must be between 1 and 150,000 KES'
                });
            }

            const result = await mpesaService.stkPush({
                phone,
                amount,
                billId,
                accountReference: accountReference || `BILL-${billId}`,
                description: description || 'Hospital Bill Payment'
            });

            if (result.success) {
                res.json({
                    success: true,
                    message: 'STK Push sent successfully. Check your phone.',
                    checkoutRequestId: result.checkoutRequestId,
                    merchantRequestId: result.merchantRequestId
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.message || 'Failed to initiate payment'
                });
            }

        } catch (error) {
            console.error('STK Push Controller Error:', error);
            res.status(500).json({
                success: false,
                error: 'Payment initiation failed'
            });
        }
    },

    /**
     * Handle M-Pesa callback
     * POST /mpesa/callback
     */
    handleCallback: async (req, res) => {
        try {
            console.log('M-Pesa Callback Received:', JSON.stringify(req.body, null, 2));

            const result = await mpesaService.processCallback(req.body);

            // Always respond with success to M-Pesa (they expect 200)
            res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

        } catch (error) {
            console.error('Callback Handler Error:', error);
            // Still return success to M-Pesa
            res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
        }
    },

    /**
     * Query transaction status
     * GET /mpesa/status/:checkoutRequestId
     */
    queryStatus: async (req, res) => {
        try {
            const { checkoutRequestId } = req.params;

            if (!checkoutRequestId) {
                return res.status(400).json({
                    success: false,
                    error: 'Checkout request ID is required'
                });
            }

            // First check our database
            const dbResult = await mpesaService.getTransactionStatus(checkoutRequestId);

            if (dbResult.found) {
                const tx = dbResult.transaction;
                return res.json({
                    success: true,
                    status: tx.status,
                    mpesaReceipt: tx.mpesa_receipt,
                    amount: tx.amount,
                    resultDesc: tx.result_desc
                });
            }

            // If not in DB, query M-Pesa directly
            const mpesaResult = await mpesaService.queryStatus(checkoutRequestId);

            res.json({
                success: mpesaResult.success,
                status: mpesaResult.success ? 'completed' : 'pending',
                message: mpesaResult.message
            });

        } catch (error) {
            console.error('Query Status Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to query status'
            });
        }
    },

    /**
     * Check payment status by checkout request ID (polling endpoint)
     * GET /mpesa/check/:checkoutRequestId
     */
    checkPaymentStatus: async (req, res) => {
        try {
            const { checkoutRequestId } = req.params;

            const dbResult = await mpesaService.getTransactionStatus(checkoutRequestId);

            if (!dbResult.found) {
                return res.json({
                    success: false,
                    status: 'not_found'
                });
            }

            const tx = dbResult.transaction;
            res.json({
                success: tx.status === 'completed',
                status: tx.status,
                mpesaReceipt: tx.mpesa_receipt,
                amount: tx.amount,
                message: tx.result_desc
            });

        } catch (error) {
            console.error('Check Payment Status Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check payment status'
            });
        }
    }
};

module.exports = mpesaController;
