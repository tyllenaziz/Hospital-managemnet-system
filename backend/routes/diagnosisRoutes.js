const express = require('express');
const router = express.Router();
const diagnosisController = require('../controllers/diagnosisController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Search diagnoses by code or description
router.get('/search', diagnosisController.searchDiagnoses);

// Get common/frequently used diagnoses  
router.get('/common', diagnosisController.getCommonDiagnoses);

// Get all diagnosis categories
router.get('/categories', diagnosisController.getCategories);

// Get single diagnosis by ID
router.get('/:id', diagnosisController.getDiagnosis);

// Prescription diagnosis management
router.get('/prescription/:prescriptionId', diagnosisController.getPrescriptionDiagnoses);
router.post('/prescription/:prescriptionId', diagnosisController.addPrescriptionDiagnoses);

module.exports = router;
