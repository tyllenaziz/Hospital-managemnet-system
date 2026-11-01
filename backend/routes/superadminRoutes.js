const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const superadminController = require('../controllers/superadminController');
const { verifyToken, requireSuperAdmin } = require('../middlewares/authMiddleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// ==========================================
// PUBLIC ROUTES (No auth required)
// ==========================================

// Get hospital branding for login page
router.get('/hospital-branding/:code', superadminController.getHospitalBranding);

// ==========================================
// PROTECTED ROUTES (Super Admin only)
// ==========================================

// Dashboard stats
router.get('/dashboard/stats', verifyToken, requireSuperAdmin, superadminController.getDashboardStats);

// Hospital CRUD
router.get('/hospitals', verifyToken, requireSuperAdmin, superadminController.getHospitals);
router.get('/hospitals/:id', verifyToken, requireSuperAdmin, superadminController.getHospitalById);
router.post('/hospitals', verifyToken, requireSuperAdmin, upload.single('logo'), superadminController.createHospital);
router.put('/hospitals/:id', verifyToken, requireSuperAdmin, upload.single('logo'), superadminController.updateHospital);

// Hospital Modules
router.get('/hospitals/:id/modules', verifyToken, requireSuperAdmin, superadminController.getHospitalModules);
router.put('/hospitals/:id/modules/:moduleCode', verifyToken, requireSuperAdmin, superadminController.setHospitalModule);

// Branches
router.get('/hospitals/:id/branches', verifyToken, requireSuperAdmin, superadminController.getBranches);
router.post('/hospitals/:id/branches', verifyToken, requireSuperAdmin, superadminController.createBranch);
router.put('/branches/:branchId', verifyToken, requireSuperAdmin, superadminController.updateBranch);

// Hospital Users
router.get('/hospitals/:id/users', verifyToken, requireSuperAdmin, superadminController.getHospitalUsers);
router.post('/hospitals/:id/admin', verifyToken, requireSuperAdmin, superadminController.addHospitalAdmin);

module.exports = router;
