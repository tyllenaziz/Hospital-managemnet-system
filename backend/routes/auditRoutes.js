const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All audit routes require authentication, hospital scope, and audit module
router.use(authMiddleware, requireHospitalScope, requireModule('audit'));

// All audit routes are admin/supervisor only
router.use(roleMiddleware(['admin', 'supervisor']));

// Get all audit logs with filters
router.get('/', auditController.getAuditLogs);

// Get audit summary/statistics
router.get('/summary', auditController.getAuditSummary);

// Export audit logs
router.get('/export', auditController.exportAuditLogs);

// Get audit logs for a specific entity
router.get('/entity/:entityType/:entityId', auditController.getAuditLogsByEntity);

module.exports = router;
