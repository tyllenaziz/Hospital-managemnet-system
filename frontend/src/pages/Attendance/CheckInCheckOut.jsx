import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Search, Calendar, RefreshCw, Clock, Users } from 'lucide-react';
import { useAuth, API_ENDPOINTS } from '../../context/AuthContext';

const CheckInCheckOut = () => {
  const { authenticatedFetch } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [selectedDate]);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `${API_ENDPOINTS.ATTENDANCE_RECORDS}?date=${selectedDate}`
      );
      const data = await response.json();
      
      if (data.success) {
        setAttendanceRecords(data.records || []);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = attendanceRecords.filter(record =>
    record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'checked_in':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'checked_out':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not recorded';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const calculateHoursWorked = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return '0h 0m';
    
    try {
      const checkIn = new Date(`2000-01-01T${checkInTime}`);
      const checkOut = new Date(`2000-01-01T${checkOutTime}`);
      const diffMs = checkOut - checkIn;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch {
      return 'Calculation error';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Records</h1>
            <p className="text-gray-600 text-lg">Complete check-in and check-out history</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 font-medium">Last updated: {new Date().toLocaleTimeString()}</span>
            <button
              onClick={fetchAttendanceRecords}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats and Filters Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-blue-600 font-semibold text-lg">{filteredRecords.length}</p>
                  <p className="text-blue-500 text-sm">Total Records</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <LogIn className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-green-600 font-semibold text-lg">
                    {filteredRecords.filter(record => record.check_in_time).length}
                  </p>
                  <p className="text-green-500 text-sm">Checked In</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <LogOut className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-purple-600 font-semibold text-lg">
                    {filteredRecords.filter(record => record.check_out_time).length}
                  </p>
                  <p className="text-purple-500 text-sm">Checked Out</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="text-orange-600" size={20} />
                </div>
                <div>
                  <p className="text-orange-600 font-semibold text-sm">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-orange-500 text-sm">Selected Date</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            <div className="flex items-center justify-end">
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                Showing {filteredRecords.length} of {attendanceRecords.length} records
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Records Table Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-gray-600 text-lg font-medium">Loading attendance records...</p>
              <p className="text-gray-500 text-sm mt-2">Please wait while we fetch the records</p>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="text-left py-4 px-6 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left py-4 px-6 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="text-left py-4 px-6 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="text-left py-4 px-6 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                      Hours Worked
                    </th>
                    <th className="text-left py-4 px-6 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr 
                      key={record.id} 
                      className="hover:bg-blue-50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                            {record.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{record.name}</p>
                            <p className="text-gray-500 text-sm">ID: {record.staff_id}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
                          {record.role}
                        </span>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <LogIn size={16} className="text-green-500" />
                          <div>
                            <p className="text-gray-900 font-medium text-sm">
                              {record.check_in_time ? formatTime(record.check_in_time) : 'Not checked in'}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <LogOut size={16} className="text-purple-500" />
                          <div>
                            <p className="text-gray-900 font-medium text-sm">
                              {record.check_out_time ? formatTime(record.check_out_time) : 'Active'}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-blue-500" />
                          <span className="text-gray-900 font-semibold">
                            {calculateHoursWorked(record.check_in_time, record.check_out_time)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(record.status)}`}>
                          {record.status?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="text-gray-400" size={32} />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Records Found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchTerm || selectedDate !== new Date().toISOString().split('T')[0] 
                  ? 'No attendance records match your current filters.'
                  : 'No attendance records available for today.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckInCheckOut;