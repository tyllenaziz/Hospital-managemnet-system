import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FollowUpModal = ({ patient, onClose, onSuccess }) => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [followUpData, setFollowUpData] = useState({
        scheduled_date: '',
        scheduled_time: '',
        purpose: '',
        department: 'nurse',
        notes: ''
    });

    const handleScheduleFollowUp = async () => {
        if (!patient || !followUpData.scheduled_date || !followUpData.purpose) {
            setError('Please fill in date and purpose for the follow-up');
            return;
        }

        try {
            setSaving(true);
            setError('');
            const response = await authenticatedFetch(`${API_BASE_URL}/follow-ups/schedule`, {
                method: 'POST',
                body: JSON.stringify({
                    patient_id: patient.patient_id || patient.id,
                    scheduled_date: followUpData.scheduled_date,
                    scheduled_time: followUpData.scheduled_time || null,
                    purpose: followUpData.purpose,
                    department: followUpData.department,
                    notes: followUpData.notes || null
                })
            });

            const data = await response.json();

            if (data.success) {
                if (onSuccess) onSuccess(data);
                onClose();
            } else {
                setError(data.error || 'Failed to schedule follow-up');
            }
        } catch (err) {
            console.error('Error scheduling follow-up:', err);
            setError('Failed to schedule follow-up');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Calendar className="text-purple-600" size={24} />
                    Schedule Follow-up
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
                            Date *
                        </label>
                        <input
                            type="date"
                            value={followUpData.scheduled_date}
                            onChange={(e) => setFollowUpData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time (Optional)
                        </label>
                        <input
                            type="time"
                            value={followUpData.scheduled_time}
                            onChange={(e) => setFollowUpData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Purpose *
                        </label>
                        <select
                            value={followUpData.purpose}
                            onChange={(e) => setFollowUpData(prev => ({ ...prev, purpose: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                            required
                        >
                            <option value="">-- Select Purpose --</option>
                            <option value="ANC Visit">ANC Visit</option>
                            <option value="BP Check">BP Check</option>
                            <option value="Glucose Review">Glucose Review</option>
                            <option value="Lab Results Follow-up">Lab Results Follow-up</option>
                            <option value="Medication Review">Medication Review</option>
                            <option value="Post-Surgery Checkup">Post-Surgery Checkup</option>
                            <option value="Wound Dressing">Wound Dressing</option>
                            <option value="General Checkup">General Checkup</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Required Department *
                        </label>
                        <select
                            value={followUpData.department}
                            onChange={(e) => setFollowUpData(prev => ({ ...prev, department: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                            required
                        >
                            <option value="nurse">Nurse Only</option>
                            <option value="doctor">Doctor</option>
                            <option value="lab">Laboratory</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={followUpData.notes}
                            onChange={(e) => setFollowUpData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                            rows={3}
                            placeholder="Additional instructions or notes..."
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
                        onClick={handleScheduleFollowUp}
                        disabled={saving}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition"
                    >
                        {saving ? 'Scheduling...' : 'Schedule Follow-up'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FollowUpModal;
