const express = require("express");
const router = express.Router();
const chronicController = require("../controllers/chronicController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All chronic routes require auth, hospital scope, and chronicCare module
router.use(authMiddleware, requireHospitalScope, requireModule('chronicCare'));

// ==================== CLINIC MANAGEMENT ====================

// List all clinics (all authenticated users)
router.get("/clinics", authMiddleware, chronicController.listClinics);

// Create clinic (Admin only)
router.post("/clinics", authMiddleware, roleMiddleware(['admin']), chronicController.createClinic);

// Update clinic (Admin only)
router.put("/clinics/:id", authMiddleware, roleMiddleware(['admin']), chronicController.updateClinic);

// ==================== ENROLLMENT MANAGEMENT ====================

// Enroll patient in clinic (Doctor, Nurse, Receptionist)
router.post("/enroll", authMiddleware, roleMiddleware(['doctor', 'nurse', 'receptionist']), chronicController.enrollPatient);

// Discharge patient from clinic (Doctor only)
router.put("/enrollment/:enrollment_id/discharge", authMiddleware, roleMiddleware(['doctor']), chronicController.dischargePatient);

// Get patient's enrollments (all authenticated users)
router.get("/patient/:patient_id/enrollments", authMiddleware, chronicController.getPatientEnrollments);

// Get all patients in a clinic
router.get("/clinic/:clinic_id/patients", authMiddleware, chronicController.getClinicPatients);

// Get enrollment details
router.get("/enrollment/:enrollment_id", authMiddleware, chronicController.getEnrollmentDetails);

module.exports = router;
