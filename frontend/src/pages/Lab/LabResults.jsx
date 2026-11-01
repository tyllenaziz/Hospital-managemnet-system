import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Search, ArrowLeft, RefreshCw, AlertCircle, Eye, Calendar, User, Filter } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const LabResults = () => {
  const navigate = useNavigate();
  const { authenticatedFetch, user } = useAuth();
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  useEffect(() => {
    fetchLabResults();
  }, []);

  const fetchLabResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/lab/results/all`);
      const data = await response.json();
      setLabOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching lab results:', err);
      setError(err.message || 'Failed to load lab results');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = labOrders.filter(order => {
    const matchesSearch = 
      order.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toString().includes(searchTerm) ||
      order.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    let matchesDate = true;
    if (filterDate !== 'all') {
      const orderDate = new Date(order.order_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch(filterDate) {
        case 'today':
          matchesDate = orderDate >= today;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = orderDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
      completed: 'bg-green-100 text-green-700 border-green-300'
    };
    return styles[status] || styles.pending;
  };

  const getDashboardPath = () => {
    if (user?.role === 'lab') return '/lab/dashboard';
    if (user?.role === 'doctor') return '/doctor/dashboard';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(getDashboardPath())}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">Lab Results</h1>
            <p className="text-sm text-slate-600">View all laboratory test results</p>
          </div>
          <button
            onClick={fetchLabResults}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search by patient, doctor, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-blue-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-blue-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-blue-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 border border-yellow-200 shadow-sm">
            <div className="flex items-center justify-between">
              <FlaskConical className="text-yellow-600" size={20} />
              <span className="text-2xl font-bold text-slate-800">
                {labOrders.filter(o => o.status === 'pending').length}
              </span>
            </div>
            <h3 className="text-slate-600 text-sm mt-1">Pending</h3>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <FlaskConical className="text-blue-600" size={20} />
              <span className="text-2xl font-bold text-slate-800">
                {labOrders.filter(o => o.status === 'in_progress').length}
              </span>
            </div>
            <h3 className="text-slate-600 text-sm mt-1">In Progress</h3>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <FlaskConical className="text-green-600" size={20} />
              <span className="text-2xl font-bold text-slate-800">
                {labOrders.filter(o => o.status === 'completed').length}
              </span>
            </div>
            <h3 className="text-slate-600 text-sm mt-1">Completed</h3>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50">
            <h2 className="text-lg font-bold text-slate-800">
              Lab Orders ({filteredResults.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
              <p className="text-slate-600 mt-3 text-sm">Loading results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-8 text-center">
              <FlaskConical className="mx-auto text-slate-300 mb-3" size={40} />
              <h3 className="text-slate-800 font-semibold mb-1">No results found</h3>
              <p className="text-slate-600 text-sm">
                {searchTerm || filterStatus !== 'all' || filterDate !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No lab orders available'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Order ID</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Patient</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Doctor</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Tests</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {filteredResults.map((order) => (
                    <tr key={order.id} className="hover:bg-blue-50 transition">
                      <td className="px-3 py-2">
                        <span className="text-teal-600 font-mono font-semibold text-xs">
                          #{order.id}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-white" />
                          </div>
                          <div>
                            <p className="text-slate-800 font-medium text-sm">{order.patient_name}</p>
                            <p className="text-slate-600 text-xs">{order.age} yrs • {order.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-sm">
                        Dr. {order.doctor_name}
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {order.tests?.length || 0} {order.tests?.length === 1 ? 'test' : 'tests'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-xs">
                        {new Date(order.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => {
                            if (user?.role === 'doctor') {
                              navigate(`/doctor/patient/${order.patient_id}/lab-history`);
                            } else {
                              navigate(`/lab/orders/${order.id}`);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-md transition"
                        >
                          <Eye size={14} />
                          View
                        </button>
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

export default LabResults;