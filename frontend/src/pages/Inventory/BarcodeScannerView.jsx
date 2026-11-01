import React, { useState } from 'react';
import { Scan, Package, Trash2, ShoppingCart, DollarSign, User, Phone, Check } from 'lucide-react';

const BarcodeScannerView = () => {
  const [barcode, setBarcode] = useState('');
  const [scannedItems, setScannedItems] = useState([]);
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sample medicine database (replace with actual API)
  const medicineDatabase = {
    '1234567890123': { name: 'Amoxicillin 500mg', price: 25.00, stock: 150 },
    '2345678901234': { name: 'Paracetamol 500mg', price: 5.00, stock: 200 },
    '3456789012345': { name: 'Ibuprofen 400mg', price: 15.00, stock: 220 },
    '4567890123456': { name: 'Metformin 500mg', price: 30.00, stock: 180 },
    '5678901234567': { name: 'Ciprofloxacin 500mg', price: 40.00, stock: 120 }
  };

  const handleScan = () => {
    if (!barcode.trim()) return;

    const medicine = medicineDatabase[barcode];
    
    if (medicine) {
      const existingItem = scannedItems.find(item => item.barcode === barcode);
      
      if (existingItem) {
        setScannedItems(scannedItems.map(item =>
          item.barcode === barcode
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setScannedItems([...scannedItems, {
          barcode,
          name: medicine.name,
          price: medicine.price,
          quantity: 1,
          stock: medicine.stock
        }]);
      }
      setBarcode('');
    } else {
      alert('Medicine not found in database');
      setBarcode('');
    }
  };

  const handleQuantityChange = (barcode, newQuantity) => {
    if (newQuantity < 1) return;
    setScannedItems(scannedItems.map(item =>
      item.barcode === barcode
        ? { ...item, quantity: parseInt(newQuantity) }
        : item
    ));
  };

  const handleRemoveItem = (barcode) => {
    setScannedItems(scannedItems.filter(item => item.barcode !== barcode));
  };

  const calculateTotal = () => {
    return scannedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleDispense = async () => {
    if (scannedItems.length === 0) {
      alert('Please scan at least one medicine');
      return;
    }

    if (!patientInfo.name || !patientInfo.phone) {
      alert('Please enter patient information');
      return;
    }

    setLoading(true);

    // TODO: Replace with actual API call
    setTimeout(() => {
      console.log('Dispensing:', {
        patient: patientInfo,
        items: scannedItems,
        total: calculateTotal(),
        paymentMethod
      });
      
      setLoading(false);
      setSuccess(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setScannedItems([]);
        setPatientInfo({ name: '', phone: '' });
        setBarcode('');
        setSuccess(false);
      }, 3000);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const handlePatientInfoChange = (field, value) => {
    setPatientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Barcode Scanner</h1>
        <p className="text-slate-400">Scan and dispense medicines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Barcode Input */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Scan className="text-teal-400" size={24} />
              Scan Barcode
            </h2>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Scan className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter barcode or scan..."
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <button
                onClick={handleScan}
                disabled={!barcode.trim()}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
              >
                <Scan size={20} />
                Scan
              </button>
            </div>
          </div>

          {/* Scanned Items */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Package className="text-blue-400" size={24} />
              Scanned Items ({scannedItems.length})
            </h2>
            {scannedItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Package size={48} className="mx-auto mb-3 opacity-50" />
                <p>No items scanned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scannedItems.map((item) => (
                  <div key={item.barcode} className="bg-slate-900/60 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{item.name}</h3>
                        <p className="text-slate-400 text-sm">Stock: {item.stock}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.barcode, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-colors"
                          >
                            -
                          </button>
                          <span className="text-white font-medium min-w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.barcode, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right min-w-20">
                          <p className="text-white font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-slate-400 text-sm">${item.price} each</p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.barcode)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Information */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <User className="text-purple-400" size={24} />
              Patient Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={patientInfo.name}
                  onChange={(e) => handlePatientInfoChange('name', e.target.value)}
                  placeholder="Patient name"
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="tel"
                  value={patientInfo.phone}
                  onChange={(e) => handlePatientInfoChange('phone', e.target.value)}
                  placeholder="Phone number"
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="text-green-400" size={24} />
              Order Summary
            </h2>
            <div className="space-y-3 mb-4">
              {scannedItems.map((item) => (
                <div key={item.barcode} className="flex justify-between text-sm">
                  <span className="text-slate-300 truncate flex-1 mr-2">{item.name}</span>
                  <span className="text-white font-medium whitespace-nowrap">
                    {item.quantity} × ${item.price}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-600 pt-4">
              <div className="flex justify-between items-center text-lg font-bold text-white">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="text-yellow-400" size={24} />
              Payment Method
            </h2>
            <div className="space-y-3">
              {['cash', 'card', 'insurance'].map((method) => (
                <label key={method} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-white capitalize">{method}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dispense Button */}
          <button
            onClick={handleDispense}
            disabled={scannedItems.length === 0 || loading || success}
            className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : success ? (
              <>
                <Check size={20} />
                Success!
              </>
            ) : (
              <>
                <Package size={20} />
                Dispense Medicines
              </>
            )}
          </button>

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-green-400 text-center">
              <Check size={32} className="mx-auto mb-2" />
              <p className="font-semibold">Medicines dispensed successfully!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerView;