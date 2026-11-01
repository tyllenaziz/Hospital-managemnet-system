const express = require("express");
const router = express.Router();
const medicineController = require("../controllers/medicineController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

router.use(authMiddleware, requireHospitalScope, requireModule('pharmacy'));

// Create medicine - multiple endpoints for compatibility
router.post("/", roleMiddleware(["admin", "pharmacy"]), medicineController.create);
router.post("/add", roleMiddleware(["admin", "pharmacy"]), medicineController.create);

// Get all medicines
router.get("/", medicineController.getAll);

// Search medicines
router.get("/search", medicineController.search);

// Low stock medicines
router.get("/low-stock", roleMiddleware(["admin", "pharmacy"]), medicineController.getLowStock);

// Expiring soon medicines
router.get("/expiring-soon", roleMiddleware(["admin", "pharmacy"]), medicineController.getExpiringSoon);

// Get medicine by barcode
router.get("/barcode/:barcode", medicineController.getByBarcode);

// Get medicine by ID
router.get("/:id", medicineController.getById);

// Update medicine - multiple endpoints for compatibility
router.put("/:id", roleMiddleware(["admin", "pharmacy"]), medicineController.update);
router.put("/update/:id", roleMiddleware(["admin", "pharmacy"]), medicineController.update);

// Delete medicine - multiple endpoints for compatibility
router.delete("/:id", roleMiddleware(["admin"]), medicineController.delete);
router.delete("/delete/:id", roleMiddleware(["admin"]), medicineController.delete);

module.exports = router;