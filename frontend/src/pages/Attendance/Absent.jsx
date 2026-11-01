import React, { useState, useEffect } from 'react';
import { Users, Search, Calendar, RefreshCw, XCircle } from 'lucide-react';
import { useAuth, API_ENDPOINTS } from '../../context/AuthContext';

const Absent = () => {
  const { authenticatedFetch } = useAuth();
  const [absentStaff, setAbsentStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAbsentStaff();
  }, [selectedDate]);

  const fetchAbsentStaff = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `${API_ENDPOINTS.ATTENDANCE_ABSENT}?date=${selectedDate}`
      );
      const data = await response.json();
      
      if (data.success) {
        setAbsentStaff(data.staff || []);
      }
    } catch (error) {
      console.error('Error fetching absent staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = absentStaff.filter(staff =>
    staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role) => {
    const roleColors = {
      'doctor': 'bg-blue-100 text-blue-800',
      'receptionist': 'bg-orange-100 text-orange-800',
      'admin': 'bg-purple-100 text-purple-800',
      'pharmacy': 'bg-teal-100 text-teal-800',
      'lab': 'bg-indigo-100 text-indigo-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return roleColors[role?.toLowerCase()] || roleColors.default;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Absent Staff</h1>
            <p className="text-sm text-gray-600">Manage staff absence records</p>
          </div>
          <button
            onClick={fetchAbsentStaff}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <XCircle className="text-red-600" size={18} />
            <div>
              <p className="text-lg font-bold text-gray-900">{absentStaff.length}</p>
              <p className="text-xs text-gray-600">Total Absent</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-600 text-sm mt-3">Loading...</p>
            </div>
          ) : filteredStaff.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Role</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Staff ID</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.user_id} className="hover:bg-gray-50">
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                            {staff.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <p className="font-medium text-gray-900 text-sm">{staff.name || 'Unknown'}</p>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(staff.role)}`}>
                          {staff.role || 'N/A'}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-900">{staff.staff_id || 'N/A'}</td>
                      <td className="py-2 px-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Absent
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400" size={40} />
              <p className="text-gray-600 text-sm mt-3">No absent staff</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Absent;