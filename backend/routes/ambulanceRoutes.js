const express = require('express');
const router = express.Router();
const ambulanceController = require('../controllers/ambulanceController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All ambulance routes require auth, hospital scope, and ambulance module
router.use(authMiddleware, requireHospitalScope, requireModule('ambulance'));

// Ambulance Management
router.get('/', authMiddleware, ambulanceController.getAmbulances);
router.get('/available', authMiddleware, ambulanceController.getAvailableAmbulances);
router.post('/', authMiddleware, roleMiddleware(['admin']), ambulanceController.createAmbulance);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), ambulanceController.updateAmbulance);
router.patch('/:id/status', authMiddleware, roleMiddleware(['admin']), ambulanceController.updateAmbulanceStatus);

// Ambulance Requests
router.get('/requests', authMiddleware, ambulanceController.getAmbulanceRequests);
router.get('/requests/pending', authMiddleware, ambulanceController.getPendingRequests);
router.get('/requests/:id', authMiddleware, ambulanceController.getRequestById);
router.post('/requests', authMiddleware, ambulanceController.createAmbulanceRequest);
router.post('/requests/incoming', authMiddleware, roleMiddleware(['receptionist']), ambulanceController.createIncomingRequest);
router.post('/requests/:id/approve', authMiddleware, roleMiddleware(['doctor']), ambulanceController.approveRequest);
router.post('/requests/:id/print', authMiddleware, roleMiddleware(['receptionist']), ambulanceController.markAsPrinted);
router.post('/requests/:id/assign', authMiddleware, roleMiddleware(['admin']), ambulanceController.assignAmbulance);
router.patch('/requests/:id/status', authMiddleware, ambulanceController.updateRequestStatus);

module.exports = router;