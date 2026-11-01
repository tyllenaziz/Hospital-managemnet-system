import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Pill, AlertTriangle, Plus, 
  RefreshCw, DollarSign, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { useAuth, API_ENDPOINTS } from '../../context/AuthContext';

const InventoryDashboard = () => {
  const { authenticatedFetch, user } = useAuth();
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    categories: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canManageInventory = user?.role === 'admin' || user?.role === 'pharmacy';

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== 🚀 STARTING INVENTORY DATA FETCH ===');

      // Fetch ALL data in parallel for better performance
      const [statsData, alertsData, categoriesData, activityData] = await Promise.allSettled([
        // 1. Fetch inventory stats
        fetchWithFallback(API_ENDPOINTS.INVENTORY.INVENTORY_STATS, 'stats', {
          totalItems: 0,
          lowStock: 0,
          outOfStock: 0,
          totalValue: 0,
          categories: 0
        }),

        // 2. Fetch low stock alerts
        fetchWithFallback(API_ENDPOINTS.INVENTORY.INVENTORY_ALERTS, 'alerts', {
          alerts: [],
          count: 0
        }),

        // 3. Fetch category stats
        fetchWithFallback(API_ENDPOINTS.INVENTORY.INVENTORY_CATEGORIES, 'categories', {
          categories: [
            { name: 'Medicines', count: 0, color: 'blue', link: '/admin/inventory/medicines' },
            { name: 'Equipment', count: 0, color: 'purple', link: '/admin/inventory/equipment' }
          ]
        }),

        // 4. Fetch recent activity from inventory endpoint
        fetchWithFallback(API_ENDPOINTS.INVENTORY.INVENTORY_ACTIVITY, 'activity', {
          activities: []
        })
      ]);

      // Process stats data
      if (statsData.status === 'fulfilled') {
        console.log('📊 Stats loaded:', statsData.value);
        setStats(statsData.value);
      }

      // Process alerts data
      if (alertsData.status === 'fulfilled') {
        console.log('🚨 Alerts loaded:', alertsData.value.alerts?.length || 0);
        setLowStockItems(alertsData.value.alerts || []);
      }

      // Process categories data
      if (categoriesData.status === 'fulfilled') {
        console.log('📂 Categories loaded:', categoriesData.value.categories);
        setCategoryStats(categoriesData.value.categories || []);
      }

      // Process activity data
      if (activityData.status === 'fulfilled') {
        console.log('🕒 Activity loaded:', activityData.value.activities?.length || 0);
        setRecentActivity(activityData.value.activities || []);
      }

      console.log('=== ✅ INVENTORY DATA FETCH COMPLETE ===');

    } catch (error) {
      console.error('❌ CRITICAL ERROR in fetchInventoryData:', error);
      setError('Failed to load inventory data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fetch data with fallback
  const fetchWithFallback = async (endpoint, dataType, fallback) => {
    try {
      console.log(`📡 Fetching ${dataType} from:`, endpoint);
      const response = await authenticatedFetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${dataType} fetch successful`);
        return data;
      } else {
        throw new Error(data.error || `API returned success: false for ${dataType}`);
      }
    } catch (error) {
      console.warn(`⚠️ ${dataType} fetch failed, using fallback:`, error.message);
      
      // For stats, try to calculate from individual APIs
      if (dataType === 'stats') {
        return await calculateStatsFromIndividualAPIs();
      }
      
      return fallback;
    }
  };

  // Fallback function to calculate stats from individual medicine/equipment APIs
  const calculateStatsFromIndividualAPIs = async () => {
    try {
      console.log('🔄 Calculating stats from individual APIs...');
      
      const [medicinesResponse, equipmentResponse] = await Promise.allSettled([
        authenticatedFetch(API_ENDPOINTS.INVENTORY.MEDICINES),
        authenticatedFetch(API_ENDPOINTS.INVENTORY.EQUIPMENT)
      ]);

      let totalMedicines = 0;
      let totalEquipment = 0;
      let lowStock = 0;
      let outOfStock = 0;
      let medicinesValue = 0;
      let equipmentValue = 0;

      // Process medicines
      if (medicinesResponse.status === 'fulfilled') {
        const medicinesData = await medicinesResponse.value.json();
        if (medicinesData.success && medicinesData.medicines) {
          totalMedicines = medicinesData.medicines.length;
          medicinesData.medicines.forEach(med => {
            const stock = med.stock || 0;
            const price = med.price || 0;
            
            if (stock === 0) outOfStock++;
            else if (stock < 20) lowStock++;
            
            medicinesValue += stock * price;
          });
        }
      }

      // Process equipment
      if (equipmentResponse.status === 'fulfilled') {
        const equipmentData = await equipmentResponse.value.json();
        if (equipmentData.success && equipmentData.equipment) {
          totalEquipment = equipmentData.equipment.length;
          equipmentData.equipment.forEach(eq => {
            const quantity = eq.quantity || 0;
            const price = eq.purchase_price || 0;
            equipmentValue += quantity * price;
          });
        }
      }

      const totalItems = totalMedicines + totalEquipment;
      const totalValue = medicinesValue + equipmentValue;

      return {
        success: true,
        totalItems,
        totalMedicines,
        totalEquipment,
        lowStock,
        outOfStock,
        totalValue: Math.round(totalValue * 100) / 100,
        medicinesTotalValue: Math.round(medicinesValue * 100) / 100,
        equipmentTotalValue: Math.round(equipmentValue * 100) / 100,
        categories: 2
      };
    } catch (error) {
      console.error('Error calculating stats from individual APIs:', error);
      return {
        success: true,
        totalItems: 0,
        totalMedicines: 0,
        totalEquipment: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0,
        medicinesTotalValue: 0,
        equipmentTotalValue: 0,
        categories: 0
      };
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, subtitle, children }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-xs font-medium mb-1 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
          {children}
        </div>
        <div className={`p-3 rounded-lg ${color} ml-3`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, title, description, link, color }) => (
    <Link to={link} className="block">
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all group cursor-pointer">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${color} group-hover:scale-105 transition-transform`}>
            <Icon size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 font-semibold text-sm mb-1">{title}</h3>
            <p className="text-gray-600 text-xs leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );

  const getStatusBadge = (status) => {
    const config = {
      low: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Low Stock' },
      critical: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Critical' },
      out_of_stock: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Out of Stock' },
      normal: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Normal' }
    };
    const { color, icon: Icon, label } = config[status] || config.normal;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon size={12} />
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="animate-spin text-blue-600 mx-auto mb-3" size={32} />
          <p className="text-gray-600 text-sm">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="text-red-600 mx-auto mb-3" size={32} />
          <p className="text-gray-900 font-medium mb-2">Error Loading Data</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchInventoryData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Inventory Dashboard</h1>
          <p className="text-gray-600 text-sm">Real-time inventory monitoring and management</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchInventoryData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          title="Total Items"
          value={stats.totalItems?.toLocaleString() || '0'}
          color="bg-blue-600"
          subtitle={`${stats.totalMedicines || 0} meds, ${stats.totalEquipment || 0} equip`}
        />
        <StatCard
          icon={AlertTriangle}
          title="Low Stock"
          value={stats.lowStock || '0'}
          color="bg-amber-600"
          subtitle="Need restocking"
        />
        <StatCard
          icon={XCircle}
          title="Out of Stock"
          value={stats.outOfStock || '0'}
          color="bg-red-600"
          subtitle="Urgent attention"
        />
        <StatCard
          icon={DollarSign}
          title="Total Value"
          value={`KES ${(stats.totalValue || 0).toLocaleString()}`}
          color="bg-green-600"
        >
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Medicines:</span>
              <span className="text-gray-900 font-medium">
                KES {(stats.medicinesTotalValue || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Equipment:</span>
              <span className="text-gray-900 font-medium">
                KES {(stats.equipmentTotalValue || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
              <span className="text-gray-800 font-semibold">Total:</span>
              <span className="text-gray-900 font-bold">
                KES {(stats.totalValue || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </StatCard>
      </div>

      {/* Quick Actions - Only show for admins/pharmacy */}
      {canManageInventory && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickAction
              icon={Plus}
              title="Add Medicine"
              description="Add new medicine to inventory"
              link="/admin/inventory/add-medicine"
              color="bg-green-500"
            />
            <QuickAction
              icon={Package}
              title="Manage Equipment"
              description="View and manage equipment"
              link="/admin/inventory/equipment"
              color="bg-blue-500"
            />
            <QuickAction
              icon={AlertTriangle}
              title="Low Stock Alerts"
              description="View items requiring restocking"
              link="/admin/inventory/medicines?filter=low-stock"
              color="bg-amber-500"
            />
          </div>
        </div>
      )}

      {/* Low Stock Alerts and Recent Activity - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Low Stock Alerts</h2>
          </div>
          <div className="p-4">
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>Stock: {item.currentStock}</span>
                        <span>Min: {item.minStock}</span>
                        {item.type && <span className="capitalize">{item.type}</span>}
                      </div>
                    </div>
                    <Link to={item.type === 'equipment' ? '/admin/inventory/equipment' : '/admin/inventory/medicines'}>
                      <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors">
                        View
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                <p className="text-gray-600 text-sm font-medium">All items well stocked</p>
                <p className="text-gray-400 text-xs mt-1">No low stock alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-4">
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`p-2 rounded ${
                      activity.type === 'stock_in' ? 'bg-green-100' :
                      activity.type === 'alert' ? 'bg-yellow-100' :
                      activity.type === 'update' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      <Package size={14} className={
                        activity.type === 'stock_in' ? 'text-green-600' :
                        activity.type === 'alert' ? 'text-yellow-600' :
                        activity.type === 'update' ? 'text-blue-600' :
                        'text-gray-600'
                      } />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium text-sm truncate">{activity.action}</p>
                      <p className="text-gray-500 text-xs truncate">
                        {activity.item} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Package className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600 text-sm font-medium">No recent activity</p>
                <p className="text-gray-400 text-xs mt-1">Activity will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Overview */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Inventory Categories</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoryStats.map((category, index) => {
              const gradients = [
                'from-blue-500 to-blue-600',
                'from-green-500 to-green-600', 
                'from-purple-500 to-purple-600',
                'from-orange-500 to-orange-600'
              ];
              
              const gradient = gradients[index] || 'from-gray-500 to-gray-600';
              
              return (
                <Link key={category.name} to={category.link || '#'}>
                  <div className={`bg-gradient-to-br ${gradient} text-white rounded-lg p-4 text-center hover:shadow-md transition-all cursor-pointer`}>
                    <Package size={20} className="mx-auto mb-2" />
                    <h3 className="font-bold text-sm">{category.name}</h3>
                    <p className="text-white/80 text-xs">{category.count} items</p>
                    {category.value && (
                      <p className="text-white/90 text-xs font-medium mt-1">
                        KES {category.value.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;