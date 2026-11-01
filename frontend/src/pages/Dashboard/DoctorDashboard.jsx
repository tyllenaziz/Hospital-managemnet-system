import { useState, useEffect } from 'react';
import { Users, Clock, FileText, TrendingUp, AlertCircle, RefreshCw, FlaskConical, CheckCircle, Edit, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const DoctorDashboard = () => {
  const { authenticatedFetch, user, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({
    waitingPatients: 0,
    todayConsultations: 0,
    prescriptionsIssued: 0,
    labOrdersCreated: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDoctorData();
    const interval = setInterval(fetchDoctorData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show success message from navigation state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from history
      window.history.replaceState({}, document.title);
      // Auto-hide after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [location]);

  const fetchDoctorData = async () => {
    try {
      setError(null);
      setRefreshing(true);

      // Fetch all patients (waiting + in_progress + done)
      const queueResponse = await authenticatedFetch(
        `${API_BASE_URL}/queue/doctor`
      );
      const queueData = await queueResponse.json();

      if (queueData && Array.isArray(queueData)) {
        setQueue(queueData);

        // Calculate stats
        const activePatients = queueData.filter(p => p.status === 'waiting' || p.status === 'in_progress');
        const completedToday = queueData.filter(p => p.status === 'done');

        setStats(prev => ({
          ...prev,
          waitingPatients: activePatients.length,
          todayConsultations: completedToday.length
        }));
      }
    } catch (err) {
      console.error('Error fetching doctor data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStartConsultation = (queueId) => {
    // Navigate to consultation page
    navigate(`/doctor/consultation/${queueId}`);
  };

  const hasLabResults = (patient) => {
    return patient.notes && patient.notes.includes('[LAB RESULTS READY');
  };

  const getStatusBadge = (status) => {
    const styles = {
      waiting: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
      done: 'bg-green-100 text-green-700 border-green-300'
    };
    const labels = {
      waiting: 'Waiting',
      in_progress: 'In Progress',
      done: 'Completed'
    };
    return { style: styles[status] || styles.waiting, label: labels[status] || status };
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`p-2 ${color} bg-opacity-10 rounded-lg`}>
          <Icon size={18} className={color.replace('bg-', 'text-')} />
        </div>
        <span className="text-2xl font-bold text-gray-800">{value}</span>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mt-1">{title}</h3>
    </div>
  );

  // Filter patients by search query
  const filterPatients = (patients) => {
    if (!searchQuery.trim()) return patients;
    const query = searchQuery.toLowerCase();
    return patients.filter(p =>
      p.name?.toLowerCase().includes(query) ||
      p.id_number?.toLowerCase().includes(query) ||
      p.phone?.toLowerCase().includes(query) ||
      p.queue_number?.toLowerCase().includes(query)
    );
  };

  // Separate active and completed patients
  const activeQueue = filterPatients(queue.filter(p => p.status !== 'done'));
  const completedQueue = filterPatients(queue.filter(p => p.status === 'done'));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="animate-spin text-teal-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const QueueTable = ({ patients, showCompletedBadge = false }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Queue #</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Patient Name</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Age</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Gender</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Time</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {patients.map((patient) => {
            const statusInfo = getStatusBadge(patient.status);
            const isInProgress = patient.status === 'in_progress';
            const isDone = patient.status === 'done';
            const isAssignedToMe = patient.assigned_to === user?.id;
            const isAssignedToOther = patient.assigned_to && patient.assigned_to !== user?.id;

            return (
              <tr
                key={patient.id}
                className={`hover:bg-gray-50 transition ${isInProgress ? 'bg-blue-50' :
                    isDone ? 'bg-gray-50 opacity-75' : ''
                  }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-600 font-mono font-semibold text-sm">
                      {patient.queue_number || `DOC-${String(patient.id).padStart(3, '0')}`}
                    </span>
                    {hasLabResults(patient) && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                        <FlaskConical size={12} />
                        Lab Results
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-800 font-medium">{patient.name || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-600">{patient.age || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-600">{patient.gender || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {patient.created_at ? new Date(patient.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit'
                  }) : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.style}`}>
                    {statusInfo.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {isInProgress && isAssignedToOther ? (
                    <span className="text-xs text-gray-500 italic">Assigned to another doctor</span>
                  ) : isDone && isAssignedToOther ? (
                    <span className="text-xs text-gray-500 italic">Completed by another doctor</span>
                  ) : isDone ? (
                    <button
                      onClick={() => handleStartConsultation(patient.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-sm transition-all"
                    >
                      <Edit size={14} />
                      Reopen & Modify
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartConsultation(patient.id)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg shadow-sm transition-all"
                    >
                      {isInProgress && isAssignedToMe ? 'Continue' : 'Start Consultation'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Doctor Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, Dr. {user?.full_name || user?.username}</p>
          </div>
          <button
            onClick={fetchDoctorData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Patient Search Bar */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients by name, ID number, phone, or queue number..."
              className="w-full pl-10 pr-10 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-gray-500 mt-2">
              Showing {activeQueue.length + completedQueue.length} result(s) matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
            <div className="flex-1">
              <p className="text-green-700 font-medium text-sm">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 hover:text-green-800 text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            <div>
              <h3 className="text-red-800 font-semibold text-sm">Error</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Clock} title="Active Patients" value={stats.waitingPatients} color="bg-yellow-500" />
          <StatCard icon={CheckCircle} title="Completed Today" value={stats.todayConsultations} color="bg-green-500" />
          <StatCard icon={FileText} title="Prescriptions Issued" value={stats.prescriptionsIssued} color="bg-purple-500" />
          <StatCard icon={TrendingUp} title="Lab Orders Created" value={stats.labOrdersCreated} color="bg-blue-500" />
        </div>

        {/* Active Patient Queue */}
        {activeQueue.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Active Queue</h2>
              <p className="text-gray-600 text-sm">{activeQueue.length} {activeQueue.length === 1 ? 'patient' : 'patients'} waiting or in progress</p>
            </div>
            <QueueTable patients={activeQueue} />
          </div>
        )}

        {/* Completed Consultations */}
        {completedQueue.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-green-600" size={20} />
                <h2 className="text-lg font-bold text-gray-700">Completed Today</h2>
              </div>
              <p className="text-gray-600 text-sm">
                {completedQueue.length} completed {completedQueue.length === 1 ? 'consultation' : 'consultations'} •
                Can be reopened for modifications within 24 hours
              </p>
            </div>
            <QueueTable patients={completedQueue} showCompletedBadge={true} />
          </div>
        )}

        {/* Empty State */}
        {queue.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8 text-center">
              <Users className="text-gray-300 mx-auto mb-3" size={40} />
              <p className="text-gray-500 text-sm">No patients in queue</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;