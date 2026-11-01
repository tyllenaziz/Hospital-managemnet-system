const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

// Default-deny: all sync endpoints require authenticated admin/superadmin access
router.use(verifyToken, requireAdmin);

// Sync status and monitoring
router.get('/status', syncController.getSyncStatus);
router.get('/queue', syncController.getPendingItems);
router.get('/stats', syncController.getQueueStats);
router.get('/metadata', syncController.getSyncMetadata);
router.get('/online', syncController.checkOnline);

// Sync operations
router.post('/trigger', syncController.triggerSync);
router.post('/retry', syncController.retryFailed);
router.post('/cleanup', syncController.cleanupOld);

// Conflict management
router.get('/conflicts', syncController.getConflicts);
router.post('/conflicts/:conflictId/resolve', syncController.resolveConflict);

module.exports = router;
