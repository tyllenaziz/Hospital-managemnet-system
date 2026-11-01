const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const radiologyController = require("../controllers/radiologyController");
const { authMiddleware } = require('../middlewares/authMiddleware');
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// All radiology routes require auth, hospital scope, and radiology module
router.use(authMiddleware, requireHospitalScope, requireModule('radiology'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/radiology/'); // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'xray-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|dicom|dcm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Create a new radiology/X-ray request
router.post("/request", radiologyController.createRadiologyRequest);

// Create order (from doctor)
router.post("/orders", radiologyController.createOrder);

// Get doctor's orders
router.get("/doctor-orders", radiologyController.getDoctorOrders);

router.get("/patient/:patient_id", radiologyController.getPatientRadiologyRequests);

router.get("/pending", radiologyController.getPendingRequests);

// Update order status
router.put("/orders/:id/status", radiologyController.updateOrderStatus);

// Submit results
router.put("/orders/:id/results", radiologyController.submitResults);

// Register external patient
router.post("/external-patient", radiologyController.registerExternalPatient);

router.post("/upload",
    upload.single('xray_image'),
    radiologyController.uploadRadiologyResult);

// Exam Management Routes
router.get("/exams", radiologyController.getExams);
router.post("/exams", radiologyController.createExam);
router.put("/exams/:id", radiologyController.updateExam);
router.delete("/exams/:id", radiologyController.deleteExam);

router.get("/image/:result_id", radiologyController.getRadiologyImage);

router.post("/report", radiologyController.createRadiologyReport);

router.get("/report/:report_id", radiologyController.getRadiologyReport);

router.get("/reports/patient/:patient_id", radiologyController.getPatientReports);

module.exports = router;