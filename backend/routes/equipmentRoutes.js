const express = require("express");
const router = express.Router();
const equipmentController = require("../controllers/equipmentController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

router.use(authMiddleware, requireHospitalScope, requireModule('inventory'));

// Create equipment - multiple endpoints for compatibility
router.post("/", roleMiddleware(["admin", "pharmacy"]), equipmentController.create);
router.post("/add", roleMiddleware(["admin", "pharmacy"]), equipmentController.create);

// Get all equipment
router.get("/", equipmentController.getAll);

// Search equipment
router.get("/search", equipmentController.search);

// Equipment needing maintenance
router.get("/maintenance-needed", roleMiddleware(["admin", "pharmacy"]), equipmentController.getMaintenanceNeeded);

// Get equipment by status
router.get("/status/:status", equipmentController.getByStatus);

// Get equipment by serial number
router.get("/serial/:serial_number", equipmentController.getBySerialNumber);

// Get equipment by ID
router.get("/:id", equipmentController.getById);

// Update equipment - multiple endpoints for compatibility
router.put("/:id", roleMiddleware(["admin", "pharmacy"]), equipmentController.update);
router.put("/update/:id", roleMiddleware(["admin", "pharmacy"]), equipmentController.update);

// Delete equipment - multiple endpoints for compatibility
router.delete("/:id", roleMiddleware(["admin"]), equipmentController.delete);
router.delete("/delete/:id", roleMiddleware(["admin"]), equipmentController.delete);

module.exports = router;