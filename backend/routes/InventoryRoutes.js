const express = require('express');
const router = express.Router();
const {
  getInventoryStats,
  getLowStockItems,
  getRecentActivity,
  getCategoryStats
} = require('../controllers/InventoryController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All inventory routes require auth, hospital scope, and inventory module
router.use(authMiddleware, requireHospitalScope, requireModule('inventory'));
// Inventory statistics endpoint
router.get('/stats', getInventoryStats);

// Low stock items endpoint - KEEP as /alerts to match frontend
router.get('/alerts', getLowStockItems);

// Recent activity endpoint
router.get('/activity', getRecentActivity);

// Category statistics endpoint
router.get('/categories', getCategoryStats);

module.exports = router;