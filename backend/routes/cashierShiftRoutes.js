const express = require('express');
const router = express.Router();
const cashierShiftController = require('../controllers/cashierShiftController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All routes require authentication, hospital scope, and billing module
router.use(authMiddleware, requireHospitalScope, requireModule('billing'));

// ==================== CASHIER OPERATIONS ====================

// Open a new shift (receptionist, pharmacy, admin)
router.post('/shift/open',
    roleMiddleware(['receptionist', 'pharmacy', 'admin']),
    cashierShiftController.openShift
);

// Get current open shift
router.get('/shift/current',
    roleMiddleware(['receptionist', 'pharmacy', 'admin']),
    cashierShiftController.getCurrentShift
);

// Close current shift
router.post('/shift/close',
    roleMiddleware(['receptionist', 'pharmacy', 'admin']),
    cashierShiftController.closeShift
);

// Record a transaction
router.post('/transaction',
    roleMiddleware(['receptionist', 'pharmacy', 'admin']),
    cashierShiftController.recordTransaction
);

// Add float (cash in/out)
router.post('/float',
    roleMiddleware(['receptionist', 'pharmacy', 'admin']),
    cashierShiftController.addFloat
);

// Get transactions for a shift
router.get('/shift/:shiftId/transactions',
    roleMiddleware(['receptionist', 'pharmacy', 'admin', 'supervisor']),
    cashierShiftController.getShiftTransactions
);

// ==================== ADMIN/SUPERVISOR OPERATIONS ====================

// Get all shifts (with filters)
router.get('/shifts',
    roleMiddleware(['admin', 'supervisor']),
    cashierShiftController.getAllShifts
);

// Verify a closed shift
router.put('/shift/:shiftId/verify',
    roleMiddleware(['admin', 'supervisor']),
    cashierShiftController.verifyShift
);

// Get shift report summary
router.get('/report',
    roleMiddleware(['admin', 'supervisor']),
    cashierShiftController.getShiftReport
);

module.exports = router;
