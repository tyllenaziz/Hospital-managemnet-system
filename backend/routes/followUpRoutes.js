const express = require("express");
const router = express.Router();
const followUpController = require("../controllers/followUpController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All follow-up routes require auth, hospital scope, and followUp module
router.use(authMiddleware, requireHospitalScope, requireModule('followUp'));

// ==================== SCHEDULING ====================

// Schedule a follow-up (Doctor, Nurse)
router.post("/schedule", authMiddleware, roleMiddleware(['doctor', 'nurse']), followUpController.scheduleFollowUp);

// Get today's follow-ups
router.get("/today", authMiddleware, followUpController.getTodayFollowUps);

// Get upcoming follow-ups
router.get("/upcoming", authMiddleware, followUpController.getUpcoming);

// Get missed appointments
router.get("/missed", authMiddleware, followUpController.getMissed);

// Get calendar view
router.get("/calendar", authMiddleware, followUpController.getCalendar);

// Get defaulters
router.get("/defaulters", authMiddleware, roleMiddleware(['doctor', 'nurse', 'admin']), followUpController.getDefaulters);

// ==================== STATUS UPDATES ====================

// Mark follow-up as completed
router.put("/:id/complete", authMiddleware, roleMiddleware(['doctor', 'nurse']), followUpController.markCompleted);

// Mark follow-up as missed
router.put("/:id/missed", authMiddleware, roleMiddleware(['receptionist', 'nurse']), followUpController.markMissed);

// Reschedule follow-up
router.put("/:id/reschedule", authMiddleware, roleMiddleware(['doctor', 'nurse', 'receptionist']), followUpController.reschedule);

// Auto-mark past appointments as missed (Admin utility)
router.post("/auto-mark-missed", authMiddleware, roleMiddleware(['admin']), followUpController.autoMarkMissed);

module.exports = router;
