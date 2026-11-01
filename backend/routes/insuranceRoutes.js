const express = require('express');
const router = express.Router();
const insuranceController = require('../controllers/insuranceController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All routes require authentication, hospital scope, and insurance module
router.use(authMiddleware, requireHospitalScope, requireModule('insurance'));

// ==================== INSURANCE PROVIDERS ====================

// Get all insurance providers (public to authenticated users)
router.get('/providers', insuranceController.getProviders);

// ==================== PATIENT INSURANCE ====================

// Add insurance to patient
router.post('/patient',
    roleMiddleware(['admin', 'supervisor', 'receptionist']),
    insuranceController.addPatientInsurance
);

// Get patient's insurance
router.get('/patient/:patientId', insuranceController.getPatientInsurance);

// Verify eligibility
router.post('/verify',
    roleMiddleware(['admin', 'supervisor', 'receptionist', 'pharmacy']),
    insuranceController.verifyEligibility
);

// ==================== CLAIMS ====================

// Get claims list (with filters)
router.get('/claims',
    roleMiddleware(['admin', 'supervisor']),
    insuranceController.getClaims
);

// Create new claim
router.post('/claims',
    roleMiddleware(['admin', 'supervisor', 'receptionist']),
    insuranceController.createClaim
);

// Get claim details
router.get('/claims/:claimId',
    roleMiddleware(['admin', 'supervisor', 'receptionist']),
    insuranceController.getClaimById
);

// Submit claim to insurer
router.post('/claims/:claimId/submit',
    roleMiddleware(['admin', 'supervisor']),
    insuranceController.submitClaim
);

// Update claim status
router.put('/claims/:claimId/status',
    roleMiddleware(['admin', 'supervisor']),
    insuranceController.updateClaimStatus
);

// ==================== PRE-AUTHORIZATION ====================

// Get pre-authorizations list
router.get('/preauth',
    roleMiddleware(['admin', 'supervisor', 'doctor']),
    insuranceController.getPreAuths
);

// Create pre-authorization request
router.post('/preauth',
    roleMiddleware(['admin', 'supervisor', 'doctor', 'receptionist']),
    insuranceController.createPreAuth
);

// Submit pre-auth to insurer
router.post('/preauth/:preauthId/submit',
    roleMiddleware(['admin', 'supervisor']),
    insuranceController.submitPreAuth
);

// ==================== DASHBOARD ====================

// Get insurance dashboard stats
router.get('/dashboard',
    roleMiddleware(['admin', 'supervisor']),
    insuranceController.getDashboardStats
);

module.exports = router;
