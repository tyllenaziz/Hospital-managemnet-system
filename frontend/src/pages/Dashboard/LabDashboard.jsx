import React, { useState, useEffect } from 'react';
import { FlaskConical, Clock, CheckCircle, FileText, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { API_BASE_URL, useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LabDashboard = () => {
  const { authenticatedFetch, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingTests: 0,
    inProgress: 0,
    completedToday: 0,
    totalTests: 0
  });

  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLabData();
    const interval = setInterval(fetchLabData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLabData = async () => {
    try {
      setError(null);
      setRefreshing(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/lab/orders/pending`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setPendingOrders(data);
        const pending = data.filter(o => o.status === 'pending').length;
        const inProgress = data.filter(o => o.status === 'in_progress').length;
        
        setStats({
          pendingTests: pending,
          inProgress: inProgress,
          completedToday: 0,
          totalTests: data.length
        });
      }
    } catch (err) {
      console.error('Error fetching lab data:', err);
      setError(err.message || 'Failed to load lab data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
    <div className={`${bgColor} rounded-lg p-4 border ${color === 'yellow' ? 'border-yellow-200' : color === 'blue' ? 'border-blue-200' : color === 'green' ? 'border-green-200' : 'border-teal-200'} shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 ${color === 'yellow' ? 'bg-yellow-100' : color === 'blue' ? 'bg-blue-100' : color === 'green' ? 'bg-green-100' : 'bg-teal-100'} rounded-lg`}>
          <Icon size={20} className={`${color === 'yellow' ? 'text-yellow-600' : color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : 'text-teal-600'}`} />
        </div>
        <span className={`text-2xl font-bold ${color === 'yellow' ? 'text-yellow-700' : color === 'blue' ? 'text-blue-700' : color === 'green' ? 'text-green-700' : 'text-teal-700'}`}>{value}</span>
      </div>
      <h3 className="text-slate-700 font-medium text-sm">{title}</h3>
    </div>
  );

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
      completed: 'bg-green-100 text-green-700 border-green-300'
    };
    return styles[status] || styles.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-teal-600 mx-auto mb-2" size={32} />
          <p className="text-slate-600 text-sm">Loading lab dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Laboratory Dashboard</h1>
            <p className="text-slate-600 text-sm">Welcome, {user?.username}</p>
          </div>
          <button
            onClick={fetchLabData}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2 text-sm">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
            <div>
              <h3 className="text-red-700 font-semibold">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Clock} title="Pending Tests" value={stats.pendingTests} color="yellow" bgColor="bg-white" />
          <StatCard icon={FlaskConical} title="In Progress" value={stats.inProgress} color="blue" bgColor="bg-white" />
          <StatCard icon={CheckCircle} title="Completed Today" value={stats.completedToday} color="green" bgColor="bg-white" />
          <StatCard icon={FileText} title="Total Tests" value={stats.totalTests} color="teal" bgColor="bg-white" />
        </div>

        {/* Pending Lab Orders */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50">
            <h2 className="text-lg font-bold text-slate-800">Pending Lab Orders ({pendingOrders.length})</h2>
          </div>
          
          {pendingOrders.length === 0 ? (
            <div className="p-8 text-center">
              <FlaskConical className="text-slate-300 mx-auto mb-2" size={32} />
              <p className="text-slate-600 text-sm">No pending lab orders</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {pendingOrders.map((order) => (
                <div key={order.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200 hover:border-teal-300 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-teal-600 font-mono font-semibold">
                          Order #{order.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-slate-800 font-medium mb-1">{order.patient_name}</h3>
                      <p className="text-slate-600 text-xs mb-1">
                        {order.age} yrs • {order.gender}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          {order.test_count} {order.test_count === 1 ? 'test' : 'tests'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-slate-600 text-xs">
                        {new Date(order.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <button 
                        onClick={() => navigate(`/lab/orders/${order.id}`)}
                        className="px-4 py-1.5 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-medium rounded text-sm transition-all"
                      >
                        Process Test
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabDashboard;