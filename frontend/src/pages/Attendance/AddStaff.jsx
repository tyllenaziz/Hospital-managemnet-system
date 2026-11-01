import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Phone, Lock, User, Briefcase, 
  Save, AlertCircle, CheckCircle, Edit2, Trash2, 
  Search, Eye, EyeOff, X
} from 'lucide-react';
import { useAuth, API_ENDPOINTS } from '../../context/AuthContext';

const AddStaff = () => {
  const { authenticatedFetch } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phone: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingStaff, setEditingStaff] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const roles = ['doctor', 'receptionist', 'pharmacy', 'lab', 'admin', 'supervisor', 'nurse'];

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.STAFF);
      const data = await response.json();
      if (Array.isArray(data)) {
        setStaffList(data);
      } else if (data.staff) {
        setStaffList(data.staff);
      }
    } catch (err) {
      console.error('Error fetching staff list:', err);
      setError('Failed to load staff list');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.username || !formData.role) {
      setError('Username and role are required');
      return false;
    }
    if (!editingStaff && !formData.password) {
      setError('Password is required for new staff');
      return false;
    }
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = editingStaff 
        ? `${API_ENDPOINTS.STAFF}/${editingStaff.id}`
        : API_ENDPOINTS.ADD_STAFF;

      const method = editingStaff ? 'PUT' : 'POST';

      const response = await authenticatedFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password || undefined,
          phone: formData.phone,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingStaff ? 'Staff member updated successfully!' : 'Staff member added successfully!');
        resetForm();
        fetchStaffList();
      } else {
        setError(data.error || data.message || `Failed to ${editingStaff ? 'update' : 'add'} staff member`);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Staff operation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      phone: '',
      role: ''
    });
    setEditingStaff(null);
    setShowPassword(false);
  };

  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      username: staff.username,
      password: '',
      phone: staff.phone || '',
      role: staff.role
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (staffId) => {
    try {
      const response = await authenticatedFetch(`${API_ENDPOINTS.STAFF}/${staffId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Staff member deleted successfully!');
        fetchStaffList();
      } else {
        setError(data.error || 'Failed to delete staff member');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Delete staff error:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const filteredStaff = staffList.filter(staff => {
    const matchesSearch = staff.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || staff.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff'}
            </h1>
            <p className="text-sm text-gray-600">
              {editingStaff ? 'Update staff member information' : 'Register a new staff member'}
            </p>
          </div>
        </div>

        {/* Add/Edit Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {!editingStaff && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={editingStaff ? "Leave blank to keep current" : "Enter password"}
                  required={!editingStaff}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  required
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="md:col-span-2 flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-teal-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingStaff ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    {editingStaff ? <Save size={16} /> : <UserPlus size={16} />}
                    {editingStaff ? 'Update Staff' : 'Add Staff'}
                  </>
                )}
              </button>
              
              {editingStaff && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Staff List */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Staff Members</h2>
              <p className="text-sm text-gray-600">Manage all staff accounts</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
              </div>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Username</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Role</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Phone</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 text-sm font-medium text-gray-900">{staff.username}</td>
                    <td className="py-2 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        staff.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        staff.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                        staff.role === 'receptionist' ? 'bg-green-100 text-green-800' :
                        staff.role === 'pharmacy' ? 'bg-teal-100 text-teal-800' :
                        staff.role === 'lab' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {staff.role?.charAt(0).toUpperCase() + staff.role?.slice(1)}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-600">
                      {staff.phone || 'Not provided'}
                    </td>
                    <td className="py-2 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(staff)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit staff"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(staff)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete staff"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredStaff.length === 0 && (
              <div className="text-center py-12">
                <User className="mx-auto text-gray-400 mb-3" size={40} />
                <p className="text-sm text-gray-600">No staff members found</p>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="text-red-600" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                  <p className="text-gray-600 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm mb-4">
                Are you sure you want to delete staff member <strong>{deleteConfirm.username}</strong>?
              </p>
              
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium border border-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddStaff;