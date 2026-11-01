import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';


const ClinicCalendar = () => {
    const { token } = useAuth();
    const [todayFollowUps, setTodayFollowUps] = useState([]);
    const [upcomingFollowUps, setUpcomingFollowUps] = useState([]);
    const [missedAppointments, setMissedAppointments] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState('');
    const [activeTab, setActiveTab] = useState('today');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, [selectedClinic]);

    const fetchData = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };

            const clinicParam = selectedClinic ? `&clinic_id=${selectedClinic}` : '';

            const [todayRes, upcomingRes, missedRes, clinicsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/follow-ups/today?${clinicParam}`, { headers }),
                axios.get(`${API_BASE_URL}/follow-ups/upcoming?days=30${clinicParam}`, { headers }),
                axios.get(`${API_BASE_URL}/follow-ups/missed?days_back=30${clinicParam}`, { headers }),
                axios.get(`${API_BASE_URL}/chronic/clinics?active_only=true`, { headers })
            ]);

            setTodayFollowUps(todayRes.data.followUps || []);
            setUpcomingFollowUps(upcomingRes.data.followUps || []);
            setMissedAppointments(missedRes.data.missed || []);
            setClinics(clinicsRes.data.clinics || []);
        } catch (err) {
            setError('Failed to fetch calendar data');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkCompleted = async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/follow-ups/${id}/complete`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Marked as completed');
            fetchData();
        } catch (err) {
            setError('Failed to mark as completed');
        }
    };

    const handleMarkMissed = async (id, reason) => {
        try {
            await axios.put(`${API_BASE_URL}/follow-ups/${id}/missed`, { reason }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Marked as missed');
            fetchData();
        } catch (err) {
            setError('Failed to mark as missed');
        }
    };

    const getDepartmentIcon = (dept) => {
        const icons = {
            nurse: '👩‍⚕️',
            doctor: '👨‍⚕️',
            lab: '🔬'
        };
        return icons[dept] || '📋';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const renderAppointmentCard = (appointment, showActions = false) => (
        <div
            key={appointment.id}
            className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold text-gray-800">{appointment.patient_name}</h4>
                    <p className="text-sm text-gray-500">{appointment.patient_number}</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl">{getDepartmentIcon(appointment.department)}</span>
                    <p className="text-xs text-gray-500">{appointment.department}</p>
                </div>
            </div>

            <div className="mt-2">
                <p className="text-sm font-medium text-blue-600">{appointment.purpose}</p>
                {appointment.clinic_name && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {appointment.clinic_name}
                    </span>
                )}
            </div>

            <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
                <span>📅 {new Date(appointment.scheduled_date).toLocaleDateString()}</span>
                {appointment.scheduled_time && <span>🕐 {appointment.scheduled_time}</span>}
                {appointment.phone && <span>📞 {appointment.phone}</span>}
            </div>

            {showActions && (
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={() => handleMarkCompleted(appointment.id)}
                        className="flex-1 px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                    >
                        ✓ Completed
                    </button>
                    <button
                        onClick={() => handleMarkMissed(appointment.id, 'Patient did not show')}
                        className="flex-1 px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                        ✗ Missed
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Clinic Calendar</h1>

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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-blue-800 font-semibold">Today</h3>
                    <p className="text-3xl font-bold text-blue-600">{todayFollowUps.length}</p>
                    <p className="text-sm text-blue-600">appointments</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-green-800 font-semibold">This Week</h3>
                    <p className="text-3xl font-bold text-green-600">{upcomingFollowUps.length}</p>
                    <p className="text-sm text-green-600">upcoming</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="text-red-800 font-semibold">Missed (30 days)</h3>
                    <p className="text-3xl font-bold text-red-600">{missedAppointments.length}</p>
                    <p className="text-sm text-red-600">appointments</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('today')}
                    className={`px-4 py-2 rounded-lg ${activeTab === 'today'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Today ({todayFollowUps.length})
                </button>
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 rounded-lg ${activeTab === 'upcoming'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Upcoming ({upcomingFollowUps.length})
                </button>
                <button
                    onClick={() => setActiveTab('missed')}
                    className={`px-4 py-2 rounded-lg ${activeTab === 'missed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Missed ({missedAppointments.length})
                </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTab === 'today' && (
                    todayFollowUps.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No appointments scheduled for today
                        </div>
                    ) : (
                        todayFollowUps.map((apt) => renderAppointmentCard(apt, true))
                    )
                )}

                {activeTab === 'upcoming' && (
                    upcomingFollowUps.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No upcoming appointments in the next 7 days
                        </div>
                    ) : (
                        upcomingFollowUps.map((apt) => renderAppointmentCard(apt, false))
                    )
                )}

                {activeTab === 'missed' && (
                    missedAppointments.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No missed appointments in the last 30 days
                        </div>
                    ) : (
                        missedAppointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="bg-white rounded-lg shadow-sm border border-red-200 p-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{apt.patient_name}</h4>
                                        <p className="text-sm text-gray-500">{apt.patient_number}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                        Missed
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-gray-600">{apt.purpose}</p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Scheduled: {new Date(apt.scheduled_date).toLocaleDateString()}
                                </p>
                                {apt.missed_reason && (
                                    <p className="mt-2 text-xs text-red-600 italic">
                                        Reason: {apt.missed_reason}
                                    </p>
                                )}
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};

export default ClinicCalendar;
