import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, ArrowLeft, RefreshCw, AlertCircle, Eye, Clock, User, Calendar } from 'lucide-react';
import { useAuth, API_BASE_URL} from '../../context/AuthContext';

const DoctorPrescriptions = () => {
  const navigate = useNavigate();
  const { authenticatedFetch, user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user?.id) {
      fetchPrescriptions();
    }
  }, [user?.id]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        setPrescriptions([]);
        return;
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/prescriptions/doctor/${user.id}?limit=100`);
      const data = await response.json();

      setPrescriptions(Array.isArray(data.prescriptions) ? data.prescriptions : []);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError(err.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = 
      prescription.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.id?.toString().includes(searchTerm) ||
      prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || prescription.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      dispensed: 'bg-green-100 text-green-700 border-green-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300'
    };
    return styles[status] || styles.pending;
  };

  const stats = {
    total: prescriptions.length,
    pending: prescriptions.filter(p => p.status === 'pending').length,
    dispensed: prescriptions.filter(p => p.status === 'dispensed').length,
    today: prescriptions.filter(p => {
      const today = new Date().toISOString().split('T')[0];
      return p.created_at?.startsWith(today);
    }).length
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800">My Prescriptions</h1>
            <p className="text-slate-600 text-sm">View all prescriptions you've issued</p>
          </div>
          <button
            onClick={fetchPrescriptions}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition text-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search by patient name, diagnosis or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="dispensed">Dispensed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats - Compact Version */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <FileText className="text-blue-600" size={18} />
              <span className="text-xl font-bold text-slate-800">{stats.total}</span>
            </div>
            <h3 className="text-slate-600 text-xs font-medium mt-1">Total</h3>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <Clock className="text-yellow-600" size={18} />
              <span className="text-xl font-bold text-slate-800">{stats.pending}</span>
            </div>
            <h3 className="text-slate-600 text-xs font-medium mt-1">Pending</h3>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <FileText className="text-green-600" size={18} />
              <span className="text-xl font-bold text-slate-800">{stats.dispensed}</span>
            </div>
            <h3 className="text-slate-600 text-xs font-medium mt-1">Dispensed</h3>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <Calendar className="text-teal-600" size={18} />
              <span className="text-xl font-bold text-slate-800">{stats.today}</span>
            </div>
            <h3 className="text-slate-600 text-xs font-medium mt-1">Today</h3>
          </div>
        </div>

        {/* Prescriptions Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800">
              Prescriptions ({filteredPrescriptions.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <p className="text-slate-600 text-sm mt-2">Loading prescriptions...</p>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto text-slate-300 mb-2" size={32} />
              <h3 className="text-slate-800 font-semibold text-sm mb-1">No prescriptions found</h3>
              <p className="text-slate-600 text-xs">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'You haven\'t issued any prescriptions yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Patient</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Diagnosis</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Items</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrescriptions.map((prescription) => (
                    <tr key={prescription.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-2">
                        <span className="text-teal-600 font-mono font-medium text-xs">
                          #{prescription.id}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-teal-600 to-green-600 rounded-full flex items-center justify-center">
                            <User size={12} className="text-white" />
                          </div>
                          <span className="text-slate-800 font-medium text-sm">
                            {prescription.patient_name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-slate-600 text-sm">
                        {prescription.diagnosis || 'Not specified'}
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {prescription.items?.length || 0} items
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-600 text-sm">
                        {new Date(prescription.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(prescription.status)}`}>
                          {prescription.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => navigate(`/doctor/prescriptions/${prescription.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded transition"
                        >
                          <Eye size={12} />
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

export default DoctorPrescriptions;
