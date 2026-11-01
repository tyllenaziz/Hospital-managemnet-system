const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const {authMiddleware} = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Apply authentication middleware to all admin routes
router.use(authMiddleware);

// Apply admin role middleware to all routes
router.use(roleMiddleware(['admin', 'supervisor']));

// Staff management routes
router.post('/staff/add', userController.register);
router.get('/staff/list', userController.listUsers);
router.put('/staff/update/:id', userController.updateUser);
router.delete('/staff/delete/:id', userController.deleteUser);

// Dashboard statistics
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/revenue/stats', adminController.getRevenueStats);
router.get('/patients/stats', adminController.getPatientStats);
router.get('/department/stats', adminController.getDepartmentStats);
router.get('/inventory/stats', adminController.getInventoryStats);

module.exports = router;