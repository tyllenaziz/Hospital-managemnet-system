const express = require("express");
const router = express.Router();
const prescriptionController = require("../controllers/prescriptionController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All prescription routes require auth, hospital scope, and pharmacy module
router.use(authMiddleware, requireHospitalScope, requireModule('pharmacy'));

// Doctor creates prescription
router.post("/", authMiddleware, roleMiddleware(['doctor']), prescriptionController.create);

// Get all prescriptions with filtering and pagination
router.get("/all", authMiddleware, roleMiddleware(['doctor', 'pharmacy', 'admin']), prescriptionController.getAll);

// Get prescription statistics
router.get("/stats/summary", authMiddleware, roleMiddleware(['doctor', 'pharmacy', 'admin']), prescriptionController.getStats);

// Get prescription details
router.get("/:id", authMiddleware, prescriptionController.getById);

// Get prescriptions by specific doctor
router.get("/doctor/:doctorId", authMiddleware, roleMiddleware(['doctor', 'pharmacy', 'admin']), prescriptionController.getByDoctor);


// Get prescriptions by patient
router.get("/patient/:patientId", authMiddleware, roleMiddleware(['doctor', 'pharmacy', 'admin']), prescriptionController.getByPatient);

// Pharmacy gets pending prescriptions
router.get("/status/pending", authMiddleware, roleMiddleware(['pharmacy', 'doctor', 'admin']), prescriptionController.getPending);

// Get dispensed prescriptions
router.get("/status/dispensed", authMiddleware, roleMiddleware(['pharmacy', 'doctor', 'admin']), prescriptionController.getDispensed);
router.get("/:prescriptionId/receipt", authMiddleware, prescriptionController.getReceipt);
router.put("/:id/status", authMiddleware, roleMiddleware(['pharmacy', 'doctor']), prescriptionController.updateStatus);

// Pharmacist dispenses medicine
router.post("/:prescriptionId/dispense", authMiddleware, roleMiddleware(['pharmacy']), prescriptionController.dispense);
router.get("/queue/:queueId", authMiddleware, prescriptionController.getByQueueId);

router.get("/patient/:patientId/latest", authMiddleware, prescriptionController.getLatestByPatient);

module.exports = router;