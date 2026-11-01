import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';


const Defaulters = () => {
    const { token } = useAuth();
    const [defaulters, setDefaulters] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState('');
    const [minMissed, setMinMissed] = useState(2);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, [selectedClinic, minMissed]);

    const fetchData = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };

            let url = `${API_BASE_URL}/follow-ups/defaulters?min_missed=${minMissed}`;
            if (selectedClinic) {
                url += `&clinic_id=${selectedClinic}`;
            }

            const [defaultersRes, clinicsRes] = await Promise.all([
                axios.get(url, { headers }),
                axios.get(`${API_BASE_URL}/chronic/clinics?active_only=true`, { headers })
            ]);

            setDefaulters(defaultersRes.data.defaulters || []);
            setClinics(clinicsRes.data.clinics || []);
        } catch (err) {
            setError('Failed to fetch defaulters');
        } finally {
            setLoading(false);
        }
    };

    const getMissedCountColor = (count) => {
        if (count >= 5) return 'bg-red-100 text-red-800';
        if (count >= 3) return 'bg-orange-100 text-orange-800';
        return 'bg-yellow-100 text-yellow-800';
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Defaulters Report</h1>
                    <p className="text-gray-600">Patients who frequently miss appointments</p>
                </div>

                <div className="flex gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Min Missed</label>
                        <select
                            value={minMissed}
                            onChange={(e) => setMinMissed(parseInt(e.target.value))}
                            className="border rounded-lg px-3 py-2"
                        >
                            <option value={2}>2+</option>
                            <option value={3}>3+</option>
                            <option value={5}>5+</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Clinic</label>
                        <select
                            value={selectedClinic}
                            onChange={(e) => setSelectedClinic(e.target.value)}
                            className="border rounded-lg px-3 py-2"
                        >
                            <option value="">All Clinics</option>
                            {clinics.map((clinic) => (
                                <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Summary */}
            <div className="bg-red-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4">
                    <span className="text-4xl">⚠️</span>
                    <div>
                        <p className="text-2xl font-bold text-red-800">{defaulters.length}</p>
                        <p className="text-red-600">patients with {minMissed}+ missed appointments</p>
                    </div>
                </div>
            </div>

            {defaulters.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
                    <p className="text-lg">No defaulters found</p>
                    <p className="text-sm mt-2">No patients have missed {minMissed} or more appointments</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Patient
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Clinics
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Missed Count
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Last Missed
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {defaulters.map((defaulter) => (
                                <tr key={defaulter.patient_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="font-medium text-gray-900">{defaulter.patient_name}</div>
                                            <div className="text-sm text-gray-500">{defaulter.patient_number}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <a
                                            href={`tel:${defaulter.phone}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            📞 {defaulter.phone}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {defaulter.clinics?.split(',').map((clinic, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                                                >
                                                    {clinic.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMissedCountColor(defaulter.missed_count)}`}>
                                            {defaulter.missed_count}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(defaulter.last_missed_date).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Defaulters;
