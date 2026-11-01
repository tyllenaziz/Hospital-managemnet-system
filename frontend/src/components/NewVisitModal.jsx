import { useState } from 'react';
import { Calendar, Stethoscope, Heart, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ConsultationPaymentModal from './ConsultationPaymentModal';

const NewVisitModal = ({ patient, onClose, onSuccess }) => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [formData, setFormData] = useState({
        initial_queue: 'nurse',
        reason: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingFormData, setPendingFormData] = useState(null);

    // First step: Show payment modal
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Store form data and show payment modal
        setPendingFormData({ ...formData });
        setShowPaymentModal(true);
    };

    // Second step: After payment confirmed, create visit
    const handlePaymentComplete = async (paymentDetails) => {
        if (!pendingFormData) return;

        setShowPaymentModal(false);
        setSaving(true);
        setError('');

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/patients/${patient.id}/visit`, {
                method: 'POST',
                body: JSON.stringify({
                    ...pendingFormData,
                    payment: paymentDetails // Include payment details
                })
            });

            const data = await response.json();

            if (data.success) {
                onSuccess(data);
                onClose();
            } else {
                setError(data.error || 'Failed to create visit');
            }
        } catch (err) {
            console.error('Error creating visit:', err);
            setError('Failed to create visit. Please try again.');
        } finally {
            setSaving(false);
            setPendingFormData(null);
        }
    };

    const handlePaymentCancel = () => {
        setShowPaymentModal(false);
        setPendingFormData(null);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Calendar className="text-teal-600" size={24} />
                            New Visit
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-full transition"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Patient Info */}
                    <div className="bg-teal-50 rounded-lg p-3 mb-4 border border-teal-200">
                        <p className="font-semibold text-gray-800">{patient.name}</p>
                        <p className="text-sm text-gray-600">
                            {patient.patient_number || `ID: ${patient.id}`} • {patient.age} yrs • {patient.gender}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Queue Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Send Patient To *
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, initial_queue: 'nurse' }))}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition ${formData.initial_queue === 'nurse'
                                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Heart size={20} />
                                    <span className="font-medium">Nurse</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, initial_queue: 'doctor' }))}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition ${formData.initial_queue === 'doctor'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Stethoscope size={20} />
                                    <span className="font-medium">Doctor</span>
                                </button>
                            </div>
                        </div>

                        {/* Reason for Visit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reason for Visit / Symptoms
                            </label>
                            <textarea
                                value={formData.reason}
                                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                rows={3}
                                placeholder="e.g., Fever and headache for 2 days..."
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition font-medium"
                            >
                                {saving ? 'Creating...' : 'Proceed to Payment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <ConsultationPaymentModal
                    patientData={patient}
                    onPaymentComplete={handlePaymentComplete}
                    onCancel={handlePaymentCancel}
                    isReturningPatient={true}
                />
            )}
        </>
    );
};

export default NewVisitModal;
