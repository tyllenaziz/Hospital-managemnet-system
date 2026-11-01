const express = require('express');
const router = express.Router();
const mpesaController = require('../controllers/mpesaController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// Initiate STK Push (requires authentication + mpesa module)
router.post('/stkpush', authMiddleware, requireHospitalScope, requireModule('mpesa'), mpesaController.initiatePayment);

// M-Pesa callback (no auth - called by Safaricom)
router.post('/callback', mpesaController.handleCallback);

// Query status (requires authentication)
router.get('/status/:checkoutRequestId', authMiddleware, requireHospitalScope, requireModule('mpesa'), mpesaController.queryStatus);

// Check payment status (for polling - requires authentication)
router.get('/check/:checkoutRequestId', authMiddleware, requireHospitalScope, requireModule('mpesa'), mpesaController.checkPaymentStatus);

module.exports = router;
