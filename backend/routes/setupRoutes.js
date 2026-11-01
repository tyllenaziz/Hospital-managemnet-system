const express = require('express');
const router = express.Router();
const setupController = require('../controllers/setupController');

// Public routes (for initial setup)
router.get('/status', setupController.checkSetupStatus);

// Protected routes (require authentication for changes)
router.get('/hospital', setupController.getHospitalConfig);
router.put('/hospital', setupController.updateHospitalConfig);
router.post('/hospital/logo', setupController.uploadLogo);

// Module management
router.get('/modules', setupController.getModules);
router.put('/modules', setupController.updateModules);
router.put('/modules/:moduleCode/toggle', setupController.toggleModule);
router.get('/modules/enabled', setupController.getEnabledModules);

// Complete setup
router.post('/complete', setupController.completeSetup);

module.exports = router;
