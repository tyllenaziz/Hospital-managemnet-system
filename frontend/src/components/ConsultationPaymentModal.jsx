import { useState, useEffect } from 'react';
import { X, CreditCard, Phone, CheckCircle, Loader, AlertCircle, Banknote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ConsultationPaymentModal = ({
    patientData,
    onPaymentComplete,
    onCancel,
    isReturningPatient = false
}) => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [consultationFee, setConsultationFee] = useState(500); // Default
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [mpesaReference, setMpesaReference] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingFee, setLoadingFee] = useState(true);
    const [error, setError] = useState(null);
    const [mpesaInitiated, setMpesaInitiated] = useState(false);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);

    // Fetch consultation fee from settings
    useEffect(() => {
        fetchConsultationFee();
    }, []);

    const fetchConsultationFee = async () => {
        try {
            setLoadingFee(true);
            const response = await authenticatedFetch(`${API_BASE_URL}/settings`);
            const data = await response.json();
            if (data.success && data.settings?.consultation_fee) {
                setConsultationFee(parseFloat(data.settings.consultation_fee));
            }
        } catch (err) {
            console.error('Error fetching consultation fee:', err);
        } finally {
            setLoadingFee(false);
        }
    };

    const handleMpesaInitiate = async () => {
        if (!mpesaPhone || !/^0[17]\d{8}$/.test(mpesaPhone)) {
            setError('Please enter a valid phone number (e.g., 0712345678)');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Convert to international format
            const phone = `254${mpesaPhone.substring(1)}`;

            const response = await authenticatedFetch(`${API_BASE_URL}/mpesa/stkpush`, {
                method: 'POST',
                body: JSON.stringify({
                    phone,
                    amount: consultationFee,
                    accountReference: `CONSULT-${patientData?.name?.substring(0, 10) || 'NEW'}`,
                    transactionDesc: 'Consultation Fee Payment'
                })
            });

            const data = await response.json();

            if (data.success) {
                setMpesaInitiated(true);
                // Start polling for payment confirmation or wait for user to enter reference
            } else {
                setError(data.error || 'Failed to initiate M-Pesa payment');
            }
        } catch (err) {
            console.error('M-Pesa error:', err);
            setError('Failed to initiate M-Pesa payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (paymentMethod === 'mpesa' && !mpesaReference.trim()) {
            setError('Please enter the M-Pesa confirmation code');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Complete the payment and registration
            const paymentDetails = {
                payment_method: paymentMethod,
                amount: consultationFee,
                reference: paymentMethod === 'mpesa' ? mpesaReference.trim() : null
            };

            setPaymentConfirmed(true);

            // Small delay for visual feedback
            setTimeout(() => {
                onPaymentComplete(paymentDetails);
            }, 500);

        } catch (err) {
            console.error('Payment confirmation error:', err);
            setError('Failed to confirm payment. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Consultation Fee Payment</h2>
                        <p className="text-teal-100 text-sm">
                            {isReturningPatient ? 'Returning patient visit' : 'New patient registration'}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-white/10 rounded-lg transition text-white"
                        disabled={loading || paymentConfirmed}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Patient Info */}
                    {patientData?.name && (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-sm text-gray-600">Patient</p>
                            <p className="font-semibold text-gray-800">{patientData.name}</p>
                            {patientData.phone && (
                                <p className="text-sm text-gray-600">{patientData.phone}</p>
                            )}
                        </div>
                    )}

                    {/* Fee Amount */}
                    <div className="text-center py-4 bg-teal-50 rounded-xl border border-teal-200">
                        <p className="text-sm text-teal-700 mb-1">Amount to Pay</p>
                        {loadingFee ? (
                            <div className="flex justify-center">
                                <Loader className="animate-spin text-teal-600" size={24} />
                            </div>
                        ) : (
                            <p className="text-3xl font-bold text-teal-700">
                                KES {consultationFee.toLocaleString()}
                            </p>
                        )}
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                        <p className="font-medium text-gray-700">Select Payment Method</p>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Cash Option */}
                            <button
                                type="button"
                                onClick={() => {
                                    setPaymentMethod('cash');
                                    setError(null);
                                }}
                                disabled={loading || paymentConfirmed}
                                className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${paymentMethod === 'cash'
                                        ? 'border-teal-500 bg-teal-50'
                                        : 'border-gray-200 hover:border-teal-300'
                                    }`}
                            >
                                <Banknote size={28} className={paymentMethod === 'cash' ? 'text-teal-600' : 'text-gray-500'} />
                                <span className={`font-medium ${paymentMethod === 'cash' ? 'text-teal-700' : 'text-gray-700'}`}>
                                    Cash
                                </span>
                            </button>

                            {/* M-Pesa Option */}
                            <button
                                type="button"
                                onClick={() => {
                                    setPaymentMethod('mpesa');
                                    setError(null);
                                }}
                                disabled={loading || paymentConfirmed}
                                className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${paymentMethod === 'mpesa'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-green-300'
                                    }`}
                            >
                                <Phone size={28} className={paymentMethod === 'mpesa' ? 'text-green-600' : 'text-gray-500'} />
                                <span className={`font-medium ${paymentMethod === 'mpesa' ? 'text-green-700' : 'text-gray-700'}`}>
                                    M-Pesa
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* M-Pesa Details */}
                    {paymentMethod === 'mpesa' && (
                        <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                            {!mpesaInitiated ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            M-Pesa Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={mpesaPhone}
                                            onChange={(e) => setMpesaPhone(e.target.value)}
                                            placeholder="0712345678"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            disabled={loading}
                                        />
                                    </div>
                                    <button
                                        onClick={handleMpesaInitiate}
                                        disabled={loading || !mpesaPhone}
                                        className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader className="animate-spin" size={18} />
                                                Sending STK Push...
                                            </>
                                        ) : (
                                            <>
                                                <Phone size={18} />
                                                Send Payment Request
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="text-center text-green-700 mb-3">
                                        <CheckCircle size={32} className="mx-auto mb-2" />
                                        <p className="font-medium">STK Push sent!</p>
                                        <p className="text-sm">Check your phone and enter PIN</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            M-Pesa Confirmation Code
                                        </label>
                                        <input
                                            type="text"
                                            value={mpesaReference}
                                            onChange={(e) => setMpesaReference(e.target.value.toUpperCase())}
                                            placeholder="e.g., SJK3H5K7L2"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 uppercase"
                                            disabled={loading}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setMpesaInitiated(false);
                                            setMpesaReference('');
                                        }}
                                        className="text-sm text-green-600 hover:underline"
                                        disabled={loading}
                                    >
                                        Resend payment request
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            <AlertCircle size={18} />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {paymentConfirmed && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                            <CheckCircle size={18} />
                            <p className="text-sm font-medium">Payment confirmed! Processing registration...</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading || paymentConfirmed}
                        className="flex-1 py-2.5 px-4 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-medium rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmPayment}
                        disabled={loading || paymentConfirmed || loadingFee || (paymentMethod === 'mpesa' && !mpesaInitiated)}
                        className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                    >
                        {loading || paymentConfirmed ? (
                            <>
                                <Loader className="animate-spin" size={18} />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                Confirm Payment
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsultationPaymentModal;
