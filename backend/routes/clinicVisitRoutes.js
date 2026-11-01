const express = require("express");
const router = express.Router();
const clinicVisitController = require("../controllers/clinicVisitController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All clinic visit routes require auth, hospital scope, and chronicCare module
router.use(authMiddleware, requireHospitalScope, requireModule('chronicCare'));

// ==================== NURSE FUNCTIONS ====================

// Record a clinic visit (Nurse, Doctor)
router.post("/record", authMiddleware, roleMiddleware(['nurse', 'doctor']), clinicVisitController.recordVisit);

// Get visit history for an enrollment
router.get("/enrollment/:enrollment_id/history", authMiddleware, clinicVisitController.getVisitHistory);

// Get vitals trend data for graphs
router.get("/enrollment/:enrollment_id/trend", authMiddleware, clinicVisitController.getVitalsTrend);

// Get today's clinic visits
router.get("/today", authMiddleware, clinicVisitController.getTodayVisits);

// ==================== DOCTOR FUNCTIONS ====================

// Get pending reviews (Doctor)
router.get("/pending-reviews", authMiddleware, roleMiddleware(['doctor', 'admin']), clinicVisitController.getPendingReviews);

// Review a clinic visit (Doctor)
router.put("/:visit_id/review", authMiddleware, roleMiddleware(['doctor']), clinicVisitController.reviewVisit);

// Escalate to full consultation (Doctor)
router.post("/:visit_id/escalate", authMiddleware, roleMiddleware(['doctor']), clinicVisitController.escalateToConsultation);

// Get abnormal visits (alerts)
router.get("/abnormal", authMiddleware, roleMiddleware(['doctor', 'nurse', 'admin']), clinicVisitController.getAbnormalVisits);

module.exports = router;
