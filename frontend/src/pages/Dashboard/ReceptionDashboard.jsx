import React, { useState, useEffect, useCallback } from 'react';
import { Users, Clock, CheckCircle, Calendar, Plus, Search, AlertCircle, RefreshCw, Car, Receipt, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../services/api';

const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const { authenticatedFetch, user } = useAuth();
  const [stats, setStats] = useState({
    todayPatients: 0,
    waitingQueue: 0,
    completedToday: 0,
    totalPatients: 0
  });

  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Use useCallback to memoize the function and prevent infinite loops
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch patients with error handling
      const patientsResponse = await authenticatedFetch(API_ENDPOINTS.PATIENTS);
      
      if (!patientsResponse.ok) {
        throw new Error(`Failed to fetch patients: ${patientsResponse.status}`);
      }

      const patientsData = await patientsResponse.json();
      
      // Handle both array response and object with patients array
      let patients = [];
      if (Array.isArray(patientsData)) {
        patients = patientsData;
      } else if (patientsData.patients && Array.isArray(patientsData.patients)) {
        patients = patientsData.patients;
      } else if (patientsData.success && Array.isArray(patientsData.data)) {
        patients = patientsData.data;
      } else {
        console.warn('Unexpected patients data format:', patientsData);
        patients = [];
      }

      // Fetch queue data with error handling for each department
      const queuePromises = ['doctor', 'lab', 'pharmacy'].map(dept =>
        authenticatedFetch(`${API_ENDPOINTS.QUEUE}/${dept}?status=waiting`)
          .then(res => {
            if (!res.ok) throw new Error(`Queue fetch failed for ${dept}`);
            return res.json();
          })
          .then(data => {
            // Handle array or object response
            if (Array.isArray(data)) return data;
            if (data.queue && Array.isArray(data.queue)) return data.queue;
            if (data.data && Array.isArray(data.data)) return data.data;
            return [];
          })
          .catch(err => {
            console.warn(`Failed to fetch ${dept} queue:`, err);
            return [];
          })
      );

      const queueResults = await Promise.all(queuePromises);
      const allQueue = queueResults.flat();

      // Calculate today's date
      const today = new Date().toISOString().split('T')[0];
      const todayPatients = patients.filter(p => 
        p.created_at && p.created_at.startsWith(today)
      );

      // Fetch completed queue items
      let completedToday = [];
      try {
        const completedResponse = await authenticatedFetch(
          `${API_ENDPOINTS.QUEUE}/doctor?status=done`
        );
        
        if (completedResponse.ok) {
          const completedData = await completedResponse.json();
          const completedQueue = Array.isArray(completedData) 
            ? completedData 
            : (completedData.queue || completedData.data || []);
          
          completedToday = completedQueue.filter(q => 
            q.updated_at && q.updated_at.startsWith(today)
          );
        }
      } catch (err) {
        console.warn('Failed to fetch completed queue:', err);
      }

      // Update stats
      setStats({
        todayPatients: todayPatients.length,
        waitingQueue: allQueue.length,
        completedToday: completedToday.length,
        totalPatients: patients.length
      });

      // Prepare recent patients with queue info
      const recentWithQueue = todayPatients.slice(0, 8).map(patient => {
        const queueItem = allQueue.find(q => q.patient_id === patient.id);
        return {
          ...patient,
          department: queueItem?.department || 'doctor',
          status: queueItem?.status || 'waiting',
          queue_number: queueItem?.queue_number || 'N/A',
          time: patient.created_at 
            ? new Date(patient.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'N/A'
        };
      });

      setRecentPatients(recentWithQueue);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authenticatedFetch]); // Only depend on authenticatedFetch

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Depend on the memoized function

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
    <div className={`${bgColor} rounded-lg p-4 border ${
      color === 'teal' ? 'border-teal-200' : 
      color === 'yellow' ? 'border-yellow-200' : 
      color === 'green' ? 'border-green-200' : 
      'border-blue-200'
    } shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 ${
          color === 'teal' ? 'bg-teal-100' : 
          color === 'yellow' ? 'bg-yellow-100' : 
          color === 'green' ? 'bg-green-100' : 
          'bg-blue-100'
        } rounded-lg`}>
          <Icon size={20} className={`${
            color === 'teal' ? 'text-teal-600' : 
            color === 'yellow' ? 'text-yellow-600' : 
            color === 'green' ? 'text-green-600' : 
            'text-blue-600'
          }`} />
        </div>
        <span className={`text-2xl font-bold ${
          color === 'teal' ? 'text-teal-700' : 
          color === 'yellow' ? 'text-yellow-700' : 
          color === 'green' ? 'text-green-700' : 
          'text-blue-700'
        }`}>{value}</span>
      </div>
      <h3 className="text-slate-700 font-medium text-sm">{title}</h3>
    </div>
  );

  const getStatusBadge = (status) => {
    const styles = {
      waiting: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
      done: 'bg-green-100 text-green-700 border-green-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300'
    };
    return styles[status] || styles.waiting;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-3"></div>
          <p className="text-slate-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-300 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 text-lg mb-1">Error Loading Dashboard</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchDashboardData()}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/reception/register')}
              className="px-4 py-2 bg-white hover:bg-red-50 text-red-700 border border-red-300 rounded-lg transition text-sm font-medium"
            >
              Register Patient
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Reception Dashboard</h1>
              <p className="text-slate-600 text-sm">Welcome, {user?.username}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link
              to="/reception/ambulance-request/new"
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-all text-sm"
            >
              <Plus size={16} />
              Create Ambulance Request
            </Link>

            <Link
              to="/reception/incoming-ambulance"
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-all text-sm"
            >
              <Car size={16} />
              Incoming Ambulance
            </Link>

            <Link
              to="/reception/register"
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-all text-sm"
            >
              <Plus size={16} />
              Register Patient
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={Calendar}
            title="Today's Patients"
            value={stats.todayPatients}
            color="teal"
            bgColor="bg-white"
          />
          <StatCard
            icon={Clock}
            title="Waiting in Queue"
            value={stats.waitingQueue}
            color="yellow"
            bgColor="bg-white"
          />
          <StatCard
            icon={CheckCircle}
            title="Completed Today"
            value={stats.completedToday}
            color="green"
            bgColor="bg-white"
          />
          <StatCard
            icon={Users}
            title="Total Patients"
            value={stats.totalPatients}
            color="blue"
            bgColor="bg-white"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Link
              to="/reception/tests"
              className="bg-white rounded-lg p-4 border border-teal-200 hover:border-teal-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg group-hover:scale-105 transition-transform">
                  <Eye size={20} className="text-teal-600" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-medium text-sm">View Lab Tests</h3>
                  <p className="text-slate-600 text-xs">See available tests</p>
                </div>
              </div>
            </Link>


          <Link
            to="/reception/billing"
            className="bg-white rounded-lg p-4 border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-105 transition-transform">
                <Receipt size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-slate-800 font-medium text-sm">Billing & Receipts</h3>
                <p className="text-slate-600 text-xs">View patient bills</p>
              </div>
            </div>
          </Link>

          <Link
            to="/reception/ambulance-requests"
            className="bg-white rounded-lg p-4 border border-red-200 hover:border-red-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg group-hover:scale-105 transition-transform">
                <Car size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-slate-800 font-medium text-sm">Ambulance Requests</h3>
                <p className="text-slate-600 text-xs">Manage requests</p>
              </div>
            </div>
          </Link>

          <Link
            to="/reception/queue"
            className="bg-white rounded-lg p-4 border border-green-200 hover:border-green-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg group-hover:scale-105 transition-transform">
                <Clock size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-slate-800 font-medium text-sm">Queue Management</h3>
                <p className="text-slate-600 text-xs">View and manage queue</p>
              </div>
            </div>
          </Link>

          <Link
            to="/reception/patients"
            className="bg-white rounded-lg p-4 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-105 transition-transform">
                <Search size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-slate-800 font-medium text-sm">Search Patients</h3>
                <p className="text-slate-600 text-xs">Find patient records</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Today's Patients</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded transition text-xs font-medium"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {recentPatients.length === 0 ? (
            <div className="p-8 text-center">
              <Users size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm mb-2">No patients registered today</p>
              <Link
                to="/reception/register"
                className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                <Plus size={16} />
                Register First Patient
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Queue #</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Patient Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Phone</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Age/Gender</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Department</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-2">
                        <span className="font-mono text-teal-600 font-medium text-xs">
                          {patient.queue_number}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-800 font-medium text-sm">{patient.name}</td>
                      <td className="px-4 py-2 text-slate-600 text-sm">{patient.phone}</td>
                      <td className="px-4 py-2 text-slate-600 text-sm">
                        {patient.age}Y / {patient.gender}
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-teal-600 capitalize font-medium text-sm">{patient.department}</span>
                      </td>
                      <td className="px-4 py-2 text-slate-600 text-sm">{patient.time}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(patient.status)}`}>
                          {patient.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceptionDashboard;