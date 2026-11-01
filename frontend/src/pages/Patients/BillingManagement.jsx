import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Search, ArrowLeft, Eye, Printer, DollarSign, Calendar, User, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const BillingPage = () => {
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, dateFilter, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch(`${API_BASE_URL}/bills`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch patient bills');
      }

      const data = await response.json();
      
      // Handle the patient summary data structure
      let patientsArray = [];
      if (data.success && Array.isArray(data.patients)) {
        patientsArray = data.patients;
      } else if (Array.isArray(data)) {
        patientsArray = data;
      } else {
        patientsArray = data.patients || data.data || [];
      }
      
      // Sort by last bill date, newest first
      const sortedPatients = patientsArray.sort((a, b) => 
        new Date(b.last_bill_date) - new Date(a.last_bill_date)
      );
      
      setPatients(sortedPatients);
      setFilteredPatients(sortedPatients);
    } catch (err) {
      console.error('Error fetching patient bills:', err);
      setError(err.message || 'Failed to load patient bills');
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.patient_name?.toLowerCase().includes(term) ||
        patient.phone?.includes(term) ||
        patient.patient_number?.toString().includes(term)
      );
    }

    // Date filter - using last_bill_date instead of created_at
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(patient => {
        const billDate = new Date(patient.last_bill_date);
        billDate.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case 'today':
            return billDate.getTime() === today.getTime();
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return billDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return billDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredPatients(filtered);
  };

  const handleViewPatientBills = (patientId, billIds) => {
    // Navigate to a patient-specific bills page or show modal
    // For now, let's navigate to a patient bills page
    navigate(`/reception/patient-bills/${patientId}`, { 
      state: { billIds: billIds.split(',').map(id => id.trim()) }
    });
  };

  const getPaymentStatus = (patient) => {
    if (parseFloat(patient.paid_amount) > 0 && parseFloat(patient.pending_amount) > 0) {
      return 'partial';
    } else if (parseFloat(patient.paid_amount) > 0) {
      return 'paid';
    } else {
      return 'pending';
    }
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-700 border-green-300',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      partial: 'bg-orange-100 text-orange-700 border-orange-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300'
    };
    return styles[status] || styles.pending;
  };

  const getPaymentStatusText = (status) => {
    const texts = {
      paid: 'Paid',
      pending: 'Pending',
      partial: 'Partial',
      cancelled: 'Cancelled'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="text-gray-600 mt-4">Loading patient bills...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-300 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-600" size={24} />
            <div>
              <h3 className="font-semibold text-red-800 text-lg">Error Loading Patient Bills</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchPatients}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/reception/dashboard')}
              className="p-2 hover:bg-blue-100 rounded-lg transition text-slate-600 hover:text-teal-700"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">Patient Billing Summary</h1>
              <p className="text-slate-600">View patient billing overview and manage bills</p>
            </div>
          </div>
          
          <button
            onClick={fetchPatients}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Stats Cards - Updated for patient summary data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Patients</p>
                <p className="text-2xl font-bold text-slate-800">{patients.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Bills</p>
                <p className="text-2xl font-bold text-green-600">
                  {patients.reduce((sum, p) => sum + (p.total_bills || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Receipt className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          

          <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  KES {patients.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by patient name, phone, or patient ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 appearance-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-slate-600">
            Showing {filteredPatients.length} of {patients.length} patients
          </div>
        </div>

        {/* Patients Table - Updated for patient summary data */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-lg overflow-hidden">
          <div className="p-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50">
            <h2 className="text-xl font-bold text-slate-800">Patient Billing Summary</h2>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="p-12 text-center">
              <User size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-600 font-semibold mb-2">No patients found</h3>
              <p className="text-gray-500 text-sm">
                {searchTerm || dateFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No patient billing data available'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Patient ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Patient Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Last Bill Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Total Bills
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Total Amount
                    </th>
                    
                    
                    
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((patient) => {
                    
                    return (
                      <tr key={patient.patient_id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <span className="font-mono text-teal-600 font-semibold">
                            {patient.patient_number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-slate-800 font-medium">{patient.patient_name}</p>
                            <p className="text-slate-500 text-sm">{patient.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <p className="text-slate-800">
                              {new Date(patient.last_bill_date).toLocaleDateString('en-KE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-slate-500">
                              {new Date(patient.last_bill_date).toLocaleTimeString('en-KE', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 font-semibold">
                          {patient.total_bills}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          <span className="font-bold">
                            KES {parseFloat(patient.total_amount || 0).toFixed(2)}
                          </span>
                        </td>
                        
                        
                        
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleViewPatientBills(patient.patient_id, patient.bill_ids)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition text-sm font-medium"
                            title="View Patient Bills"
                          >
                            <Eye size={14} />
                            View Bills
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {filteredPatients.length > 0 && (
          <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-slate-600 mb-1">Total Patients</p>
                <p className="text-2xl font-bold text-slate-800">{filteredPatients.length}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-600 mb-1">Total Bills</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredPatients.reduce((sum, p) => sum + (p.total_bills || 0), 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-slate-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  KES {filteredPatients.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0).toFixed(2)}
                </p>
              </div>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPage;