const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All sales routes require auth, hospital scope, and pharmacy module
router.use(authMiddleware, requireHospitalScope, requireModule('pharmacy'));
router.post("/direct", authMiddleware, roleMiddleware(['pharmacy']), salesController.createDirectSale);
router.get("/all", authMiddleware, roleMiddleware(['pharmacy', 'admin']), salesController.getAllSales);
router.get("/:id", authMiddleware, roleMiddleware(['pharmacy', 'admin']), salesController.getSaleById);

module.exports = router;