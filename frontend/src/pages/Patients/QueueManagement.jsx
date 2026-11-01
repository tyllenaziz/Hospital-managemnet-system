import React, { useState, useEffect } from 'react';
import { Clock, Users, Activity, FlaskConical, Pill, DollarSign, RefreshCw, Search, ArrowLeft, AlertCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../services/api';

const QueueManagement = () => {
  const navigate = useNavigate();
  const { authenticatedFetch, user } = useAuth();
  const [activeTab, setActiveTab] = useState('doctor');
  const [queues, setQueues] = useState({
    doctor: [],
    lab: [],
    pharmacy: [],
    billing: []
  });
  const [queueStats, setQueueStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQueues();
    fetchQueueStats();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchQueues(true);
    }, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchQueues = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const departments = ['doctor', 'lab', 'pharmacy'];
      const queuePromises = departments.map(dept =>
        authenticatedFetch(`${API_ENDPOINTS.QUEUE}/${dept}`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch ${dept} queue`);
            return res.json();
          })
          .then(data => {
            // Handle both array and object responses
            if (Array.isArray(data)) return data;
            if (data.queue && Array.isArray(data.queue)) return data.queue;
            if (data.data && Array.isArray(data.data)) return data.data;
            return [];
          })
          .catch(err => {
            console.warn(`Error fetching ${dept} queue:`, err);
            return [];
          })
      );

      const [doctorQueue, labQueue, pharmacyQueue] = await Promise.all(queuePromises);

      setQueues({
        doctor: doctorQueue,
        lab: labQueue,
        pharmacy: pharmacyQueue,
        billing: []
      });
    } catch (err) {
      console.error('Error fetching queues:', err);
      setError(err.message || 'Failed to load queues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchQueueStats = async () => {
    try {
      const response = await authenticatedFetch(`${API_ENDPOINTS.QUEUE}/admin/stats`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setQueueStats(data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch queue stats:', err);
    }
  };

  const runManualCleanup = async () => {
    if (!confirm('Run manual cleanup to expire queue items older than 24 hours?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_ENDPOINTS.QUEUE}/admin/cleanup`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully expired ${data.expiredCount} old queue items`);
        fetchQueues();
        fetchQueueStats();
      } else {
        alert('Cleanup failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Manual cleanup error:', err);
      alert('Failed to run cleanup');
    }
  };

  const departments = [
    { id: 'doctor', name: 'Doctor', icon: Activity, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { id: 'lab', name: 'Laboratory', icon: FlaskConical, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { id: 'pharmacy', name: 'Pharmacy', icon: Pill, color: 'text-green-600', bgColor: 'bg-green-100' },
    { id: 'billing', name: 'Billing', icon: DollarSign, color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
  ];

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

  const getTimeRemaining = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    const hoursRemaining = 24 - hoursDiff;
    
    if (hoursRemaining <= 0) return { text: 'EXPIRED', color: 'text-red-600', urgent: true };
    if (hoursRemaining <= 2) return { text: `${Math.floor(hoursRemaining * 60)}m left`, color: 'text-red-600', urgent: true };
    if (hoursRemaining <= 4) return { text: `${Math.floor(hoursRemaining)}h left`, color: 'text-orange-600', urgent: false };
    return { text: `${Math.floor(hoursRemaining)}h left`, color: 'text-slate-600', urgent: false };
  };

  const filteredQueue = queues[activeTab].filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.queue_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phone?.includes(searchTerm)
  );

  const getQueueStats = (dept) => {
    const queue = queues[dept];
    return {
      total: queue.length,
      waiting: queue.filter(q => q.status === 'waiting').length,
      inProgress: queue.filter(q => q.status === 'in_progress').length
    };
  };

  const urgentCount = filteredQueue.filter(item => {
    const timeInfo = getTimeRemaining(item.created_at);
    return timeInfo.urgent;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/reception/dashboard')}
            className="p-1.5 hover:bg-blue-100 rounded-md transition text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">Queue Management</h1>
            <p className="text-slate-600 text-sm">Monitor and manage patient queues (24-hour expiration)</p>
          </div>
          <div className="flex gap-2">
            {user?.role === 'admin' && (
              <button
                onClick={runManualCleanup}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md shadow-sm transition"
              >
                <Trash2 size={16} />
                Cleanup
              </button>
            )}
            <button
              onClick={() => fetchQueues(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md shadow-sm transition"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Urgent Alert */}
        {urgentCount > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle size={18} />
              <p className="text-sm font-medium">
                {urgentCount} patient{urgentCount > 1 ? 's' : ''} in queue expiring soon (less than 2 hours remaining)
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {departments.map((dept) => {
            const stats = getQueueStats(dept.id);
            const Icon = dept.icon;
            return (
              <div
                key={dept.id}
                className={`bg-white rounded-lg p-3 border-2 shadow-sm cursor-pointer hover:shadow-md transition ${
                  activeTab === dept.id ? 'border-teal-400' : 'border-blue-200'
                }`}
                onClick={() => setActiveTab(dept.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 ${dept.bgColor} rounded-md`}>
                    <Icon size={18} className={dept.color} />
                  </div>
                  <span className="text-xl font-bold text-slate-800">{stats.total}</span>
                </div>
                <h3 className="text-slate-700 font-medium text-sm mb-1">{dept.name}</h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-yellow-600 font-medium">{stats.waiting} waiting</span>
                  <span className="text-blue-600 font-medium">{stats.inProgress} active</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-1.5">
          <div className="flex gap-1 overflow-x-auto">
            {departments.map((dept) => {
              const Icon = dept.icon;
              const isActive = activeTab === dept.id;
              return (
                <button
                  key={dept.id}
                  onClick={() => setActiveTab(dept.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${
                    isActive ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon size={16} />
                  {dept.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by patient name, queue number, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="text-teal-600" size={18} />
              {departments.find(d => d.id === activeTab)?.name} Queue ({filteredQueue.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <p className="text-slate-600 mt-2 text-sm">Loading queue...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Queue #</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Patient</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Age</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Gender</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Phone</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Time</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Time Left</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {filteredQueue.map((item) => {
                    const timeInfo = getTimeRemaining(item.created_at);
                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-blue-50 transition ${timeInfo.urgent ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-3 py-2 font-mono text-teal-600 font-semibold">{item.queue_number}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-green-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-xs">
                                {item.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                              </span>
                            </div>
                            <span className="text-slate-800 font-medium text-sm">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{item.age}Y</td>
                        <td className="px-3 py-2 text-slate-600">{item.gender}</td>
                        <td className="px-3 py-2 text-slate-600">{item.phone}</td>
                        <td className="px-3 py-2 text-slate-600 text-xs">
                          {new Date(item.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-semibold ${timeInfo.color} ${timeInfo.urgent ? 'animate-pulse' : ''}`}>
                            {timeInfo.text}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredQueue.length === 0 && (
            <div className="p-8 text-center">
              <Users className="mx-auto text-slate-300 mb-2" size={40} />
              <h3 className="text-slate-800 font-semibold text-sm mb-1">No patients in queue</h3>
              <p className="text-slate-600 text-xs">
                {searchTerm 
                  ? 'No results found for your search'
                  : `The ${departments.find(d => d.id === activeTab)?.name.toLowerCase()} queue is empty`
                }
              </p>
            </div>
          )}
        </div>

        
      </div>
    </div>
  );
};

export default QueueManagement;