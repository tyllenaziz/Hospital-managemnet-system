const db = require('../config/dbconfig.js');

// Get inventory statistics - UPDATED to include equipment
const getInventoryStats = async (req, res) => {
  try {
    // Get medicines statistics
    const [[medicineStats]] = await db.query(`
      SELECT 
        COUNT(*) as totalMedicines,
        SUM(CASE WHEN stock < 20 AND stock > 0 THEN 1 ELSE 0 END) as lowStock,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as outOfStock,
        SUM(stock * price) as medicinesValue
      FROM medicines
      WHERE hospital_id = ?
    `, [req.user.hospital_id]);

    // Get equipment statistics
    const [[equipmentStats]] = await db.query(`
      SELECT 
        COUNT(*) as totalEquipment,
        SUM(purchase_price * quantity) as equipmentValue
      FROM equipment
      WHERE hospital_id = ?
    `, [req.user.hospital_id]);

    // Calculate totals
    const totalItems = (medicineStats.totalMedicines || 0) + (equipmentStats.totalEquipment || 0);
    const lowStock = medicineStats.lowStock || 0;
    const outOfStock = medicineStats.outOfStock || 0;

    const totalValue = Number(medicineStats.medicinesValue || 0) + Number(equipmentStats.equipmentValue || 0);

    res.json({
      success: true,
      totalItems: totalItems,
      totalMedicines: Number(medicineStats.totalMedicines || 0),
      totalEquipment: Number(equipmentStats.totalEquipment || 0),
      lowStock: Number(medicineStats.lowStock || 0),
      outOfStock: Number(medicineStats.outOfStock || 0),
      totalValue: Math.round(totalValue * 100) / 100,
      medicinesTotalValue: Math.round(Number(medicineStats.medicinesValue || 0) * 100) / 100,
      equipmentTotalValue: Math.round(Number(equipmentStats.equipmentValue || 0) * 100) / 100,
      categories: 2
    });

  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get low stock items with details - UPDATED to match frontend structure
const getLowStockItems = async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT 
        id,
        name,
        stock as currentStock,
        20 as minStock,
        CASE 
          WHEN stock = 0 THEN 'out_of_stock'
          WHEN stock < 10 THEN 'critical'
          WHEN stock < 20 THEN 'low'
          ELSE 'normal'
        END as status
      FROM medicines 
      WHERE stock < 20 AND hospital_id = ?
      ORDER BY stock ASC 
      LIMIT 10
    `, [req.user.hospital_id]);

    res.json({
      success: true,
      alerts: items, // Changed from 'items' to 'alerts' to match frontend
      count: items.length
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get recent inventory activity - UPDATED to match frontend
const getRecentActivity = async (req, res) => {
  try {
    // Get recent medicine additions
    const [recentMedicines] = await db.query(`
      SELECT 
        id,
        name,
        created_at,
        'stock_in' as type
      FROM medicines 
      WHERE hospital_id = ?
      ORDER BY created_at DESC 
      LIMIT 5
    `, [req.user.hospital_id]);

    // Get recent equipment additions
    const [recentEquipment] = await db.query(`
      SELECT 
        id,
        name,
        created_at,
        'equipment_added' as type
      FROM equipment 
      WHERE hospital_id = ?
      ORDER BY created_at DESC 
      LIMIT 5
    `, [req.user.hospital_id]);

    // Combine and format activities
    const allActivities = [...recentMedicines, ...recentEquipment]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(item => ({
        id: item.id,
        action: item.type === 'stock_in' ? 'Medicine added' : 'Equipment added',
        item: item.name,
        user: 'System',
        time: getRelativeTime(item.created_at),
        type: item.type === 'stock_in' ? 'stock_in' : 'update'
      }));

    res.json({
      success: true,
      activities: allActivities
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get category statistics - UPDATED to include equipment
const getCategoryStats = async (req, res) => {
  try {
    // Count medicines
    const [[medicineCount]] = await db.query('SELECT COUNT(*) as count FROM medicines WHERE hospital_id = ?', [req.user.hospital_id]);

    // Count equipment
    const [[equipmentCount]] = await db.query('SELECT COUNT(*) as count FROM equipment WHERE hospital_id = ?', [req.user.hospital_id]);

    // Calculate values
    const [[medicineValue]] = await db.query('SELECT SUM(stock * price) as value FROM medicines WHERE hospital_id = ?', [req.user.hospital_id]);
    const [[equipmentValue]] = await db.query('SELECT SUM(purchase_price * quantity) as value FROM equipment WHERE hospital_id = ?', [req.user.hospital_id]);

    const categories = [
      {
        name: 'Medicines',
        count: medicineCount.count || 0,
        color: 'blue',
        link: '/admin/inventory/medicines',
        value: Math.round(medicineValue.value * 100) / 100 || 0
      },
      {
        name: 'Equipment',
        count: equipmentCount.count || 0,
        color: 'purple',
        link: '/admin/inventory/equipment',
        value: Math.round(equipmentValue.value * 100) / 100 || 0
      }
    ];

    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to get relative time
function getRelativeTime(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}

module.exports = {
  getInventoryStats,
  getLowStockItems,
  getRecentActivity,
  getCategoryStats
};