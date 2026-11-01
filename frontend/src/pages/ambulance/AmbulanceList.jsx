import React, { useState, useEffect } from 'react';
import { Plus, Car, Search, Filter, RefreshCw, Edit, MapPin, Phone, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AmbulanceList = () => {
  const { authenticatedFetch, API_BASE_URL } = useAuth();
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAmbulance, setEditingAmbulance] = useState(null);

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const fetchAmbulances = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/ambulance`);
      const data = await response.json();
      if (data.success) {
        setAmbulances(data.data);
      }
    } catch (error) {
      console.error('Error fetching ambulances:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800 border-green-300';
      case 'On Call': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'On Trip': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Maintenance': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Mobile ICU': return 'bg-purple-100 text-purple-800';
      case 'Advanced': return 'bg-blue-100 text-blue-800';
      case 'Neonatal': return 'bg-pink-100 text-pink-800';
      default: return 'bg-teal-100 text-teal-800';
    }
  };

  const updateAmbulanceStatus = async (ambulanceId, newStatus) => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/ambulance/${ambulanceId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        }
      );
      
      const data = await response.json();
      if (data.success) {
        fetchAmbulances(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating ambulance status:', error);
    }
  };

  const filteredAmbulances = ambulances.filter(ambulance => {
    const matchesSearch = 
      ambulance.ambulance_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ambulance.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ambulance.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ambulance.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ambulance.status === statusFilter;
    const matchesType = typeFilter === 'all' || ambulance.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusCounts = {
    Available: ambulances.filter(a => a.status === 'Available').length,
    'On Call': ambulances.filter(a => a.status === 'On Call').length,
    'On Trip': ambulances.filter(a => a.status === 'On Trip').length,
    Maintenance: ambulances.filter(a => a.status === 'Maintenance').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="animate-spin text-teal-600 mx-auto mb-4" size={32} />
          <p className="text-gray-600">Loading ambulances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ambulance Fleet Management</h1>
          <p className="text-gray-600">Manage hospital ambulance vehicles and their status</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Ambulance
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{statusCounts.Available}</div>
          <div className="text-sm text-gray-600">Available</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{statusCounts['On Call']}</div>
          <div className="text-sm text-gray-600">On Call</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{statusCounts['On Trip']}</div>
          <div className="text-sm text-gray-600">On Trip</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{statusCounts.Maintenance}</div>
          <div className="text-sm text-gray-600">Maintenance</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by ambulance number, driver, type, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="all">All Status</option>
          <option value="Available">Available</option>
          <option value="On Call">On Call</option>
          <option value="On Trip">On Trip</option>
          <option value="Maintenance">Maintenance</option>
        </select>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="all">All Types</option>
          <option value="Basic">Basic</option>
          <option value="Advanced">Advanced</option>
          <option value="Mobile ICU">Mobile ICU</option>
          <option value="Neonatal">Neonatal</option>
        </select>
        
        <button
          onClick={fetchAmbulances}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Ambulance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAmbulances.map((ambulance) => (
          <div key={ambulance.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{ambulance.ambulance_number}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(ambulance.type)}`}>
                    {ambulance.type}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ambulance.status)}`}>
                  {ambulance.status}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Car size={16} />
                <span>Capacity: {ambulance.capacity} patients</span>
              </div>
              
              {ambulance.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={16} />
                  <span>{ambulance.location}</span>
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{ambulance.driver_name}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Phone size={14} />
                    <span>{ambulance.driver_phone}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingAmbulance(ambulance)}
                  className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  <Edit size={16} />
                </button>
              </div>

              {ambulance.equipment && (
                <div className="text-xs text-gray-500 mb-3">
                  <p className="font-medium mb-1">Equipment:</p>
                  <p className="line-clamp-2">
                    {typeof ambulance.equipment === 'string' 
                      ? JSON.parse(ambulance.equipment).join(', ')
                      : ambulance.equipment.join(', ')}
                  </p>
                </div>
              )}

              {/* Quick Status Actions */}
              <div className="flex gap-2 mt-3">
                {ambulance.status !== 'Available' && (
                  <button
                    onClick={() => updateAmbulanceStatus(ambulance.id, 'Available')}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors"
                  >
                    <CheckCircle size={12} />
                    Available
                  </button>
                )}
                
                {ambulance.status !== 'On Trip' && (
                  <button
                    onClick={() => updateAmbulanceStatus(ambulance.id, 'On Trip')}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded hover:bg-yellow-200 transition-colors"
                  >
                    <Car size={12} />
                    On Trip
                  </button>
                )}
                
                {ambulance.status !== 'Maintenance' && (
                  <button
                    onClick={() => updateAmbulanceStatus(ambulance.id, 'Maintenance')}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors"
                  >
                    <AlertCircle size={12} />
                    Maintenance
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAmbulances.length === 0 && (
        <div className="text-center py-12">
          <Car className="text-gray-300 mx-auto mb-4" size={48} />
          <p className="text-gray-500 text-lg">No ambulances found</p>
          <p className="text-gray-400 text-sm">Try adjusting your search criteria or add a new ambulance</p>
        </div>
      )}

      {/* Add Ambulance Modal */}
      {showAddForm && (
        <AddAmbulanceForm 
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            fetchAmbulances();
          }}
        />
      )}

      {/* Edit Ambulance Modal */}
      {editingAmbulance && (
        <EditAmbulanceForm 
          ambulance={editingAmbulance}
          onClose={() => setEditingAmbulance(null)}
          onSuccess={() => {
            setEditingAmbulance(null);
            fetchAmbulances();
          }}
        />
      )}
    </div>
  );
};

// Add Ambulance Form Component
const AddAmbulanceForm = ({ onClose, onSuccess }) => {
  const { authenticatedFetch, API_BASE_URL } = useAuth();
  const [formData, setFormData] = useState({
    ambulance_number: '',
    type: 'Basic',
    driver_name: '',
    driver_phone: '',
    capacity: 1,
    equipment: [],
    location: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const equipmentOptions = [
    'Oxygen Cylinder',
    'Defibrillator',
    'Ventilator',
    'Stretcher',
    'First Aid Kit',
    'IV Supplies',
    'Monitor',
    'Suction Device',
    'Spinal Board',
    'Neck Collar'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/ambulance`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to add ambulance');
      }
    } catch (error) {
      setError('Failed to add ambulance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentChange = (equipment) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...prev.equipment, equipment]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Ambulance</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ambulance Number *
              </label>
              <input
                type="text"
                value={formData.ambulance_number}
                onChange={(e) => setFormData({ ...formData, ambulance_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g., AMB-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              >
                <option value="Basic">Basic</option>
                <option value="Advanced">Advanced</option>
                <option value="Mobile ICU">Mobile ICU</option>
                <option value="Neonatal">Neonatal</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Name *
                </label>
                <input
                  type="text"
                  value={formData.driver_name}
                  onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Phone *
                </label>
                <input
                  type="tel"
                  value={formData.driver_phone}
                  onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {equipmentOptions.map((equipment) => (
                  <label key={equipment} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.equipment.includes(equipment)}
                      onChange={() => handleEquipmentChange(equipment)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">{equipment}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Current location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg transition-colors"
              >
                {loading ? 'Adding...' : 'Add Ambulance'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Edit Ambulance Form Component
const EditAmbulanceForm = ({ ambulance, onClose, onSuccess }) => {
  const { authenticatedFetch, API_BASE_URL } = useAuth();
  const [formData, setFormData] = useState({
    ambulance_number: ambulance.ambulance_number,
    type: ambulance.type,
    driver_name: ambulance.driver_name,
    driver_phone: ambulance.driver_phone,
    capacity: ambulance.capacity,
    equipment: typeof ambulance.equipment === 'string' ? JSON.parse(ambulance.equipment) : ambulance.equipment,
    location: ambulance.location || '',
    notes: ambulance.notes || '',
    status: ambulance.status
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const equipmentOptions = [
    'Oxygen Cylinder',
    'Defibrillator',
    'Ventilator',
    'Stretcher',
    'First Aid Kit',
    'IV Supplies',
    'Monitor',
    'Suction Device',
    'Spinal Board',
    'Neck Collar'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/ambulance/${ambulance.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to update ambulance');
      }
    } catch (error) {
      setError('Failed to update ambulance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentChange = (equipment) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...prev.equipment, equipment]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Ambulance</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ambulance Number *
              </label>
              <input
                type="text"
                value={formData.ambulance_number}
                onChange={(e) => setFormData({ ...formData, ambulance_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                >
                  <option value="Basic">Basic</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Mobile ICU">Mobile ICU</option>
                  <option value="Neonatal">Neonatal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                >
                  <option value="Available">Available</option>
                  <option value="On Call">On Call</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Name *
                </label>
                <input
                  type="text"
                  value={formData.driver_name}
                  onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Phone *
                </label>
                <input
                  type="tel"
                  value={formData.driver_phone}
                  onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {equipmentOptions.map((equipment) => (
                  <label key={equipment} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.equipment.includes(equipment)}
                      onChange={() => handleEquipmentChange(equipment)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">{equipment}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Current location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg transition-colors"
              >
                {loading ? 'Updating...' : 'Update Ambulance'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceList;