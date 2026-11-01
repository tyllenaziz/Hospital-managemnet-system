const express = require("express");
const router = express.Router();
const queueController = require("../controllers/queueController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { runCleanupNow, getQueueStats } = require('../utils/queueCleanup');

// Get queue for specific department
router.get("/:department", authMiddleware, queueController.getQueue);

// Get single queue item by ID
router.get("/item/:id", authMiddleware, queueController.getById);

// Doctor-specific routes
router.put("/:queueId/fetch", authMiddleware, roleMiddleware(['doctor', 'nurse']), queueController.fetchPatient);
router.put("/:queueId/complete", authMiddleware, roleMiddleware(['doctor']), queueController.completeConsultation);
router.put("/:queueId/complete-with-lab", authMiddleware, roleMiddleware(['doctor']), queueController.completeConsultationWithLab);

router.post('/:queueId/vitals', authMiddleware, roleMiddleware(['doctor', 'nurse']), queueController.recordVitals);

// Get vitals for a queue item
router.get('/:queueId/vitals', authMiddleware, queueController.getVitals);


// Lab routes
router.put("/:queueId/lab-complete", authMiddleware, roleMiddleware(['lab']), queueController.labComplete);

// Pharmacy routes
router.put("/:queueId/pharmacy-complete", authMiddleware, roleMiddleware(['pharmacy']), queueController.pharmacyComplete);

// Admin/Reception can cancel
router.put("/:queueId/cancel", authMiddleware, roleMiddleware(['admin', 'receptionist']), queueController.cancel);

// Get expiring queue items (Admin/Receptionist only)
router.get("/admin/expiring", authMiddleware, roleMiddleware(['admin', 'receptionist']), queueController.getExpiringQueue);

// Manual cleanup endpoint (Admin only)
router.post("/admin/cleanup", authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const result = await runCleanupNow();
    res.json(result);
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get queue statistics (Admin/Receptionist)
router.get("/admin/stats", authMiddleware, roleMiddleware(['admin', 'receptionist']), async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;