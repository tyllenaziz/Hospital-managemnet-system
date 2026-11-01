import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, User, Printer, Eye, Filter } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const DispensedPrescriptions = () => {
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const [dispensedList, setDispensedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');

  useEffect(() => {
    fetchDispensedPrescriptions();
  }, []);

  const fetchDispensedPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/prescriptions/status/dispensed`);
      const data = await response.json();
      setDispensedList(Array.isArray(data.prescriptions) ? data.prescriptions : []);
    } catch (err) {
      console.error('Error fetching dispensed prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredList = dispensedList.filter(item => {
    const matchesSearch = 
      item.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.toString().includes(searchTerm);
    
    let matchesDate = true;
    if (filterDate !== 'all') {
      const itemDate = new Date(item.updated_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch(filterDate) {
        case 'today':
          matchesDate = itemDate >= today;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = itemDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = itemDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  const handlePrintReceipt = (id) => {
    // Open receipt in new tab for printing
    window.open(`/pharmacy/receipt/${id}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <button
          onClick={() => navigate('/pharmacy/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-teal-700 transition font-medium text-sm"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Dispensed Prescriptions</h1>
          <p className="text-sm text-gray-600">View all dispensed prescriptions and generate receipts</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by patient name or prescription ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 appearance-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dispensed List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
            <h2 className="text-lg font-bold text-gray-800">
              Dispensed Prescriptions ({filteredList.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
              <p className="text-gray-600 mt-3 text-sm">Loading...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">No dispensed prescriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Prescription ID</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Patient</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Doctor</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Date Dispensed</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-2">
                        <span className="text-teal-600 font-mono font-semibold text-xs">
                          #{item.id}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center">
                            <User size={14} className="text-white" />
                          </div>
                          <span className="text-gray-800 font-medium">{item.patient_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-gray-600">Dr. {item.doctor_name}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">
                        {new Date(item.updated_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/pharmacy/receipt/${item.id}`)}
                            className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition flex items-center gap-1"
                            title="View Receipt"
                          >
                            <Eye size={14} />
                            <span className="text-xs">View</span>
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(item.id)}
                            className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition flex items-center gap-1"
                            title="Print Receipt"
                          >
                            <Printer size={14} />
                            <span className="text-xs">Print</span>
                          </button>
                        </div>
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

export default DispensedPrescriptions;