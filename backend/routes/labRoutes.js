const express = require("express");
const router = express.Router();
const labController = require("../controllers/labController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All lab routes require auth, hospital scope, and laboratory module
router.use(authMiddleware, requireHospitalScope, requireModule('laboratory'));

// Lab Test Catalog Management (Admin/Lab)
router.get("/tests", authMiddleware, labController.getAllTests);
router.get("/tests/search", authMiddleware, labController.searchTests);
router.get("/tests/:id", authMiddleware, labController.getTestById);
router.post("/tests", authMiddleware, roleMiddleware(['admin', 'lab']), labController.createTest);
router.put("/tests/:id", authMiddleware, roleMiddleware(['admin', 'lab']), labController.updateTest);
router.delete("/tests/:id", authMiddleware, roleMiddleware(['admin']), labController.deleteTest);

// Lab Orders (Lab Technician)
router.get("/orders/pending", authMiddleware, roleMiddleware(['lab']), labController.getPendingOrders);
router.get("/orders/all", authMiddleware, roleMiddleware(['lab', 'doctor', 'admin']), labController.getAllOrders);
router.get("/orders/:id", authMiddleware, labController.getOrderById);
router.put("/orders/:orderId/start", authMiddleware, roleMiddleware(['lab']), labController.startOrder);
router.put("/orders/:orderId/complete", authMiddleware, roleMiddleware(['lab']), labController.completeLab);
router.get('/orders/queue/:queueId', authMiddleware, labController.getLabOrderByQueueId);

// Lab Results (Lab and Doctor can view)
router.get("/results/all", authMiddleware, roleMiddleware(['lab', 'doctor', 'admin']), labController.getAllResults);
router.get("/results/patient/:patientId", authMiddleware, roleMiddleware(['lab', 'doctor', 'admin']), labController.getResultsByPatient);
router.post("/results/:itemId", authMiddleware, roleMiddleware(['lab']), labController.addResults);
router.put('/results/:itemId', authMiddleware, roleMiddleware(['lab']), labController.updateResults);

module.exports = router;