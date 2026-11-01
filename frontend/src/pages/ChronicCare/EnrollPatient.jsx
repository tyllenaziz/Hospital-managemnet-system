import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';


const EnrollPatient = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [patient, setPatient] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState('');
    const [baselineData, setBaselineData] = useState({
        baseline_notes: '',
        baseline_weight: '',
        baseline_bp_systolic: '',
        baseline_bp_diastolic: '',
        baseline_blood_sugar: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, [patientId]);

    const fetchData = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };

            const [patientRes, clinicsRes, enrollmentsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/patients/${patientId}`, { headers }),
                axios.get(`${API_BASE_URL}/chronic/clinics?active_only=true`, { headers }),
                axios.get(`${API_BASE_URL}/chronic/patient/${patientId}/enrollments`, { headers })
            ]);

            setPatient(patientRes.data.patient);
            setClinics(clinicsRes.data.clinics || []);
            setEnrollments(enrollmentsRes.data.enrollments || []);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await axios.post(`${API_BASE_URL}/chronic/enroll`, {
                patient_id: patientId,
                clinic_id: selectedClinic,
                ...baselineData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Patient enrolled successfully');
            setShowEnrollModal(false);
            setSelectedClinic('');
            setBaselineData({
                baseline_notes: '',
                baseline_weight: '',
                baseline_bp_systolic: '',
                baseline_bp_diastolic: '',
                baseline_blood_sugar: ''
            });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to enroll patient');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            discharged: 'bg-gray-100 text-gray-800',
            transferred: 'bg-yellow-100 text-yellow-800',
            deceased: 'bg-red-100 text-red-800',
            lost_to_follow_up: 'bg-orange-100 text-orange-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const availableClinics = clinics.filter(
        c => !enrollments.some(e => e.clinic_id === c.id && e.status === 'active')
    );

    return (
        <div className="p-6">
            {/* Patient Header */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{patient?.name}</h1>
                        <p className="text-gray-600">
                            {patient?.patient_number} | {patient?.age} years | {patient?.gender}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ← Back
                    </button>
                </div>
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

            {/* Enrollments */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Chronic Care Enrollments</h2>
                    {availableClinics.length > 0 && (
                        <button
                            onClick={() => setShowEnrollModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            + Enroll in Clinic
                        </button>
                    )}
                </div>

                {enrollments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Patient is not enrolled in any chronic care clinic.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {enrollments.map((enrollment) => (
                            <div
                                key={enrollment.id}
                                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                                onClick={() => navigate(`/chronic/enrollment/${enrollment.id}`)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg">{enrollment.clinic_name}</h3>
                                        <span className="text-sm text-gray-500">
                                            Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(enrollment.status)}`}>
                                        {enrollment.status}
                                    </span>
                                </div>

                                <div className="mt-3 flex gap-4 text-sm text-gray-600">
                                    <span>📊 {enrollment.total_visits || 0} visits</span>
                                    {enrollment.last_visit_date && (
                                        <span>📅 Last visit: {new Date(enrollment.last_visit_date).toLocaleDateString()}</span>
                                    )}
                                </div>

                                {enrollment.baseline_notes && (
                                    <p className="mt-2 text-sm text-gray-600 italic">
                                        Baseline: {enrollment.baseline_notes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Enroll Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Enroll Patient in Chronic Clinic</h2>

                        <form onSubmit={handleEnroll}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Clinic *
                                </label>
                                <select
                                    value={selectedClinic}
                                    onChange={(e) => setSelectedClinic(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2"
                                    required
                                >
                                    <option value="">-- Select a clinic --</option>
                                    {availableClinics.map((clinic) => (
                                        <option key={clinic.id} value={clinic.id}>
                                            {clinic.name} ({clinic.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="font-medium mb-3">Baseline Measurements (Optional)</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={baselineData.baseline_weight}
                                            onChange={(e) => setBaselineData({ ...baselineData, baseline_weight: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Blood Sugar (mg/dL)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={baselineData.baseline_blood_sugar}
                                            onChange={(e) => setBaselineData({ ...baselineData, baseline_blood_sugar: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">BP Systolic (mmHg)</label>
                                        <input
                                            type="number"
                                            value={baselineData.baseline_bp_systolic}
                                            onChange={(e) => setBaselineData({ ...baselineData, baseline_bp_systolic: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">BP Diastolic (mmHg)</label>
                                        <input
                                            type="number"
                                            value={baselineData.baseline_bp_diastolic}
                                            onChange={(e) => setBaselineData({ ...baselineData, baseline_bp_diastolic: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm text-gray-600 mb-1">Baseline Notes</label>
                                    <textarea
                                        value={baselineData.baseline_notes}
                                        onChange={(e) => setBaselineData({ ...baselineData, baseline_notes: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                        rows={3}
                                        placeholder="Initial condition, existing medications, history..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEnrollModal(false)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Enroll Patient
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnrollPatient;
