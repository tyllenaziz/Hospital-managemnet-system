import { useState, useEffect} from 'react';
import { Eye, CheckCircle, XCircle, Clock, Printer, Filter, Search, RefreshCw, Plus, Car, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link , useNavigate } from 'react-router-dom';
import AmbulanceRequestModal from './AmbulanceRequestModal';

const AmbulanceRequestList = () => {
  const navigate = useNavigate();
  const { authenticatedFetch, user, API_BASE_URL } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      let url = `${API_BASE_URL}/ambulance/requests`;
      const params = new URLSearchParams();
      
      if (directionFilter !== 'all') {
        params.append('direction', directionFilter);
      }
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await authenticatedFetch(url);
      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/ambulance/requests/${requestId}/approve`,
        { 
          method: 'POST', 
          body: JSON.stringify({ 
            doctor_notes: 'Request approved for ambulance transfer.',
            approved_by: user.id 
          }) 
        }
      );
      const data = await response.json();
      if (data.success) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handlePrint = async (requestId) => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/ambulance/requests/${requestId}/print`,
        { method: 'POST', body: JSON.stringify({ printed_by: user.id }) }
      );
      const data = await response.json();
      if (data.success) {
        // Open print dialog or PDF
        window.open(`/ambulance/requests/${requestId}/print`, '_blank');
        fetchRequests();
      }
    } catch (error) {
      console.error('Error printing request:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Approved': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Assigned': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Dispatched': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionBadge = (direction) => {
    switch (direction) {
      case 'OUTGOING': 
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Outgoing</span>;
      case 'INCOMING': 
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Incoming</span>;
      default: 
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Unknown</span>;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesDirection = directionFilter === 'all' || request.request_direction === directionFilter;
    const matchesSearch = 
      (request.patient_name || request.patient_name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.ambulance_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesDirection && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ambulance Requests</h1>
          <p className="text-gray-600">Manage and track ambulance service requests</p>
        </div>
        
        {user.role === 'doctor' && (
          <Link
            to="/doctor/ambulance-request/new"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Request
          </Link>
        )}
        
        {user.role === 'receptionist' && (
          <Link
            to="/reception/incoming-ambulance"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Car size={16} />
            Incoming Ambulance
          </Link>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by patient name, ambulance, destination, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        
        <select
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="all">All Directions</option>
          <option value="OUTGOING">Outgoing</option>
          <option value="INCOMING">Incoming</option>
        </select>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Assigned">Assigned</option>
          <option value="Dispatched">Dispatched</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Request ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Direction</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Destination</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Requested</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <span className="font-mono text-teal-600 font-medium">AMB-{String(request.id).padStart(4, '0')}</span>
                  </td>
                  <td className="px-4 py-3">
                    {getDirectionBadge(request.request_direction)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{request.patient_name || request.patient_name}</p>
                      {request.patient_phone && (
                        <p className="text-xs text-gray-500">{request.patient_phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-gray-700">{request.request_type?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700 text-sm line-clamp-1">{request.destination}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {new Date(request.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {user.role === 'doctor' && request.status === 'Pending' && request.request_direction === 'INCOMING' && (
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Approve Request"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      
                      {(user.role === 'receptionist' || user.role === 'reception') && 
                       request.status === 'Approved' && !request.printed_at && request.request_direction === 'OUTGOING' && (
                        <button
                          onClick={() => handlePrint(request.id)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Print Request"
                        >
                          <Printer size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Clock className="text-gray-300 mx-auto mb-4" size={48} />
            <p className="text-gray-500 text-lg">No ambulance requests found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <AmbulanceRequestModal
          request={selectedRequest}
          onClose={() => {
            setShowModal(false);
            setSelectedRequest(null);
          }}
          onUpdate={fetchRequests}
        />
      )}
    </div>
  );
};

export default AmbulanceRequestList;