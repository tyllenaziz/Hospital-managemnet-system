import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, Save, Search, Scan, Keyboard, Edit2 } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { useSymbologyScanner } from '@use-symbology-scanner/react';

const DirectSale = () => {
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const scannerRef = useRef(null);
  
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [scannerActive, setScannerActive] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState('');
  
  // Custom medicine modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customMedicine, setCustomMedicine] = useState({
    name: '',
    quantity: 1,
    total_price: 0
  });

  const handleSymbol = async (symbol, matchedSymbologies) => {
    if (symbol === lastScannedBarcode) return;
    setLastScannedBarcode(symbol);
    setScannerActive(true);
    
    await handleBarcodeSearch(symbol);
    
    setTimeout(() => {
      setLastScannedBarcode('');
      setScannerActive(false);
    }, 1000);
  };

  useSymbologyScanner(handleSymbol, { 
    target: scannerRef,
    enabled: scannerEnabled 
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/medicines`);
      const data = await response.json();
      setMedicines(data.medicines || data || []);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  const handleBarcodeSearch = async (barcode) => {
    if (!barcode?.trim()) return;

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/medicines/barcode/${barcode}`);
      const data = await response.json();
      
      if (data.exists && data.medicine) {
        addToCart(data.medicine);
        setManualBarcodeInput('');
        showNotification(`${data.medicine.name} added to cart`, 'success');
      } else {
        showNotification('Medicine not found', 'error');
      }
    } catch (err) {
      console.error('Error finding medicine:', err);
      showNotification('Error finding medicine', 'error');
    }
  };

  const handleManualBarcodeSubmit = () => {
    if (manualBarcodeInput.trim()) {
      handleBarcodeSearch(manualBarcodeInput);
    }
  };

  const showNotification = (message, type) => {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('animate-fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  };

  const addToCart = (medicine, isCustom = false) => {
    if (!isCustom && medicine.stock <= 0) {
      showNotification('Medicine out of stock', 'error');
      return;
    }

    const existing = cart.find(item => 
      isCustom ? item.is_custom && item.name === medicine.name : item.id === medicine.id
    );
    
    if (existing) {
      if (!isCustom && existing.quantity >= medicine.stock) {
        showNotification('Maximum stock reached', 'error');
        return;
      }
      setCart(cart.map(item =>
        (isCustom ? (item.is_custom && item.name === medicine.name) : item.id === medicine.id)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem = isCustom 
        ? { 
            id: `custom-${Date.now()}`, 
            name: medicine.name, 
            quantity: medicine.quantity,
            total_price: medicine.total_price,
            is_custom: true,
            stock: 9999
          }
        : { ...medicine, quantity: 1, is_custom: false };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (item, newQuantity) => {
    const medicine = medicines.find(m => m.id === item.id);
    if (newQuantity <= 0) {
      removeFromCart(item);
      return;
    }
    
    setCart(cart.map(cartItem =>
      cartItem.id === item.id
        ? { ...cartItem, quantity: item.is_custom ? newQuantity : Math.min(newQuantity, medicine.stock) }
        : cartItem
    ));
  };

  const updatePrice = (item, newPrice) => {
    const price = parseFloat(newPrice) || 0;
    setCart(cart.map(cartItem =>
      cartItem.id === item.id
        ? { ...cartItem, total_price: price }
        : cartItem
    ));
  };

  const removeFromCart = (item) => {
    setCart(cart.filter(cartItem => cartItem.id !== item.id));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      if (item.is_custom) {
        // For custom items, total_price is already the total
        return sum + (item.total_price || 0);
      } else {
        // For inventory items, calculate from unit price
        return sum + (item.price * item.quantity);
      }
    }, 0);
  };

  const handleAddCustomMedicine = () => {
    if (!customMedicine.name.trim()) {
      showNotification('Please enter medicine name', 'error');
      return;
    }
    if (customMedicine.total_price <= 0) {
      showNotification('Please enter valid total price', 'error');
      return;
    }
    if (customMedicine.quantity <= 0) {
      showNotification('Please enter valid quantity', 'error');
      return;
    }

    addToCart(customMedicine, true);
    setCustomMedicine({ name: '', quantity: 1, total_price: 0 });
    setShowCustomModal(false);
    showNotification('Custom medicine added to cart', 'success');
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      showNotification('Please add items to cart', 'error');
      return;
    }

    setSaving(true);

    try {
      const saleData = {
        items: cart.map(item => ({
          medicine_id: item.is_custom ? null : item.id,
          medicine_name: item.name,
          quantity: item.quantity,
          total_price: item.is_custom ? item.total_price : (item.price * item.quantity),
          is_custom: item.is_custom
        })),
        total_amount: calculateTotal(),
        payment_method: paymentMethod
      };

      const response = await authenticatedFetch(`${API_BASE_URL}/sales/direct`, {
        method: 'POST',
        body: JSON.stringify(saleData)
      });

      const result = await response.json();

      if (result.success) {
        showNotification('Sale completed successfully!', 'success');
        navigate(`/pharmacy/receipt/sale/${result.sale_id}`);
        setPaymentMethod('cash');
        await fetchMedicines();
      }
    } catch (err) {
      console.error('Error completing sale:', err);
      showNotification('Failed to complete sale', 'error');
    } finally {
      setSaving(false);
    }
  };

  

  const filteredMedicines = medicines.filter(med =>
    med.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.barcode?.includes(searchTerm)
  );

  return (
    <div ref={scannerRef} className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <button
          onClick={() => navigate('/pharmacy/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-teal-700 transition font-medium text-sm"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Direct Sale</h1>
              <p className="text-sm text-gray-600">Quick sale for walk-in customers</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCustomModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
              >
                <Plus size={16} />
                Custom Medicine
              </button>
              <button
                onClick={() => setScannerEnabled(!scannerEnabled)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  scannerEnabled 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                <Scan size={16} />
                Scanner {scannerEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Medicine Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barcode Input Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-800">Barcode Input</h2>
                {scannerActive && scannerEnabled && (
                  <span className="flex items-center gap-2 text-xs text-green-600 font-medium">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    Scanner Active
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Keyboard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={manualBarcodeInput}
                    onChange={(e) => setManualBarcodeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualBarcodeSubmit()}
                    placeholder="Enter barcode manually..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <button
                  onClick={handleManualBarcodeSubmit}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>

              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>How to use:</strong>
                </p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Scan barcode with your scanner (when Scanner is ON)</li>
                  <li>• Or manually enter barcode above and press Enter or click Add</li>
                  <li>• Click "Custom Medicine" to add medicines not in inventory</li>
                </ul>
              </div>
            </div>

            {/* Medicine Search */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Search Medicines</h2>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredMedicines.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-sm">No medicines found</p>
                ) : (
                  filteredMedicines.map((medicine) => (
                    <div
                      key={medicine.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 text-sm">{medicine.name}</h3>
                        <div className="flex gap-3 mt-1">
                          <p className={`text-xs font-medium ${medicine.stock < 10 ? 'text-red-600' : 'text-gray-600'}`}>
                            Stock: {medicine.stock}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">{medicine.barcode}</p>
                        </div>
                        <p className="text-sm font-semibold text-teal-600 mt-1">KES {medicine.price}</p>
                      </div>
                      <button
                        onClick={() => addToCart(medicine)}
                        disabled={medicine.stock === 0}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs rounded-lg transition flex items-center gap-1"
                      >
                        <Plus size={14} />
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 h-fit sticky top-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <ShoppingCart size={20} />
              Cart ({cart.length})
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto text-gray-300 mb-2" size={48} />
                <p className="text-gray-500 text-sm">Cart is empty</p>
                <p className="text-gray-400 text-xs mt-1">Scan or add items to start</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800 text-sm flex-1">
                        {item.name}
                        {item.is_custom && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Custom</span>
                        )}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item)}
                        className="text-red-600 hover:text-red-700 transition"
                        title="Remove from cart"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    {/* Editable total price for custom items, quantity for all */}
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Quantity {item.is_custom && <span className="text-gray-500">(e.g., 10 tablets)</span>}:
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              updateQuantity(item, 1);
                            } else {
                              updateQuantity(item, parseInt(val) || 1);
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          {item.is_custom ? 'Total Price (KES):' : 'Price per unit (KES):'}
                        </label>
                        <input
                          type="number"
                          value={item.is_custom ? (item.total_price || '') : (item.price || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              updatePrice(item, 0);
                            } else {
                              updatePrice(item, val);
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          min="0"
                          step="0.01"
                          disabled={!item.is_custom}
                          placeholder="0.00"
                        />
                        {item.is_custom && (
                          <p className="text-xs text-gray-500 mt-1">
                            Total for {item.quantity} units
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-blue-300">
                      <span className="text-xs text-gray-600">Item Total:</span>
                      <span className="text-sm font-bold text-teal-600">
                        KES {(item.is_custom ? (item.total_price || 0) : (item.price * item.quantity)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Method & Total */}
            {cart.length > 0 && (
              <>
                <div className="border-t border-gray-200 mt-4 pt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="card">Card</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center py-2 border-t border-gray-300">
                    <span className="text-lg font-semibold text-gray-800">Total:</span>
                    <span className="text-2xl font-bold text-teal-600">
                      KES {calculateTotal().toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handleCompleteSale}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Complete Sale</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

                {/* Custom Medicine Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Add Custom Medicine</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                  <input
                    type="text"
                    value={customMedicine.name}
                    onChange={(e) => setCustomMedicine({ ...customMedicine, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="e.g., Panadol (2 tablets)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={customMedicine.quantity}
                    onChange={(e) => setCustomMedicine({ ...customMedicine, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Price (KES)</label>
                  <input
                    type="number"
                    value={customMedicine.total_price}
                    onChange={(e) => setCustomMedicine({ ...customMedicine, total_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total price for {customMedicine.quantity} units
                  </p>
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Example:</strong> Selling 10 Panadol tablets for 10 KES total
                  </p>
                  <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                    <li>• Quantity: 10</li>
                    <li>• Total Price: 10 KES (not per tablet)</li>
                  </ul>
                </div>

                <input
                  type="number"
                  value={customMedicine.unit_price}
                  onChange={(e) => setCustomMedicine({ ...customMedicine, unit_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Use this for medicines not in inventory or when selling partial quantities (e.g., 2 tablets from a strip).
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCustomModal(false);
                    setCustomMedicine({ name: '', quantity: 1, unit_price: 0 });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomMedicine}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectSale;