import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';


const NurseClinicVisit = () => {
    const { enrollmentId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [enrollment, setEnrollment] = useState(null);
    const [lastVisit, setLastVisit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [vitals, setVitals] = useState({
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        blood_sugar: '',
        weight: '',
        pulse_rate: '',
        temperature: '',
        oxygen_saturation: '',
        nurse_notes: '',
        current_medications: '',
        visit_type: 'scheduled'
    });

    useEffect(() => {
        fetchData();
    }, [enrollmentId]);

    const fetchData = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };

            const [enrollmentRes, historyRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/chronic/enrollment/${enrollmentId}`, { headers }),
                axios.get(`${API_BASE_URL}/clinic-visits/enrollment/${enrollmentId}/history?limit=1`, { headers })
            ]);

            setEnrollment(enrollmentRes.data.enrollment);
            if (historyRes.data.visits?.length > 0) {
                setLastVisit(historyRes.data.visits[0]);
            }
        } catch (err) {
            setError('Failed to fetch enrollment data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/clinic-visits/record`, {
                enrollment_id: enrollmentId,
                ...vitals
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Clinic visit recorded successfully');

            // Show comparison results
            if (response.data.visit?.is_abnormal) {
                setError(`⚠️ Abnormal values detected: ${response.data.visit.abnormal_flags.map(f => f.message).join(', ')}`);
            }

            setTimeout(() => navigate(-1), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to record visit');
        } finally {
            setSubmitting(false);
        }
    };

    const getComparisonColor = (value) => {
        if (!value) return '';
        const num = parseFloat(value);
        if (num > 0) return 'text-red-600';
        if (num < 0) return 'text-green-600';
        return 'text-gray-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{enrollment?.patient_name}</h1>
                        <p className="text-gray-600">
                            {enrollment?.patient_number} | {enrollment?.age} years | {enrollment?.gender}
                        </p>
                        <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {enrollment?.clinic_name}
                        </span>
                    </div>
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
                        ← Back
                    </button>
                </div>
            </div>

            {/* Baseline & Last Visit Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Baseline */}
                <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">📋 Baseline Values</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <span>BP: {enrollment?.baseline_bp_systolic || '-'}/{enrollment?.baseline_bp_diastolic || '-'} mmHg</span>
                        <span>Weight: {enrollment?.baseline_weight || '-'} kg</span>
                        <span>Sugar: {enrollment?.baseline_blood_sugar || '-'} mg/dL</span>
                    </div>
                </div>

                {/* Last Visit */}
                {lastVisit && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-700 mb-2">
                            📅 Last Visit ({new Date(lastVisit.visit_date).toLocaleDateString()})
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span>BP: {lastVisit.blood_pressure_systolic || '-'}/{lastVisit.blood_pressure_diastolic || '-'} mmHg</span>
                            <span>Weight: {lastVisit.weight || '-'} kg</span>
                            <span>Sugar: {lastVisit.blood_sugar || '-'} mg/dL</span>
                            <span>Pulse: {lastVisit.pulse_rate || '-'} bpm</span>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className={`border px-4 py-3 rounded mb-4 ${error.startsWith('⚠️')
                    ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                    : 'bg-red-100 border-red-400 text-red-700'
                    }`}>
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            {/* Vitals Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Record Clinic Visit</h2>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Blood Pressure */}
                        <div className="col-span-2 lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Blood Pressure (mmHg)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Systolic"
                                    value={vitals.blood_pressure_systolic}
                                    onChange={(e) => setVitals({ ...vitals, blood_pressure_systolic: e.target.value })}
                                    className="w-1/2 border rounded-lg px-3 py-2"
                                />
                                <span className="self-center">/</span>
                                <input
                                    type="number"
                                    placeholder="Diastolic"
                                    value={vitals.blood_pressure_diastolic}
                                    onChange={(e) => setVitals({ ...vitals, blood_pressure_diastolic: e.target.value })}
                                    className="w-1/2 border rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>

                        {/* Blood Sugar */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Blood Sugar (mg/dL)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={vitals.blood_sugar}
                                onChange={(e) => setVitals({ ...vitals, blood_sugar: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* Weight */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Weight (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={vitals.weight}
                                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* Pulse Rate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pulse Rate (bpm)
                            </label>
                            <input
                                type="number"
                                value={vitals.pulse_rate}
                                onChange={(e) => setVitals({ ...vitals, pulse_rate: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* Temperature */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Temperature (°C)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={vitals.temperature}
                                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* Oxygen Saturation */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                SpO2 (%)
                            </label>
                            <input
                                type="number"
                                value={vitals.oxygen_saturation}
                                onChange={(e) => setVitals({ ...vitals, oxygen_saturation: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                                min="0"
                                max="100"
                            />
                        </div>

                        {/* Visit Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Visit Type
                            </label>
                            <select
                                value={vitals.visit_type}
                                onChange={(e) => setVitals({ ...vitals, visit_type: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="scheduled">Scheduled</option>
                                <option value="walk_in">Walk-in</option>
                                <option value="emergency">Emergency</option>
                            </select>
                        </div>
                    </div>

                    {/* Current Medications */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Medications
                        </label>
                        <textarea
                            value={vitals.current_medications}
                            onChange={(e) => setVitals({ ...vitals, current_medications: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2"
                            rows={2}
                            placeholder="List current medications..."
                        />
                    </div>

                    {/* Nurse Notes */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nurse Notes
                        </label>
                        <textarea
                            value={vitals.nurse_notes}
                            onChange={(e) => setVitals({ ...vitals, nurse_notes: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2"
                            rows={3}
                            placeholder="Observations, symptoms, concerns..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Save Visit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NurseClinicVisit;
