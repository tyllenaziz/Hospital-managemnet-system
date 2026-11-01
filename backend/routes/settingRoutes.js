const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/SettingsController');
const {authMiddleware} = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Get settings
router.get('/', authMiddleware, settingsController.getSettings);

// Update settings (admin only)
router.put('/', authMiddleware, roleMiddleware(["admin"]), settingsController.updateSettings);

module.exports = router;