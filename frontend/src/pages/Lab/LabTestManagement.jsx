import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Plus, Edit2, Trash2, Search, X, Save, ArrowLeft, AlertCircle, Eye } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const LabTestManagement = () => {
  const navigate = useNavigate();
  const { authenticatedFetch, user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    test_name: '',
    test_code: '',
    category: '',
    price: '',
    normal_range: '',
    unit: '',
    description: '',
    is_enabled: true
  });

  const categories = [
    'Hematology',
    'Parasitology',
    'Hormonal',
    'Urine Analysis',
    'Serology',
    'Biochemistry',
    'Microbiology',
    'Immunology',
    'Pathology',
    'Radiology',
    'Cardiology',
    'Endocrinology',
    'Other'
  ];

  // Role-based permissions
  const canEdit = () => {
    return ['admin', 'lab'].includes(user?.role);
  };

  const canDelete = () => {
    return user?.role === 'admin';
  };

  const canCreate = () => {
    return ['admin', 'lab'].includes(user?.role);
  };

  const canViewDetails = () => {
    return ['admin', 'lab', 'receptionist', 'doctor', 'pharmacy'].includes(user?.role);
  };

  const isTemplateTest = Boolean(editingTest && !editingTest.is_custom);
  const canEditMetadata = canEdit() && !isTemplateTest;

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/lab/tests`);
      const data = await response.json();
      setTests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError(err.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenModal = (test = null) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        test_name: test.test_name || '',
        test_code: test.test_code || '',
        category: test.category || '',
        price: test.price || '',
        normal_range: test.normal_range || '',
        unit: test.unit || '',
        description: test.description || '',
        is_enabled: Boolean(test.is_enabled)
      });
    } else {
      setEditingTest(null);
      setFormData({
        test_name: '',
        test_code: '',
        category: '',
        price: '',
        normal_range: '',
        unit: '',
        description: '',
        is_enabled: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTest(null);
    setFormData({
      test_name: '',
      test_code: '',
      category: '',
      price: '',
      normal_range: '',
      unit: '',
      description: '',
      is_enabled: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingTest 
        ? `${API_BASE_URL}/lab/tests/${editingTest.id}`
        : `${API_BASE_URL}/lab/tests`;
      
      const method = editingTest ? 'PUT' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success || data.test) {
        await fetchTests();
        handleCloseModal();
        alert(editingTest ? 'Test updated successfully!' : 'Test created successfully!');
      } else {
        setError(data.error || 'Failed to save test');
      }
    } catch (err) {
      console.error('Error saving test:', err);
      setError(err.message || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/lab/tests/${testId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        await fetchTests();
        alert('Test deleted successfully!');
      } else {
        setError(data.error || 'Failed to delete test');
      }
    } catch (err) {
      console.error('Error deleting test:', err);
      setError(err.message || 'Failed to delete test');
    }
  };

  const filteredTests = tests.filter(test =>
    test.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.test_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="text-slate-600 mt-4">Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/lab/dashboard')}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">Lab Test Management</h1>
            <p className="text-sm text-slate-600">
              {user?.role === 'admin' ? 'Enable synced tests, set prices, and add custom laboratory tests' : 
               user?.role === 'lab' ? 'View hospital tests and manage custom laboratory tests' : 
               'View laboratory tests'}
            </p>
            {/* Role indicator */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">Logged in as:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                {user?.role}
              </span>
            </div>
          </div>
          
          {/* Add New Test Button - Only for admin and lab */}
          {canCreate() && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              <Plus size={18} />
              Add Custom Test
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search tests by name, code, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-white border border-blue-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tests Table */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                All Tests ({filteredTests.length})
              </h2>
              {!canCreate() && (
                <span className="text-sm text-slate-600 bg-white px-3 py-1 rounded-full border border-blue-200">
                  View Only
                </span>
              )}
            </div>
          </div>

          {filteredTests.length === 0 ? (
            <div className="p-12 text-center">
              <FlaskConical className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="text-slate-800 font-semibold mb-2">No tests found</h3>
              <p className="text-slate-600 text-sm">
                {searchTerm ? 'Try adjusting your search criteria' : 
                 canCreate() ? 'Click "Add New Test" to create your first test' : 
                 'No laboratory tests available'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Test Code</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Test Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Price</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Normal Range</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Unit</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {filteredTests.map((test) => (
                    <tr key={test.id} className="hover:bg-blue-50 transition">
                      <td className="px-3 py-2">
                        <span className="text-teal-600 font-mono font-semibold text-xs">
                          {test.test_code}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-800 font-medium">{test.test_name}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {test.category}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          test.is_custom ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {test.is_custom ? 'Custom' : 'Template'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          test.is_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {test.is_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-800 font-semibold">KES {test.price}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs">{test.normal_range || 'N/A'}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs">{test.unit || 'N/A'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          {/* View Details Button - For all roles */}
                          {canViewDetails() && (
                            <button
                              onClick={() => handleOpenModal(test)}
                              className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          
                          {/* Edit Button - Only for admin and lab */}
                          {canEdit() && (
                            <button
                              onClick={() => handleOpenModal(test)}
                              className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition"
                              title="Edit Test"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          
                          {/* Delete Button - Only for admin */}
                          {canDelete() && test.is_custom && (
                            <button
                              onClick={() => handleDelete(test.id)}
                              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition"
                              title="Delete Test"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-800">
                {editingTest ? 
                  (canEdit() ? 'Edit Lab Test' : 'Test Details') : 
                  'Add New Lab Test'
                }
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {isTemplateTest && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  This is a platform template test. This hospital can only enable it and set its price here.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Test Name */}
                <div>
                  <label className="block text-slate-700 font-medium mb-1 text-sm">
                    Test Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="test_name"
                    value={formData.test_name}
                    onChange={handleInputChange}
                    required={canEditMetadata}
                    disabled={!canEditMetadata}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent ${
                      !canEditMetadata ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="e.g., Complete Blood Count"
                  />
                </div>

                {/* Test Code */}
                <div>
                  <label className="block text-slate-700 font-medium mb-1 text-sm">
                    Test Code <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="test_code"
                    value={formData.test_code}
                    onChange={handleInputChange}
                    required={canEditMetadata}
                    disabled={!canEditMetadata}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent ${
                      !canEditMetadata ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="e.g., CBC001"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-slate-700 font-medium mb-1 text-sm">
                    Category <span className="text-red-600">*</span>
                  </label>
                  {canEditMetadata ? (
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.category}
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-900 cursor-not-allowed"
                    />
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-slate-700 font-medium mb-1 text-sm">
                    Price (KES) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required={canEdit()}
                    disabled={!canEdit()}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent ${
                      !canEdit() ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="e.g., 1200.00"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1 text-sm">
                    Enabled for this hospital
                  </label>
                  <label className={`flex items-center gap-3 rounded-lg border border-gray-300 px-3 py-2 ${
                    canEdit() ? 'cursor-pointer' : 'bg-gray-100 cursor-not-allowed'
                  }`}>
                    <input
                      type="checkbox"
                      name="is_enabled"
                      checked={Boolean(formData.is_enabled)}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_enabled: event.target.checked
                        }))
                      }
                      disabled={!canEdit()}
                    />
                    <span className="text-sm text-slate-700">
                      {formData.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {/* Normal Range */}
                <div>
                  <label className="block text-slate-700 font-medium mb-1 text-sm">
                    Normal Range
                  </label>
                  <input
                    type="text"
                    name="normal_range"
                    value={formData.normal_range}
                    onChange={handleInputChange}
                    disabled={!canEditMetadata}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent ${
                      !canEditMetadata ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="e.g., 4.5 - 11.0"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-slate-700 font-medium mb-1 text-sm">
                    Unit
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    disabled={!canEditMetadata}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent ${
                      !canEditMetadata ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="e.g., cells/µL, mg/dL"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-medium mb-1 text-sm">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={!canEditMetadata}
                  rows={3}
                  className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent resize-none ${
                    !canEditMetadata ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter test description or additional notes..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition"
                >
                  {canEdit() ? 'Cancel' : 'Close'}
                </button>
                
                {/* Save/Update Button - Only show for admin and lab */}
                {canEdit() && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>{editingTest ? 'Save Changes' : 'Create Test'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabTestManagement;
