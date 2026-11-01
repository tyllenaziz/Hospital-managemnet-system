import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChronicEnrollmentModal = ({ patient, onClose, onSuccess }) => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [clinics, setClinics] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [enrollmentData, setEnrollmentData] = useState({
        clinic_id: '',
        baseline_notes: '',
        baseline_weight: '',
        baseline_bp_systolic: '',
        baseline_bp_diastolic: '',
        baseline_blood_sugar: ''
    });

    useEffect(() => {
        fetchClinics();
    }, []);

    const fetchClinics = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/chronic/clinics?active_only=true`);
            const data = await response.json();
            if (data.clinics) {
                setClinics(data.clinics);
            }
        } catch (err) {
            console.error('Error fetching clinics:', err);
        }
    };

    const handleEnrollInClinic = async () => {
        if (!patient || !enrollmentData.clinic_id) {
            setError('Please select a clinic');
            return;
        }

        try {
            setSaving(true);
            setError('');
            const response = await authenticatedFetch(`${API_BASE_URL}/chronic/enroll`, {
                method: 'POST',
                body: JSON.stringify({
                    patient_id: patient.patient_id || patient.id,
                    clinic_id: enrollmentData.clinic_id,
                    baseline_notes: enrollmentData.baseline_notes || null,
                    baseline_weight: enrollmentData.baseline_weight || null,
                    baseline_bp_systolic: enrollmentData.baseline_bp_systolic || null,
                    baseline_bp_diastolic: enrollmentData.baseline_bp_diastolic || null,
                    baseline_blood_sugar: enrollmentData.baseline_blood_sugar || null
                })
            });

            const data = await response.json();

            if (data.success) {
                if (onSuccess) onSuccess(data);
                onClose();
            } else {
                setError(data.error || 'Failed to enroll patient');
            }
        } catch (err) {
            console.error('Error enrolling patient:', err);
            setError('Failed to enroll patient');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <UserPlus className="text-indigo-600" size={24} />
                    Enroll in Chronic Care Clinic
                </h2>

                {patient && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="font-medium text-gray-800">{patient.name}</p>
                        <p className="text-sm text-gray-600">{patient.patient_number || patient.id_number}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Clinic *
                        </label>
                        <select
                            value={enrollmentData.clinic_id}
                            onChange={(e) => setEnrollmentData(prev => ({ ...prev, clinic_id: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="">-- Select a Clinic --</option>
                            {clinics.map(clinic => (
                                <option key={clinic.id} value={clinic.id}>
                                    {clinic.name} ({clinic.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Baseline Measurements (Optional)</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={enrollmentData.baseline_weight}
                                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, baseline_weight: e.target.value }))}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    placeholder="e.g., 70"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Blood Sugar (mg/dL)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={enrollmentData.baseline_blood_sugar}
                                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, baseline_blood_sugar: e.target.value }))}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    placeholder="e.g., 110"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">BP Systolic (mmHg)</label>
                                <input
                                    type="number"
                                    value={enrollmentData.baseline_bp_systolic}
                                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, baseline_bp_systolic: e.target.value }))}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    placeholder="e.g., 120"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">BP Diastolic (mmHg)</label>
                                <input
                                    type="number"
                                    value={enrollmentData.baseline_bp_diastolic}
                                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, baseline_bp_diastolic: e.target.value }))}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    placeholder="e.g., 80"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={enrollmentData.baseline_notes}
                            onChange={(e) => setEnrollmentData(prev => ({ ...prev, baseline_notes: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                            rows={3}
                            placeholder="Initial condition, existing medications, history..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleEnrollInClinic}
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
                    >
                        {saving ? 'Enrolling...' : 'Enroll Patient'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChronicEnrollmentModal;
