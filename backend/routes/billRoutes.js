const express = require("express");
const router = express.Router();
const billController = require("../controllers/billController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All bill routes require auth, hospital scope, and billing module
router.use(authMiddleware, requireHospitalScope, requireModule('billing'));

// Bill Management
router.post("/", authMiddleware, roleMiddleware(['pharmacy', 'admin', 'receptionist']), billController.create);
router.get("/pending", authMiddleware, roleMiddleware(['pharmacy', 'admin']), billController.getPending);
router.get("/:id", authMiddleware, billController.getById);
router.get("/patient/:patientId", authMiddleware, billController.getByPatient);
router.get("/", authMiddleware, roleMiddleware(['receptionist', 'pharmacy', 'admin']), billController.getAll);

// Add services to bill
router.post("/:billId/lab-tests", authMiddleware, roleMiddleware(['pharmacy', 'admin']), billController.addLabTests);
router.post("/:billId/medicines", authMiddleware, roleMiddleware(['pharmacy', 'admin']), billController.addMedicines);

// Payment
router.post("/:billId/payment", authMiddleware, roleMiddleware(['pharmacy', 'admin', 'receptionist']), billController.addPayment);

module.exports = router;