import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, TrendingUp, Check, X, Download, Filter, Search, MoreVertical, Phone, AlertCircle, Wifi, Settings as SettingsIcon, Edit2 } from 'lucide-react';

const EmployeeAttendanceView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    present: 0,
    absent: 0,
    late: 0
  });
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [error, setError] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(false);
  const [deviceIP, setDeviceIP] = useState('');
  const [devicePort, setDevicePort] = useState('4370');
  const [bridgeURL, setBridgeURL] = useState('http://localhost:3300');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Persisted settings state
  const [persistedSettings, setPersistedSettings] = useState(() => {
    // Load from localStorage on initial mount (production ready)
    try {
      const saved = localStorage.getItem('zktecoSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
    return {
      ip: '',
      port: '4370',
      bridgeURL: 'http://localhost:3300'
    };
  });

  // Get ZKTeco settings
  const getZKTecoSettings = () => {
    return persistedSettings;
  };

  // Save ZKTeco settings (production ready with localStorage)
  const saveZKTecoSettings = (ip, port, bridge) => {
    const newSettings = { ip, port, bridgeURL: bridge };
    setPersistedSettings(newSettings);
    
    // Persist to localStorage
    try {
      localStorage.setItem('zktecoSettings', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  useEffect(() => {
    // Load settings on mount
    setDeviceIP(persistedSettings.ip);
    setDevicePort(persistedSettings.port);
    setBridgeURL(persistedSettings.bridgeURL);
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    
    const settings = getZKTecoSettings();
    
    if (!settings.ip) {
      setError('ZKTeco device not configured. Click the device icon to configure.');
      setLoading(false);
      return;
    }

    try {
      // Fetch raw attendance from local bridge
      const response = await fetch(`${settings.bridgeURL}/api/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ip: settings.ip,
          port: parseInt(settings.port),
          date: selectedDate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance from local bridge');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch attendance');
      }

      // Process attendance data
      const processedAttendance = processAttendanceRecords(data.data || []);
      setAttendance(processedAttendance);
      calculateStats(processedAttendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError(error.message || 'Failed to fetch attendance. Make sure the local bridge is running.');
    } finally {
      setLoading(false);
    }
  };

  const testDeviceConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      const response = await fetch(`${bridgeURL}/api/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ip: deviceIP,
          port: parseInt(devicePort)
        })
      });

      const data = await response.json();

      if (data.success) {
        setConnectionStatus({
          type: 'success',
          message: `Connected successfully! Found ${data.userCount || 0} users in device.`
        });
      } else {
        setConnectionStatus({
          type: 'error',
          message: data.message || 'Connection failed'
        });
      }
    } catch (err) {
      setConnectionStatus({
        type: 'error',
        message: 'Cannot reach local bridge. Make sure it is running on ' + bridgeURL
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveDeviceSettings = () => {
    // Validate IP
    if (!deviceIP || !isValidIP(deviceIP)) {
      setConnectionStatus({
        type: 'error',
        message: 'Please enter a valid IP address (e.g., 192.168.1.203)'
      });
      return;
    }

    // Save settings
    saveZKTecoSettings(deviceIP, devicePort, bridgeURL);
    
    setConnectionStatus({
      type: 'success',
      message: 'Settings saved successfully! You can now fetch attendance.'
    });
    
    setEditingDevice(false);
    
    // Refresh attendance with new settings
    setTimeout(() => {
      fetchAttendance();
    }, 1000);
  };

  const isValidIP = (ip) => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;
    
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part);
      return num >= 0 && num <= 255;
    });
  };

  const processAttendanceRecords = (records) => {
    // Group records by deviceUserId
    const employeeMap = new Map();

    records.forEach(record => {
      const userId = record.deviceUserId;
      
      if (!employeeMap.has(userId)) {
        employeeMap.set(userId, {
          id: userId,
          user_id: userId,
          deviceUserId: userId,
          name: record.name || 'Unknown User',
          role: determineRole(record.name),
          staff_id: userId,
          status: 'absent',
          check_in_time: null,
          check_out_time: null,
          records: []
        });
      }

      employeeMap.get(userId).records.push(record);
    });

    // Process each employee's records
    const processedEmployees = Array.from(employeeMap.values()).map(employee => {
      if (employee.records.length === 0) {
        return employee;
      }

      // Sort records by time
      employee.records.sort((a, b) => 
        new Date(a.recordTime) - new Date(b.recordTime)
      );

      // First record is check-in
      const firstRecord = employee.records[0];
      employee.check_in_time = new Date(firstRecord.recordTime).toTimeString().split(' ')[0];
      employee.status = 'present';

      // Last record (if different from first) is check-out
      if (employee.records.length > 1) {
        const lastRecord = employee.records[employee.records.length - 1];
        employee.check_out_time = new Date(lastRecord.recordTime).toTimeString().split(' ')[0];
      }

      // Check if late (after 9:00 AM)
      const checkInDate = new Date(firstRecord.recordTime);
      const checkInHour = checkInDate.getHours();
      const checkInMinute = checkInDate.getMinutes();
      
      if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0)) {
        employee.status = 'late';
      }

      return employee;
    });

    return processedEmployees;
  };

  const determineRole = (name) => {
    const nameLower = (name || '').toLowerCase();
    if (nameLower.includes('dr') || nameLower.includes('doc')) return 'doctor';
    if (nameLower.includes('nurse')) return 'nurse';
    if (nameLower.includes('reception')) return 'receptionist';
    if (nameLower.includes('pharm')) return 'pharmacy';
    if (nameLower.includes('lab')) return 'lab';
    if (nameLower.includes('admin')) return 'admin';
    return 'staff';
  };

  const calculateStats = (attendanceData) => {
    const total = attendanceData.length;
    const present = attendanceData.filter(emp => 
      emp.status === 'present' || emp.status === 'late'
    ).length;
    const absent = attendanceData.filter(emp => emp.status === 'absent').length;
    const late = attendanceData.filter(emp => emp.status === 'late').length;

    setStats({
      totalEmployees: total,
      present,
      absent,
      late
    });
  };

  const filteredAttendance = attendance.filter(employee => {
    const matchesRole = filterRole === 'all' || employee.role === filterRole;
    const matchesSearch = employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { color: 'bg-green-100 text-green-700 border-green-300', icon: Check, label: 'Present' },
      checked_in: { color: 'bg-green-100 text-green-700 border-green-300', icon: Check, label: 'Present' },
      absent: { color: 'bg-red-100 text-red-700 border-red-300', icon: X, label: 'Absent' },
      late: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock, label: 'Late' }
    };
    
    const config = statusConfig[status] || statusConfig.present;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <IconComponent size={14} />
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      doctor: 'bg-blue-100 text-blue-700 border-blue-300',
      nurse: 'bg-green-100 text-green-700 border-green-300',
      receptionist: 'bg-purple-100 text-purple-700 border-purple-300',
      pharmacy: 'bg-teal-100 text-teal-700 border-teal-300',
      lab: 'bg-orange-100 text-orange-700 border-orange-300',
      admin: 'bg-pink-100 text-pink-700 border-pink-300',
      staff: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${roleColors[role] || roleColors.staff}`}>
        {role?.charAt(0).toUpperCase() + role?.slice(1) || 'Staff'}
      </span>
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
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
    if (!checkInTime) return 0;
    if (!checkOutTime) {
      const checkIn = new Date(`2000-01-01T${checkInTime}`);
      const now = new Date();
      const currentTime = new Date(`2000-01-01T${now.toTimeString().split(' ')[0]}`);
      const diffMs = currentTime - checkIn;
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    }
    
    try {
      const checkIn = new Date(`2000-01-01T${checkInTime}`);
      const checkOut = new Date(`2000-01-01T${checkOutTime}`);
      const diffMs = checkOut - checkIn;
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    } catch {
      return 0;
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Device User ID', 'Role', 'Status', 'Check In', 'Check Out', 'Hours Worked', 'Date'];
    const csvData = filteredAttendance.map(emp => [
      emp.name || 'Unknown',
      emp.deviceUserId || 'N/A',
      emp.role || 'N/A',
      emp.status || 'N/A',
      formatTime(emp.check_in_time),
      formatTime(emp.check_out_time),
      calculateHoursWorked(emp.check_in_time, emp.check_out_time),
      selectedDate
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Attendance</h1>
          <p className="text-gray-600">Track and manage staff attendance from ZKTeco device</p>
        </div>
        
        {/* Device Config Button */}
        <button
          onClick={() => setShowDeviceModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg"
        >
          <Wifi size={20} />
          <span className="hidden sm:inline">Device: {deviceIP || 'Not Set'}</span>
          <SettingsIcon size={16} />
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
          <div className="flex-1">
            <p className="text-red-700 font-semibold">{error}</p>
            <p className="text-red-600 text-sm mt-1">
              {!deviceIP ? 'Click the device button above to configure your ZKTeco device.' : 'Check your settings or ensure the local bridge server is running.'}
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEmployees}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Present Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.present}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Check className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Absent Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.absent}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <X className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Late Arrivals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.late}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Date Picker */}
            <div className="relative flex-1 sm:flex-none">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-64 bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Role Filter */}
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full sm:w-48 bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
              >
                <option value="all">All Roles</option>
                <option value="doctor">Doctors</option>
                <option value="nurse">Nurses</option>
                <option value="receptionist">Receptionists</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="lab">Lab</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              disabled={filteredAttendance.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
            >
              <Download size={20} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Attendance Records - {selectedDate}</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading attendance data from device...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 text-gray-600 font-semibold">Employee</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-semibold">Role</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-semibold">Status</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-semibold">Check In</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-semibold">Check Out</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-semibold">Hours</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((employee) => (
                    <tr key={employee.id || employee.deviceUserId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">{employee.name || 'Unknown'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone size={14} className="text-gray-400" />
                            <p className="text-gray-500 text-sm">ID: {employee.deviceUserId || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getRoleBadge(employee.role)}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(employee.status)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-medium ${employee.check_in_time ? 'text-gray-900' : 'text-gray-400'}`}>
                          {formatTime(employee.check_in_time)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-medium ${employee.check_out_time ? 'text-gray-900' : 'text-gray-400'}`}>
                          {formatTime(employee.check_out_time)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900">
                          {calculateHoursWorked(employee.check_in_time, employee.check_out_time)}h
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => setSelectedEmployee(employee)}
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredAttendance.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="font-semibold">No attendance records found</p>
                  <p className="text-sm mt-2">No employees checked in on {selectedDate}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Employee Details</h3>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">Name</p>
                  <p className="text-gray-900 font-semibold">{selectedEmployee.name || 'Unknown'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Role</p>
                    <p className="text-gray-900 font-semibold capitalize">{selectedEmployee.role || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Status</p>
                    {getStatusBadge(selectedEmployee.status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Check In</p>
                    <p className="text-gray-900 font-semibold">{formatTime(selectedEmployee.check_in_time)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Check Out</p>
                    <p className="text-gray-900 font-semibold">{formatTime(selectedEmployee.check_out_time)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Hours Worked</p>
                    <p className="text-gray-900 font-semibold">
                      {calculateHoursWorked(selectedEmployee.check_in_time, selectedEmployee.check_out_time)}h
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Device User ID</p>
                    <p className="text-gray-900 font-semibold">{selectedEmployee.deviceUserId || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-600 text-sm mb-2">Total Records Today</p>
                  <p className="text-gray-900 font-semibold">{selectedEmployee.records?.length || 0} punch(es)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Device Configuration Modal */}
      {showDeviceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Wifi className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">ZKTeco Device Settings</h3>
                    <p className="text-gray-600 text-sm">Configure attendance device connection</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDeviceModal(false);
                    setEditingDevice(false);
                    setConnectionStatus(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Current Configuration or Edit Form */}
              {!editingDevice ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Bridge URL</span>
                      <span className="text-gray-900 font-mono text-sm">{bridgeURL}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Device IP</span>
                      <span className="text-gray-900 font-mono text-sm">{deviceIP || 'Not configured'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Device Port</span>
                      <span className="text-gray-900 font-mono text-sm">{devicePort}</span>
                    </div>
                  </div>

                  {deviceIP && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <Check size={16} />
                        <span className="font-semibold text-sm">Device Configured</span>
                      </div>
                      <p className="text-green-600 text-xs">
                        Attendance data will be fetched from {deviceIP}:{devicePort}
                      </p>
                    </div>
                  )}

                  {!deviceIP && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-yellow-700 mb-2">
                        <AlertCircle size={16} />
                        <span className="font-semibold text-sm">Device Not Configured</span>
                      </div>
                      <p className="text-yellow-600 text-xs">
                        Please configure your ZKTeco device to fetch attendance data
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setEditingDevice(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all"
                  >
                    <Edit2 size={20} />
                    <span>{deviceIP ? 'Edit Configuration' : 'Configure Device'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Bridge URL */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Local Bridge URL
                    </label>
                    <input
                      type="text"
                      value={bridgeURL}
                      onChange={(e) => setBridgeURL(e.target.value)}
                      placeholder="http://localhost:3300"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Device IP */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Device IP Address
                    </label>
                    <div className="flex items-center gap-2">
                      <Wifi size={20} className="text-gray-400" />
                      <input
                        type="text"
                        value={deviceIP}
                        onChange={(e) => setDeviceIP(e.target.value)}
                        placeholder="192.168.1.203"
                        className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-1">Enter your ZKTeco device's local network IP</p>
                  </div>

                  {/* Device Port */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Device Port
                    </label>
                    <input
                      type="number"
                      value={devicePort}
                      onChange={(e) => setDevicePort(e.target.value)}
                      placeholder="4370"
                      className="w-32 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <p className="text-gray-500 text-xs mt-1">Default: 4370</p>
                  </div>

                  {/* Connection Status */}
                  {connectionStatus && (
                    <div className={`rounded-xl p-4 flex items-center gap-3 ${
                      connectionStatus.type === 'success' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      {connectionStatus.type === 'success' ? (
                        <Check className="text-green-600 flex-shrink-0" size={20} />
                      ) : (
                        <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                      )}
                      <p className={`text-sm ${connectionStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                        {connectionStatus.message}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={testDeviceConnection}
                      disabled={!deviceIP || testingConnection}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
                    >
                      {testingConnection ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Wifi size={20} />
                          <span>Test</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleSaveDeviceSettings}
                      disabled={!deviceIP || testingConnection}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
                    >
                      <Check size={20} />
                      <span>Save</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingDevice(false);
                        setConnectionStatus(null);
                        // Reload current settings
                        const settings = getZKTecoSettings();
                        setDeviceIP(settings.ip);
                        setDevicePort(settings.port);
                        setBridgeURL(settings.bridgeURL);
                      }}
                      className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Help Text */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                      <div className="text-xs text-blue-700 space-y-1">
                        <p>• Ensure the local bridge server is running</p>
                        <p>• Device must be on the same network</p>
                        <p>• Test connection before saving</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendanceView;