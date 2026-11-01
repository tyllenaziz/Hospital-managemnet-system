import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Package, AlertTriangle, Calendar, Barcode, Hash, DollarSign } from 'lucide-react';
import { useAuth, API_ENDPOINTS } from '../../context/AuthContext';
import BarcodeScanner from '../../components/BarcodeScanner';
import MedicineModal from '../../components/MedicineModal';

const MedicineList = () => {
  const { authenticatedFetch, user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  // Check if user has pharmacy role
  const isPharmacyRole = ['pharmacy', 'doctor'].includes(user?.role);
  // Check if user has admin or inventory management permissions
  const canManageInventory = user?.role === 'admin';

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.INVENTORY.MEDICINES);
      const data = await response.json();
      
      if (data.success) {
        setMedicines(data.medicines || []);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = async (barcode) => {
    // Pharmacy role cannot add/edit medicines via barcode
    if (isPharmacyRole) return;
    
    setShowScanner(false);
    
    try {
      const response = await authenticatedFetch(
        API_ENDPOINTS.INVENTORY.MEDICINE_BY_BARCODE(barcode)
      );
      const data = await response.json();
      
      if (data.success && data.exists) {
        if (window.confirm('Medicine with this barcode already exists. Would you like to edit it?')) {
          setEditingMedicine(data.medicine);
          setShowModal(true);
        }
      } else {
        setEditingMedicine({ barcode });
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error checking barcode:', error);
      setEditingMedicine({ barcode });
      setShowModal(true);
    }
  };

  const handleSaveMedicine = async (medicineData) => {
    try {
      const endpoint = editingMedicine?.id 
        ? API_ENDPOINTS.INVENTORY.UPDATE_MEDICINE(editingMedicine.id)
        : API_ENDPOINTS.INVENTORY.ADD_MEDICINE;
      
      const method = editingMedicine?.id ? 'PUT' : 'POST';
      
      const response = await authenticatedFetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(medicineData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchMedicines();
        return data;
      } else {
        throw new Error(data.error || 'Failed to save medicine');
      }
    } catch (error) {
      console.error('Error saving medicine:', error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        const response = await authenticatedFetch(
          API_ENDPOINTS.INVENTORY.DELETE_MEDICINE(id),
          { method: 'DELETE' }
        );
        
        const data = await response.json();
        
        if (data.success) {
          setMedicines(medicines.filter(med => med.id !== id));
        } else {
          alert('Failed to delete medicine: ' + data.error);
        }
      } catch (error) {
        console.error('Error deleting medicine:', error);
        alert('Error deleting medicine');
      }
    }
  };

  const handleEdit = (medicine) => {
    if (isPharmacyRole) return;
    setEditingMedicine(medicine);
    setShowModal(true);
  };

  const isExpiringSoon = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90 && diffDays > 0;
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         med.barcode?.includes(searchTerm);
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'low-stock' && med.stock < 20) ||
      (filterStatus === 'expiring' && isExpiringSoon(med.expiry_date)) ||
      (filterStatus === 'expired' && isExpired(med.expiry_date));
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString) => {
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

  // Calculate total medicine value
  const calculateTotalValue = () => {
    return medicines.reduce((total, med) => {
      const stock = parseInt(med.stock) || 0;
      const price = parseFloat(med.price) || 0;
      return total + (price * stock);
    }, 0);
  };

  // Calculate total stock count
  const calculateTotalStock = () => {
    return medicines.reduce((total, med) => {
      const stock = parseInt(med.stock) || 0;
      return total + stock;
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medicine Inventory</h1>
            <p className="text-sm text-gray-600">
              {isPharmacyRole ? 'View medicine stock and availability' : 'Manage and track medicine stock'}
            </p>
            {isPharmacyRole && (
              <p className="text-xs text-orange-600 mt-1">
                Read-only access - Contact admin for stock updates
              </p>
            )}
          </div>
          {/* Only show action buttons if user can manage inventory */}
          {canManageInventory && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Barcode size={16} />
                Scan
              </button>
              <button
                onClick={() => {
                  setEditingMedicine(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Add Medicine
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
                <p className="text-lg font-bold text-gray-900">{medicines.length}</p>
                <p className="text-xs text-gray-600">Medicine Types</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Hash className="text-teal-600" size={18} />
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {calculateTotalStock()}
                </p>
                <p className="text-xs text-gray-600">Total Stock</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={18} />
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {medicines.filter(m => m.stock < 20).length}
                </p>
                <p className="text-xs text-gray-600">Low Stock</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-yellow-600" size={18} />
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {medicines.filter(m => isExpiringSoon(m.expiry_date)).length}
                </p>
                <p className="text-xs text-gray-600">Expiring Soon</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-orange-600" size={18} />
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {medicines.filter(m => isExpired(m.expiry_date)).length}
                </p>
                <p className="text-xs text-gray-600">Expired</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Value Card - No background color, different text colors */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Medicine Value</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(calculateTotalValue())}</p>
              <p className="text-xs text-gray-500 mt-1">
                Based on {calculateTotalStock()} items across {medicines.length} medicine types
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
                placeholder="Search by name or barcode..."
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
                <option value="all">All Medicines</option>
                <option value="low-stock">Low Stock (&lt; 20)</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
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
          ) : filteredMedicines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Medicine</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Barcode</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Stock</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Unit Price</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Total Value</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Expiry</th>
                    {/* Hide Actions column for pharmacy role */}
                    {!isPharmacyRole && (
                      <th className="text-left py-2 px-4 text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMedicines.map((medicine) => {
                    const stock = parseInt(medicine.stock) || 0;
                    const unitPrice = parseFloat(medicine.price) || 0;
                    const totalValue = stock * unitPrice;
                    
                    return (
                      <tr key={medicine.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{medicine.name}</span>
                            {medicine.stock < 20 && (
                              <AlertTriangle size={14} className="text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <span className="text-sm text-gray-600 font-mono">{medicine.barcode}</span>
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-1">
                            <Hash size={14} className="text-gray-400" />
                            <span className={`text-sm font-semibold ${medicine.stock < 20 ? 'text-red-600' : 'text-green-600'}`}>
                              {stock}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-600">
                          {formatCurrency(unitPrice)}
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-900 font-semibold">
                          {formatCurrency(totalValue)}
                        </td>
                        <td className="py-2 px-4">
                          {isExpired(medicine.expiry_date) ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium">
                              Expired
                            </span>
                          ) : isExpiringSoon(medicine.expiry_date) ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                              {formatDate(medicine.expiry_date)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-600">
                              {formatDate(medicine.expiry_date)}
                            </span>
                          )}
                        </td>
                        {/* Hide action buttons for pharmacy role */}
                        {!isPharmacyRole && (
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleEdit(medicine)}
                                className="p-1.5 hover:bg-blue-50 rounded-lg transition text-blue-600"
                                title="Edit medicine"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(medicine.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition text-red-600"
                                title="Delete medicine"
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
              <p className="text-gray-600 text-sm mt-3">No medicines found</p>
              {searchTerm && (
                <p className="text-gray-500 text-xs mt-1">
                  Try adjusting your search terms
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Only show scanner and modal for users who can manage inventory */}
      {canManageInventory && (
        <>
          <BarcodeScanner
            isOpen={showScanner}
            onScan={handleBarcodeScan}
            onClose={() => setShowScanner(false)}
          />

          <MedicineModal
            isOpen={showModal}
            medicine={editingMedicine}
            onSave={handleSaveMedicine}
            onClose={() => {
              setShowModal(false);
              setEditingMedicine(null);
            }}
          />
        </>
      )}
    </div>
  );
};

export default MedicineList;