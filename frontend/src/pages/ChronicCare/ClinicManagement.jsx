import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';


const ClinicManagement = () => {
    const { token } = useAuth();
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        default_follow_up_days: 30
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchClinics();
    }, []);

    const fetchClinics = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/chronic/clinics`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClinics(response.data.clinics || []);
        } catch (err) {
            setError('Failed to fetch clinics');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await axios.post(`${API_BASE_URL}/chronic/clinics`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Clinic created successfully');
            setShowModal(false);
            setFormData({ name: '', code: '', description: '', default_follow_up_days: 30 });
            fetchClinics();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create clinic');
        }
    };

    const handleToggleActive = async (clinicId, currentStatus) => {
        try {
            await axios.put(`${API_BASE_URL}/chronic/clinics/${clinicId}`,
                { is_active: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchClinics();
        } catch (err) {
            setError('Failed to update clinic status');
        }
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
                <h1 className="text-2xl font-bold text-gray-800">Chronic Care Clinic Management</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    + Add New Clinic
                </button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clinics.map((clinic) => (
                    <div
                        key={clinic.id}
                        className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${clinic.is_active ? 'border-green-500' : 'border-gray-400'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">{clinic.name}</h3>
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                                    {clinic.code}
                                </span>
                            </div>
                            <button
                                onClick={() => handleToggleActive(clinic.id, clinic.is_active)}
                                className={`text-sm px-3 py-1 rounded ${clinic.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {clinic.is_active ? 'Active' : 'Inactive'}
                            </button>
                        </div>

                        {clinic.description && (
                            <p className="text-gray-600 text-sm mt-2">{clinic.description}</p>
                        )}

                        <div className="mt-4 flex justify-between text-sm text-gray-500">
                            <span>📅 Follow-up: {clinic.default_follow_up_days} days</span>
                            <span>👥 {clinic.enrolled_patients || 0} patients</span>
                        </div>
                    </div>
                ))}
            </div>

            {clinics.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No clinics found. Click "Add New Clinic" to create one.
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New Clinic</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Clinic Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Code * (e.g., DM, HTN, HIV)
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full border rounded-lg px-3 py-2"
                                    maxLength={10}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                    rows={3}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Default Follow-up (days)
                                </label>
                                <input
                                    type="number"
                                    value={formData.default_follow_up_days}
                                    onChange={(e) => setFormData({ ...formData, default_follow_up_days: parseInt(e.target.value) })}
                                    className="w-full border rounded-lg px-3 py-2"
                                    min={1}
                                    max={365}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create Clinic
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicManagement;
