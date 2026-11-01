const HospitalModule = require('../models/HospitalModule');

/**
 * Module Access Middleware
 * Checks if the requested module is enabled for the user's hospital
 */

/**
 * Create middleware to check if a module is enabled for the current hospital
 * Must be used AFTER authMiddleware (which sets req.user)
 * @param {string} moduleCode - The module code to check
 * @returns {Function} Express middleware
 */
const requireModule = (moduleCode) => {
    return async (req, res, next) => {
        try {
            const hospitalId = req.user?.hospital_id;

            // Superadmin bypasses module checks
            if (req.user?.role === 'superadmin') {
                req.moduleCode = moduleCode;
                return next();
            }

            if (!hospitalId) {
                return res.status(403).json({
                    success: false,
                    error: 'MODULE_ACCESS_DENIED',
                    message: 'Hospital context required for module access'
                });
            }

            const isEnabled = await HospitalModule.isEnabled(hospitalId, moduleCode);

            if (!isEnabled) {
                return res.status(403).json({
                    success: false,
                    error: 'MODULE_DISABLED',
                    message: `The ${moduleCode} module is not enabled for your hospital`,
                    moduleCode: moduleCode
                });
            }

            req.moduleCode = moduleCode;
            next();
        } catch (error) {
            console.error('Module check error:', error);
            // Fail-open for database errors to avoid blocking core functionality
            next();
        }
    };
};

/**
 * Check multiple modules - at least one must be enabled
 * @param {string[]} moduleCodes - Array of module codes
 * @returns {Function} Express middleware
 */
const requireAnyModule = (moduleCodes) => {
    return async (req, res, next) => {
        try {
            const hospitalId = req.user?.hospital_id;

            if (req.user?.role === 'superadmin') {
                return next();
            }

            if (!hospitalId) {
                return res.status(403).json({
                    success: false,
                    error: 'MODULE_ACCESS_DENIED',
                    message: 'Hospital context required for module access'
                });
            }

            for (const moduleCode of moduleCodes) {
                const isEnabled = await HospitalModule.isEnabled(hospitalId, moduleCode);
                if (isEnabled) {
                    req.moduleCode = moduleCode;
                    return next();
                }
            }

            return res.status(403).json({
                success: false,
                error: 'MODULE_DISABLED',
                message: 'None of the required modules are enabled for your hospital',
                requiredModules: moduleCodes
            });
        } catch (error) {
            console.error('Module check error:', error);
            next();
        }
    };
};

/**
 * Add enabled modules info to request (for use in controllers)
 * Loads hospital-specific modules if user is authenticated
 */
const loadModuleInfo = async (req, res, next) => {
    try {
        const hospitalId = req.user?.hospital_id;

        if (hospitalId) {
            const enabledModules = await HospitalModule.getEnabledModules(hospitalId);
            req.enabledModules = enabledModules.map(m => m.module_code);
            req.moduleMap = {};
            enabledModules.forEach(m => {
                req.moduleMap[m.module_code] = {
                    enabled: true,
                    name: m.module_name,
                    config: m.config_data
                };
            });
        } else {
            req.enabledModules = [];
            req.moduleMap = {};
        }
        next();
    } catch (error) {
        console.error('Load module info error:', error);
        req.enabledModules = [];
        req.moduleMap = {};
        next();
    }
};

/**
 * Module codes for easy reference
 */
const MODULE_CODES = {
    CORE: 'core',
    PHARMACY: 'pharmacy',
    LABORATORY: 'laboratory',
    RADIOLOGY: 'radiology',
    CHRONIC_CARE: 'chronicCare',
    REFERRALS: 'referrals',
    FOLLOW_UP: 'followUp',
    BILLING: 'billing',
    INSURANCE: 'insurance',
    EXPENSES: 'expenses',
    MPESA: 'mpesa',
    INVENTORY: 'inventory',
    ATTENDANCE: 'attendance',
    AMBULANCE: 'ambulance',
    AUDIT: 'audit'
};

module.exports = {
    requireModule,
    requireAnyModule,
    loadModuleInfo,
    MODULE_CODES
};
