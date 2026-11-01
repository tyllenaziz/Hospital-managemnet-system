import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Package, Cpu, Wrench, AlertTriangle, Calendar, Barcode, Hash } from 'lucide-react';
import { useAuth, API_ENDPOINTS } from '../../context/AuthContext';
import AddEquipment from './AddEquipment';

const EquipmentList = () => {
  const { authenticatedFetch, user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);

  // Check if user has admin role for management
  const canManageInventory = user?.role === 'admin';

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.INVENTORY.EQUIPMENT);
      const data = await response.json();
      
      if (data.success) {
        setEquipment(data.equipment || []);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEquipment = async (equipmentData) => {
    try {
      const endpoint = editingEquipment?.id 
        ? API_ENDPOINTS.INVENTORY.UPDATE_EQUIPMENT(editingEquipment.id)
        : API_ENDPOINTS.INVENTORY.ADD_EQUIPMENT;
      
      const method = editingEquipment?.id ? 'PUT' : 'POST';
      
      const response = await authenticatedFetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(equipmentData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchEquipment();
        return data;
      } else {
        throw new Error(data.error || 'Failed to save equipment');
      }
    } catch (error) {
      console.error('Error saving equipment:', error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      try {
        const response = await authenticatedFetch(
          API_ENDPOINTS.INVENTORY.DELETE_EQUIPMENT(id),
          { method: 'DELETE' }
        );
        
        const data = await response.json();
        
        if (data.success) {
          setEquipment(equipment.filter(item => item.id !== id));
        } else {
          alert('Failed to delete equipment: ' + data.error);
        }
      } catch (error) {
        console.error('Error deleting equipment:', error);
        alert('Error deleting equipment');
      }
    }
  };

  const handleEdit = (equipment) => {
    if (!canManageInventory) return;
    setEditingEquipment(equipment);
    setShowModal(true);
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      item.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  const getStatusCount = (status) => {
    return equipment.filter(item => item.status === status).length;
  };

  // Calculate total equipment value
  const calculateTotalValue = () => {
    return equipment.reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 1;
      const price = parseFloat(item.purchase_price) || 0;
      return total + (price * quantity);
    }, 0);
  };

  // Calculate total items count including quantity
  const calculateTotalItems = () => {
    return equipment.reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 1;
      return total + quantity;
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipment Inventory</h1>
            <p className="text-sm text-gray-600">
              {canManageInventory ? 'Manage and track medical equipment' : 'View equipment inventory'}
            </p>
            {!canManageInventory && (
              <p className="text-xs text-orange-600 mt-1">
                Read-only access - Contact admin for equipment updates
              </p>
            )}
          </div>
          {/* Only show action buttons if user can manage inventory */}
          {canManageInventory && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingEquipment(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Add Equipment
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Package className="text-blue-600" size={18} />
              <div>
                <p className="text-lg font-bold text-gray-900">{equipment.length}</p>
                <p className="text-xs text-gray-600">Equipment Types</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Hash className="text-teal-600" size={18} />
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {calculateTotalItems()}
                </p>
                <p className="text-xs text-gray-600">Total Items</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Cpu className="text-green-600" size={18} />
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {getStatusCount('active')}
                </p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Wrench className="text-yellow-600" size={18} />
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {getStatusCount('maintenance')}
                </p>
                <p className="text-xs text-gray-600">Maintenance</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={18} />
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {getStatusCount('broken')}
                </p>
                <p className="text-xs text-gray-600">Broken</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Value Card - No background color, different text colors */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Equipment Value</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(calculateTotalValue())}</p>
              <p className="text-xs text-gray-500 mt-1">
                Based on {calculateTotalItems()} items across {equipment.length} equipment types
              </p>
            </div>
            <Package size={32} className="text-blue-500" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name, serial number, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="all">All Equipment</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
                <option value="broken">Broken</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 text-sm mt-3">Loading...</p>
            </div>
          ) : filteredEquipment.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Equipment</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Serial Number</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Purchase Date</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Quantity</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Unit Price</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Total Value</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Location</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Status</th>
                    {/* Hide Actions column if user cannot manage inventory */}
                    {canManageInventory && (
                      <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEquipment.map((item) => {
                    const quantity = parseInt(item.quantity) || 1;
                    const unitPrice = parseFloat(item.purchase_price) || 0;
                    const totalValue = quantity * unitPrice;
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{item.name}</span>
                            {item.status === 'broken' && (
                              <AlertTriangle size={14} className="text-red-500" />
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-600 mt-1 truncate max-w-xs">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <span className="text-sm text-gray-600 font-mono">{item.serial_number}</span>
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-600">
                          {formatDate(item.purchase_date)}
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-900 font-medium">
                          <div className="flex items-center gap-1">
                            <Hash size={14} className="text-gray-400" />
                            {quantity}
                          </div>
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-600">
                          {formatCurrency(unitPrice)}
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-900 font-semibold">
                          {formatCurrency(totalValue)}
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-600">
                          {item.location || 'N/A'}
                        </td>
                        <td className="py-2 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            item.status === 'active' ? 'bg-green-100 text-green-800' :
                            item.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'retired' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.status === 'active' ? 'Active' :
                             item.status === 'maintenance' ? 'Maintenance' :
                             item.status === 'retired' ? 'Retired' : 'Broken'}
                          </span>
                        </td>
                        {/* Hide action buttons if user cannot manage inventory */}
                        {canManageInventory && (
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleEdit(item)}
                                className="p-1.5 hover:bg-blue-50 rounded-lg transition text-blue-600"
                                title="Edit equipment"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition text-red-600"
                                title="Delete equipment"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-400" size={40} />
              <p className="text-gray-600 text-sm mt-3">No equipment found</p>
              {searchTerm && (
                <p className="text-gray-500 text-xs mt-1">
                  Try adjusting your search terms
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Only show modal for users who can manage inventory */}
      {canManageInventory && (
        <AddEquipment
          isOpen={showModal}
          equipment={editingEquipment}
          onSave={handleSaveEquipment}
          onClose={() => {
            setShowModal(false);
            setEditingEquipment(null);
          }}
        />
      )}
    </div>
  );
};

export default EquipmentList;