import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Plus, 
  DollarSign,
  ShoppingCart,
  User,
  RefreshCw,
  X,
  AlertTriangle
} from 'lucide-react';

const DirectSalesList = () => {
  const { authenticatedFetch, user, API_BASE_URL } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await authenticatedFetch(`${API_BASE_URL}/sales/all`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales');
      }
      
      const salesData = await response.json();
      setSales(salesData);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleById = async (id) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/sales/${id}`);
      const data = await response.json();
      setSelectedSale(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching sale details:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);

  // Filter sales based on search and date filters
  const getFilteredSales = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      
      // Date filter
      let dateMatch = true;
      switch(dateFilter) {
        case 'today':
          dateMatch = saleDate >= today;
          break;
        case 'week':
          dateMatch = saleDate >= weekAgo;
          break;
        case 'month':
          dateMatch = saleDate >= monthAgo;
          break;
        default:
          dateMatch = true;
      }

      // Search filter
      const searchMatch = searchTerm === '' || 
        (sale.invoice_number || `SALE-${String(sale.id).padStart(4, '0')}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customer_name || 'Walk-in Customer').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.sold_by_name || '').toLowerCase().includes(searchTerm.toLowerCase());

      return dateMatch && searchMatch;
    });
  };

  const filteredSales = getFilteredSales();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Direct Sales</h1>
            <p className="text-gray-600">Manage and view all direct sales transactions</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Direct Sales</h1>
          <p className="text-gray-600">Manage and view all direct sales transactions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSales}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          
          {user.role === 'pharmacist' && (
                <button
                    onClick={() => window.location.href = '/pharmacy/new-sale'}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    New Sale
                </button>
        )}

        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-red-800 font-semibold">Error</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-800">{sales.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Sales
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by invoice, customer, or staff..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Sold By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm font-medium text-gray-900">No sales found</p>
                    <p className="text-sm text-gray-500">
                      {searchTerm || dateFilter !== 'all' 
                        ? 'Try adjusting your search or filters' 
                        : 'No sales have been recorded yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sale.invoice_number || `SALE-${String(sale.id).padStart(4, '0')}`}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {sale.customer_name || 'Walk-in Customer'}
                      </div>
                      {sale.customer_phone && (
                        <div className="text-xs text-gray-500">{sale.customer_phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {sale.item_count || 0} items
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(sale.total_amount || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {sale.payment_method || 'Cash'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-900">{sale.sold_by_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(sale.sale_date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(sale.sale_date).toLocaleTimeString('en-KE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => fetchSaleById(sale.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Details Modal */}
      {showModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Sale Details - {selectedSale.invoice_number || `#${selectedSale.id}`}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Sale Date</p>
                  <p className="font-semibold">{formatDateTime(selectedSale.sale_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-semibold">{selectedSale.customer_name || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sold By</p>
                  <p className="font-semibold">{selectedSale.sold_by_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold capitalize">{selectedSale.payment_method || 'Cash'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-semibold text-lg">{formatCurrency(selectedSale.total_amount || 0)}</p>
                </div>
              </div>

              {showModal && selectedSale && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="bg-teal-600 px-6 py-4">
                        <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                            Sale Receipt - {selectedSale.invoice_number || `#${selectedSale.id}`}
                            </h2>
                            <p className="text-teal-100 text-sm mt-1">
                            {formatDateTime(selectedSale.sale_date)}
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowModal(false)} 
                            className="text-white hover:text-teal-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-10"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                        {/* Customer & Payment Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer Info */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Customer Information
                            </h3>
                            <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-medium">{selectedSale.customer_name || 'Walk-in Customer'}</span>
                            </div>
                            {selectedSale.customer_phone && (
                                <div className="flex justify-between">
                                <span className="text-gray-600">Phone:</span>
                                <span className="font-medium">{selectedSale.customer_phone}</span>
                                </div>
                            )}
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Payment Information
                            </h3>
                            <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Method:</span>
                                <span className="font-medium capitalize bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-xs">
                                {selectedSale.payment_method || 'Cash'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Sold By:</span>
                                <span className="font-medium">{selectedSale.sold_by_name || 'N/A'}</span>
                            </div>
                            </div>
                        </div>
                        </div>

                        {/* Items Table */}
                        {selectedSale.items && selectedSale.items.length > 0 && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <h3 className="font-semibold text-gray-800 p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Items ({selectedSale.items.length})
                            </h3>
                            
                            <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Price</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subtotal</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {selectedSale.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">
                                        {item.medicine_name || item.inventory_medicine_name}
                                        </div>
                                        {item.is_custom && (
                                        <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full mt-1">
                                            Custom Item
                                        </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                                        {item.quantity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {formatCurrency(parseFloat(item.unit_price) || parseFloat(item.total) / item.quantity)}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-gray-900">
                                        {formatCurrency(parseFloat(item.total))}
                                    </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            </div>
                        </div>
                        )}

                        {/* Total Amount */}
                        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <div>
                            <h3 className="font-semibold text-gray-700">Total Amount</h3>
                            <p className="text-sm text-gray-600">Including all items</p>
                            </div>
                            <div className="text-right">
                            <p className="text-2xl font-bold text-teal-700">
                                {formatCurrency(selectedSale.total_amount || 0)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                {selectedSale.items?.length || 0} items
                            </p>
                            </div>
                        </div>
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

export default DirectSalesList;