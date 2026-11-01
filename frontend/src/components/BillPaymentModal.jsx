import { useState, useEffect, useRef } from 'react';
import { CreditCard, Banknote, Smartphone, Shield, X, CheckCircle, AlertCircle, Loader2, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BillPaymentModal = ({ bill, onClose, onSuccess }) => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amount, setAmount] = useState(bill?.final_amount || bill?.total_amount || 0);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState(bill?.phone || '');
    const [insuranceProvider, setInsuranceProvider] = useState('');
    const [insuranceMemberNumber, setInsuranceMemberNumber] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // M-Pesa STK Push states
    const [stkPushSent, setStkPushSent] = useState(false);
    const [checkoutRequestId, setCheckoutRequestId] = useState('');
    const [pollingStatus, setPollingStatus] = useState('waiting'); // waiting, checking, completed, failed
    const [mpesaReceipt, setMpesaReceipt] = useState('');
    const pollingIntervalRef = useRef(null);

    const pendingAmount = (bill?.final_amount || bill?.total_amount || 0) - (bill?.amount_paid || 0);

    const paymentMethods = [
        { id: 'cash', label: 'Cash', icon: Banknote, color: 'green' },
        { id: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: 'emerald' },
        { id: 'insurance', label: 'Insurance', icon: Shield, color: 'blue' },
        { id: 'card', label: 'Card', icon: CreditCard, color: 'purple' },
    ];

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    // Poll for M-Pesa payment status
    const startPolling = (requestId) => {
        let pollCount = 0;
        const maxPolls = 60; // Poll for up to 2 minutes (60 * 2 seconds)

        pollingIntervalRef.current = setInterval(async () => {
            pollCount++;
            setPollingStatus('checking');

            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/mpesa/check/${requestId}`);
                const data = await response.json();

                if (data.status === 'completed') {
                    clearInterval(pollingIntervalRef.current);
                    setPollingStatus('completed');
                    setMpesaReceipt(data.mpesaReceipt);

                    // Wait a moment then trigger success
                    setTimeout(() => {
                        onSuccess({
                            success: true,
                            mpesaReceipt: data.mpesaReceipt,
                            totalPaid: data.amount
                        });
                        onClose();
                    }, 1500);
                } else if (data.status === 'failed') {
                    clearInterval(pollingIntervalRef.current);
                    setPollingStatus('failed');
                    setError(data.message || 'Payment was cancelled or failed');
                    setStkPushSent(false);
                } else if (pollCount >= maxPolls) {
                    clearInterval(pollingIntervalRef.current);
                    setPollingStatus('failed');
                    setError('Payment timeout. Please check your phone or try again.');
                    setStkPushSent(false);
                } else {
                    setPollingStatus('waiting');
                }
            } catch (err) {
                console.error('Polling error:', err);
                // Continue polling on network errors
                setPollingStatus('waiting');
            }
        }, 2000); // Poll every 2 seconds
    };

    const handleMpesaStkPush = async () => {
        if (!phoneNumber) {
            setError('Phone number is required for M-Pesa payment');
            return;
        }

        // Validate Kenyan phone number
        const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
        if (!/^(0|254|\+254|7|1)[0-9]{8,9}$/.test(cleanPhone)) {
            setError('Invalid phone number format. Use format: 0712345678 or 254712345678');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/mpesa/stkpush`, {
                method: 'POST',
                body: JSON.stringify({
                    phone: phoneNumber,
                    amount: parseFloat(amount),
                    billId: bill.id,
                    accountReference: `BILL-${bill.id}`,
                    description: `Hospital Bill Payment - ${bill.patient_name}`
                })
            });

            const data = await response.json();

            if (data.success) {
                setStkPushSent(true);
                setCheckoutRequestId(data.checkoutRequestId);
                setPollingStatus('waiting');
                startPolling(data.checkoutRequestId);
            } else {
                setError(data.error || 'Failed to send STK push');
            }
        } catch (err) {
            console.error('STK Push error:', err);
            setError('Failed to initiate M-Pesa payment. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleOtherPayment = async () => {
        if (amount <= 0) {
            setError('Payment amount must be greater than 0');
            return;
        }

        if (amount > pendingAmount) {
            setError(`Amount cannot exceed pending balance of KES ${pendingAmount.toFixed(2)}`);
            return;
        }

        if (paymentMethod === 'insurance' && (!insuranceProvider || !insuranceMemberNumber)) {
            setError('Insurance provider and member number are required');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const paymentData = {
                amount: parseFloat(amount),
                payment_method: paymentMethod,
                reference_number: paymentMethod === 'insurance'
                    ? `${insuranceProvider}:${insuranceMemberNumber}`
                    : referenceNumber || null
            };

            // Handle consolidated bills (multiple bill IDs)
            const billIds = bill.billIds || [bill.id];
            let totalPaid = 0;
            let remainingAmount = parseFloat(amount);

            for (const billId of billIds) {
                if (remainingAmount <= 0) break;

                const response = await authenticatedFetch(`${API_BASE_URL}/bills/${billId}/payment`, {
                    method: 'POST',
                    body: JSON.stringify({
                        ...paymentData,
                        amount: remainingAmount // Pay as much as possible on this bill
                    })
                });

                const data = await response.json();

                if (data.success) {
                    totalPaid += data.totalPaid || remainingAmount;
                    remainingAmount = 0; // For simplicity, assume bill accepted full amount
                }
            }

            if (totalPaid > 0) {
                onSuccess({ success: true, totalPaid });
                onClose();
            } else {
                setError('Payment failed');
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError('Payment failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (paymentMethod === 'mpesa') {
            await handleMpesaStkPush();
        } else {
            await handleOtherPayment();
        }
    };

    const cancelMpesaPayment = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }
        setStkPushSent(false);
        setCheckoutRequestId('');
        setPollingStatus('waiting');
    };

    const getMethodColor = (method, selected) => {
        const colors = {
            cash: selected ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-300',
            mpesa: selected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-emerald-300',
            insurance: selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300',
            card: selected ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-300',
        };
        return colors[method] || colors.cash;
    };

    // M-Pesa STK Push waiting screen
    if (stkPushSent) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl text-center">
                    {pollingStatus === 'completed' ? (
                        <>
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={40} className="text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h2>
                            <p className="text-gray-600 mb-4">M-Pesa Receipt: {mpesaReceipt}</p>
                        </>
                    ) : pollingStatus === 'failed' ? (
                        <>
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={40} className="text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-red-700 mb-2">Payment Failed</h2>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <button
                                onClick={cancelMpesaPayment}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                            >
                                Try Again
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Loader2 size={40} className="text-emerald-600 animate-spin" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Phone</h2>
                            <p className="text-gray-600 mb-2">
                                An M-Pesa prompt has been sent to
                            </p>
                            <p className="text-lg font-semibold text-emerald-600 mb-4">{phoneNumber}</p>
                            <p className="text-sm text-gray-500 mb-6">
                                Enter your M-Pesa PIN to complete the payment of <strong>KES {parseFloat(amount).toFixed(2)}</strong>
                            </p>

                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                                <Loader2 size={16} className="animate-spin" />
                                <span>Waiting for confirmation...</span>
                            </div>

                            <button
                                onClick={cancelMpesaPayment}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel Payment
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Process Payment</h2>
                        <p className="text-sm text-gray-500">Bill #{bill?.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Bill Summary */}
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-4 mb-6 border border-teal-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Patient</p>
                            <p className="font-semibold text-gray-800">{bill?.patient_name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Total Bill</p>
                            <p className="font-bold text-lg text-gray-800">
                                KES {(bill?.final_amount || bill?.total_amount || 0).toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Amount Paid</p>
                            <p className="font-semibold text-green-600">
                                KES {(bill?.amount_paid || 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Pending Balance</p>
                            <p className="font-bold text-lg text-orange-600">
                                KES {pendingAmount.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                        <AlertCircle size={18} className="text-red-600" />
                        <span className="text-sm text-red-700">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Payment Method Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {paymentMethods.map(method => {
                                const Icon = method.icon;
                                return (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition ${getMethodColor(method.id, paymentMethod === method.id)
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span className="font-medium">{method.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Amount (KES) *
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            max={pendingAmount}
                            step="0.01"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            required
                        />
                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                            <button
                                type="button"
                                onClick={() => setAmount(pendingAmount)}
                                className="text-teal-600 hover:underline"
                            >
                                Pay full amount
                            </button>
                            <span>Max: KES {pendingAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* M-Pesa Phone Number */}
                    {paymentMethod === 'mpesa' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Phone size={14} className="inline mr-1" />
                                M-Pesa Phone Number *
                            </label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="0712345678"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                A payment prompt will be sent to this number
                            </p>
                        </div>
                    )}

                    {/* Insurance Details */}
                    {paymentMethod === 'insurance' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Insurance Provider *
                                </label>
                                <select
                                    value={insuranceProvider}
                                    onChange={(e) => setInsuranceProvider(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select provider...</option>
                                    <option value="NHIF">NHIF</option>
                                    <option value="SHA">SHA (Social Health Authority)</option>
                                    <option value="Jubilee">Jubilee Insurance</option>
                                    <option value="AAR">AAR Insurance</option>
                                    <option value="Britam">Britam</option>
                                    <option value="CIC">CIC Insurance</option>
                                    <option value="Madison">Madison Insurance</option>
                                    <option value="UAP">UAP Old Mutual</option>
                                    <option value="Resolution">Resolution Insurance</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Member/Policy Number *
                                </label>
                                <input
                                    type="text"
                                    value={insuranceMemberNumber}
                                    onChange={(e) => setInsuranceMemberNumber(e.target.value)}
                                    placeholder="Enter member number"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Card/Cash Reference */}
                    {(paymentMethod === 'card' || paymentMethod === 'cash') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reference Number (Optional)
                            </label>
                            <input
                                type="text"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                placeholder={paymentMethod === 'card' ? 'Card transaction reference' : 'Receipt number'}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || pendingAmount <= 0}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition font-medium ${paymentMethod === 'mpesa'
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-teal-600 hover:bg-teal-700'
                                } disabled:bg-gray-400`}
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    {paymentMethod === 'mpesa' ? 'Sending...' : 'Processing...'}
                                </>
                            ) : (
                                <>
                                    {paymentMethod === 'mpesa' ? (
                                        <>
                                            <Smartphone size={18} />
                                            Send STK Push
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={18} />
                                            Confirm Payment
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BillPaymentModal;
