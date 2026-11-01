const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All referral routes require auth, hospital scope, and referrals module
router.use(authMiddleware, requireHospitalScope, requireModule('referrals'));

// Create a new referral (Doctor only)
router.post('/', authMiddleware, roleMiddleware(['doctor']), referralController.create);

// Get all referrals (Admin sees all, Doctor sees only their own)
router.get('/', authMiddleware, roleMiddleware(['doctor', 'admin']), referralController.getAll);

// Get referral statistics
router.get('/statistics', authMiddleware, roleMiddleware(['doctor', 'admin']), referralController.getStatistics);

// Get referrals by patient ID
router.get('/patient/:patientId', authMiddleware, roleMiddleware(['doctor', 'admin', 'nurse']), referralController.getByPatientId);

// Get referral by ID
router.get('/:id', authMiddleware, roleMiddleware(['doctor', 'admin', 'nurse']), referralController.getById);

// Update referral status
router.patch('/:id/status', authMiddleware, roleMiddleware(['doctor', 'admin']), referralController.updateStatus);

// Update referral details
router.put('/:id', authMiddleware, roleMiddleware(['doctor']), referralController.update);

// Delete referral
router.delete('/:id', authMiddleware, roleMiddleware(['doctor', 'admin']), referralController.delete);

module.exports = router;