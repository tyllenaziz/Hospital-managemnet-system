import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';


const DoctorReview = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const [pendingReviews, setPendingReviews] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState('');
    const [loading, setLoading] = useState(true);
    const [reviewingVisit, setReviewingVisit] = useState(null);
    const [reviewData, setReviewData] = useState({
        doctor_notes: '',
        medication_changes: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, [selectedClinic]);

    const fetchData = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };

            let url = `${API_BASE_URL}/clinic-visits/pending-reviews`;
            if (selectedClinic) {
                url += `?clinic_id=${selectedClinic}`;
            }

            const [reviewsRes, clinicsRes] = await Promise.all([
                axios.get(url, { headers }),
                axios.get(`${API_BASE_URL}/chronic/clinics?active_only=true`, { headers })
            ]);

            setPendingReviews(reviewsRes.data.visits || []);
            setClinics(clinicsRes.data.clinics || []);
        } catch (err) {
            setError('Failed to fetch pending reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await axios.put(`${API_BASE_URL}/clinic-visits/${reviewingVisit.id}/review`, reviewData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Visit reviewed successfully');
            setReviewingVisit(null);
            setReviewData({ doctor_notes: '', medication_changes: '' });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to review visit');
        }
    };

    const handleEscalate = async (visitId) => {
        try {
            await axios.post(`${API_BASE_URL}/clinic-visits/${visitId}/escalate`, {
                reason: 'Escalated for full consultation'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Patient escalated to full consultation');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to escalate');
        }
    };

    const getSeverityColor = (severity) => {
        const colors = {
            critical: 'bg-red-100 text-red-800 border-red-300',
            warning: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
        return colors[severity] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Doctor Review - Clinic Visits</h1>

                <select
                    value={selectedClinic}
                    onChange={(e) => setSelectedClinic(e.target.value)}
                    className="border rounded-lg px-4 py-2"
                >
                    <option value="">All Clinics</option>
                    {clinics.map((clinic) => (
                        <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            {pendingReviews.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
                    <p className="text-lg">No pending reviews</p>
                    <p className="text-sm mt-2">All clinic visits have been reviewed</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingReviews.map((visit) => (
                        <div
                            key={visit.id}
                            className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${visit.is_abnormal ? 'border-red-500' : 'border-green-500'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold">{visit.patient_name}</h3>
                                    <p className="text-gray-600 text-sm">
                                        {visit.patient_number} | {visit.age} years | {visit.gender}
                                    </p>
                                    <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                        {visit.clinic_name}
                                    </span>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                    <p>Recorded: {new Date(visit.visit_date).toLocaleDateString()}</p>
                                    <p>By: {visit.recorded_by_name}</p>
                                </div>
                            </div>

                            {/* Vitals */}
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-gray-500">BP:</span>{' '}
                                    <span className="font-medium">
                                        {visit.blood_pressure_systolic || '-'}/{visit.blood_pressure_diastolic || '-'}
                                    </span>
                                    {visit.bp_change_from_last && (
                                        <span className="text-xs ml-1 text-gray-400">({visit.bp_change_from_last})</span>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-gray-500">Sugar:</span>{' '}
                                    <span className="font-medium">{visit.blood_sugar || '-'} mg/dL</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-gray-500">Weight:</span>{' '}
                                    <span className="font-medium">{visit.weight || '-'} kg</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-gray-500">Pulse:</span>{' '}
                                    <span className="font-medium">{visit.pulse_rate || '-'} bpm</span>
                                </div>
                            </div>

                            {/* Abnormal Flags */}
                            {visit.abnormal_flags && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {JSON.parse(visit.abnormal_flags).map((flag, idx) => (
                                        <span
                                            key={idx}
                                            className={`px-2 py-1 rounded text-xs border ${getSeverityColor(flag.severity)}`}
                                        >
                                            ⚠️ {flag.message}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Nurse Notes */}
                            {visit.nurse_notes && (
                                <div className="mt-3 p-3 bg-yellow-50 rounded text-sm">
                                    <span className="font-medium">Nurse Notes:</span> {visit.nurse_notes}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-4 flex justify-end gap-3">
                                {visit.is_abnormal && (
                                    <button
                                        onClick={() => handleEscalate(visit.id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                    >
                                        🚨 Escalate to Consultation
                                    </button>
                                )}
                                <button
                                    onClick={() => setReviewingVisit(visit)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                >
                                    ✓ Review & Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {reviewingVisit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">Review Visit - {reviewingVisit.patient_name}</h2>

                        <form onSubmit={handleReview}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Doctor Notes
                                </label>
                                <textarea
                                    value={reviewData.doctor_notes}
                                    onChange={(e) => setReviewData({ ...reviewData, doctor_notes: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                    rows={3}
                                    placeholder="Assessment, recommendations..."
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Medication Changes
                                </label>
                                <textarea
                                    value={reviewData.medication_changes}
                                    onChange={(e) => setReviewData({ ...reviewData, medication_changes: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                    rows={3}
                                    placeholder="Any changes to medication regimen..."
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setReviewingVisit(null)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Approve Visit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorReview;
