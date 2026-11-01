const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");



// Patient routes (Reception only can register)
router.post("/register", authMiddleware, roleMiddleware(['receptionist', 'doctor', 'pharmacy', 'lab']), patientController.register);
router.get("/", authMiddleware, patientController.getAll);
router.get("/search", authMiddleware, patientController.search);
router.get("/:id", authMiddleware, patientController.getById);

router.get('/:id/visits', authMiddleware, patientController.getVisitHistory);

// Create new visit for existing patient (Reception can create visits)
router.post('/:id/visit', authMiddleware, roleMiddleware(['receptionist', 'doctor', 'nurse', 'admin']), patientController.createVisit);

// Get detailed visit information (sensitive - role-restricted)
router.get('/visits/:visitId/details', authMiddleware, patientController.getVisitDetails);


module.exports = router;