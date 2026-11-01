import { useState, useEffect } from 'react';
import { X, Package, AlertTriangle, Calendar, Barcode as BarcodeIcon, Hash, DollarSign, Scan } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

const MedicineModal = ({ medicine, onSave, onClose, isOpen }) => {
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    stock: 0,
    price: 0,
    expiry_date: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (medicine) {
      setFormData({
        name: medicine.name || '',
        barcode: medicine.barcode || '',
        stock: medicine.stock || 0,
        price: medicine.price || 0,
        expiry_date: medicine.expiry_date ? medicine.expiry_date.split('T')[0] : ''
      });
    } else {
      setFormData({
        name: '',
        barcode: '',
        stock: 0,
        price: 0,
        expiry_date: ''
      });
    }
    setErrors({});
  }, [medicine, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Medicine name is required';
    if (!formData.barcode.trim()) newErrors.barcode = 'Barcode is required';
    if (formData.barcode.length < 8) newErrors.barcode = 'Barcode must be at least 8 digits';
    if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.expiry_date) newErrors.expiry_date = 'Expiry date is required';
    
    if (formData.expiry_date && new Date(formData.expiry_date) < new Date()) {
      newErrors.expiry_date = 'Expiry date cannot be in the past';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving medicine:', error);
      alert(error.message || 'Failed to save medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' || name === 'price' ? parseFloat(value) || 0 : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBarcodeScan = (barcode) => {
    setFormData(prev => ({ ...prev, barcode }));
    setShowScanner(false);
    if (errors.barcode) {
      setErrors(prev => ({ ...prev, barcode: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="text-teal-600" size={20} />
                <h3 className="text-lg font-bold text-gray-900">
                  {medicine?.id ? 'Edit Medicine' : 'Add New Medicine'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Medicine Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicine Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter medicine name"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Barcode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <BarcodeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="Enter barcode"
                    className={`w-full pl-9 pr-16 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                      errors.barcode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded transition flex items-center gap-1"
                  >
                    <Scan size={12} />
                    Scan
                  </button>
                </div>
                {errors.barcode && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {errors.barcode}
                  </p>
                )}
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                      errors.stock ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  />
                </div>
                {errors.stock && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {errors.stock}
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (KES) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                      errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  />
                </div>
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {errors.price}
                  </p>
                )}
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                      errors.expiry_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  />
                </div>
                {errors.expiry_date && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {errors.expiry_date}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? 'Saving...' : (medicine?.id ? 'Update' : 'Add Medicine')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowScanner(false)}
      />
    </>
  );
};

export default MedicineModal;