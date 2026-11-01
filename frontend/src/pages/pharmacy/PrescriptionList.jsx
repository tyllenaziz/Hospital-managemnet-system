import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, ArrowLeft, RefreshCw, AlertCircle, Eye, CheckCircle, Clock, User } from 'lucide-react';
import { useAuth , API_BASE_URL } from '../../context/AuthContext';

const PrescriptionList = () => {
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/prescriptions/status/pending?limit=100`);
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
      prescription.id?.toString().includes(searchTerm);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/pharmacy/dashboard')}
            className="p-2 hover:bg-blue-100 rounded-lg transition text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Prescriptions</h1>
            <p className="text-slate-600">View and dispense patient prescriptions</p>
          </div>
          <button
            onClick={fetchPrescriptions}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-md transition-all"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="text"
                placeholder="Search by patient name or prescription ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="dispensed">Dispensed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-yellow-200 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-yellow-600" size={24} />
              <span className="text-3xl font-bold text-slate-800">
                {prescriptions.filter(p => p.status === 'pending').length}
              </span>
            </div>
            <h3 className="text-slate-600 font-medium">Pending</h3>
          </div>
          <div className="bg-white rounded-xl p-6 border border-green-200 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-600" size={24} />
              <span className="text-3xl font-bold text-slate-800">
                {prescriptions.filter(p => p.status === 'dispensed').length}
              </span>
            </div>
            <h3 className="text-slate-600 font-medium">Dispensed</h3>
          </div>
          <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <FileText className="text-blue-600" size={24} />
              <span className="text-3xl font-bold text-slate-800">{prescriptions.length}</span>
            </div>
            <h3 className="text-slate-600 font-medium">Total</h3>
          </div>
        </div>

        {/* Prescriptions Table */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-md overflow-hidden">
          <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50">
            <h2 className="text-xl font-bold text-slate-800">
              Prescriptions ({filteredPrescriptions.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              <p className="text-slate-600 mt-4">Loading prescriptions...</p>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="text-slate-800 font-semibold mb-2">No prescriptions found</h3>
              <p className="text-slate-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'No prescriptions available'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Patient</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Doctor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Diagnosis</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {filteredPrescriptions.map((prescription) => (
                    <tr key={prescription.id} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4">
                        <span className="text-teal-600 font-mono font-semibold">
                          #{prescription.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-green-600 rounded-full flex items-center justify-center">
                            <User size={16} className="text-white" />
                          </div>
                          <span className="text-slate-800 font-medium">
                            {prescription.patient_name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {prescription.doctor_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {prescription.diagnosis || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(prescription.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(prescription.status)}`}>
                          {prescription.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/pharmacy/prescriptions/${prescription.id}`)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition"
                        >
                          <Eye size={16} />
                          View Details
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

export default PrescriptionList;
