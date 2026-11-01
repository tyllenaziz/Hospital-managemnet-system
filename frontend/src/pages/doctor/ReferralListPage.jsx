import { useState, useEffect } from 'react';
import { Building2, Eye, Filter, Search, AlertCircle, Calendar, User, FileText, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ReferralListPage = () => {
  const { authenticatedFetch, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  
  const [referrals, setReferrals] = useState([]);
  const [filteredReferrals, setFilteredReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchReferrals();
    fetchStatistics();
  }, []);

  useEffect(() => {
    filterReferrals();
  }, [referrals, searchTerm, statusFilter, priorityFilter]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/referrals`);
      const data = await response.json();

      if (data.success) {
        setReferrals(data.referrals);
      } else {
        setError(data.error || 'Failed to fetch referrals');
      }
    } catch (err) {
      console.error('Error fetching referrals:', err);
      setError('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/referrals/statistics`);
      const data = await response.json();

      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const filterReferrals = () => {
    let filtered = [...referrals];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ref =>
        ref.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.referred_to_hospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.referral_reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ref => ref.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ref => ref.priority === priorityFilter);
    }

    setFilteredReferrals(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Accepted': 'bg-green-100 text-green-800 border-green-300',
      'Rejected': 'bg-red-100 text-red-800 border-red-300',
      'Completed': 'bg-blue-100 text-blue-800 border-blue-300',
      'Cancelled': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Emergency': 'bg-red-600 text-white',
      'Urgent': 'bg-orange-600 text-white',
      'Routine': 'bg-blue-600 text-white'
    };
    return colors[priority] || 'bg-gray-600 text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading referrals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="text-teal-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Patient Referrals</h1>
                <p className="text-gray-600 text-sm">Manage and track patient referrals</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <p className="text-gray-600 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.total}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm p-4">
              <p className="text-yellow-700 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-800">{statistics.pending}</p>
            </div>
            <div className="bg-green-50 rounded-lg border border-green-200 shadow-sm p-4">
              <p className="text-green-700 text-sm">Accepted</p>
              <p className="text-2xl font-bold text-green-800">{statistics.accepted}</p>
            </div>
            <div className="bg-blue-50 rounded-lg border border-blue-200 shadow-sm p-4">
              <p className="text-blue-700 text-sm">Completed</p>
              <p className="text-2xl font-bold text-blue-800">{statistics.completed}</p>
            </div>
            <div className="bg-red-50 rounded-lg border border-red-200 shadow-sm p-4">
              <p className="text-red-700 text-sm">Emergency</p>
              <p className="text-2xl font-bold text-red-800">{statistics.emergency}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient, hospital, or reason..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="relative">
              <AlertCircle className="absolute left-3 top-3 text-gray-400" size={18} />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Priority</option>
                <option value="Emergency">Emergency</option>
                <option value="Urgent">Urgent</option>
                <option value="Routine">Routine</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Referrals List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {filteredReferrals.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600">No referrals found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">From</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReferrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="text-gray-400" size={16} />
                          <div>
                            <p className="font-medium text-gray-800">{referral.patient_name}</p>
                            <p className="text-xs text-gray-500">{referral.patient_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-800">{referral.referring_hospital}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-800">{referral.referred_to_hospital}</p>
                          {referral.referred_to_department && (
                            <p className="text-xs text-gray-500">{referral.referred_to_department}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 max-w-xs truncate">{referral.referral_reason}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(referral.priority)}`}>
                          {referral.priority}
                        </span>
                      </td>
                     
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock size={14} />
                          <span className="text-xs">{formatDate(referral.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/doctor/referrals/${referral.id}`)}
                          className="flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm transition"
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

        {/* Results Summary */}
        {filteredReferrals.length > 0 && (
          <div className="text-center text-sm text-gray-600">
            Showing {filteredReferrals.length} of {referrals.length} referrals
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralListPage;