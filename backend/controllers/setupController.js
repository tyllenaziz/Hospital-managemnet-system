const HospitalConfig = require('../models/HospitalConfig');
const ModuleConfig = require('../models/ModuleConfig');
const { MODULES } = require('../config/modules.config');

/**
 * Hospital Setup Controller
 * Handles initial setup and configuration management
 */
const setupController = {
    /**
     * Check if setup is completed
     */
    checkSetupStatus: async (req, res) => {
        try {
            const config = await HospitalConfig.findByPk(1);

            res.json({
                success: true,
                setupCompleted: config ? config.setup_completed : false,
                setupStep: config ? config.setup_step : 0
            });
        } catch (error) {
            console.error('Check setup status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check setup status'
            });
        }
    },

    /**
     * Get hospital configuration
     */
    getHospitalConfig: async (req, res) => {
        try {
            let config = await HospitalConfig.findByPk(1);

            if (!config) {
                // Create default config
                config = await HospitalConfig.create({
                    id: 1,
                    hospital_name: 'My Hospital',
                    setup_completed: false
                });
            }

            res.json({
                success: true,
                config
            });
        } catch (error) {
            console.error('Get hospital config error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get hospital configuration'
            });
        }
    },

    /**
     * Update hospital configuration
     */
    updateHospitalConfig: async (req, res) => {
        try {
            const {
                hospital_name,
                hospital_code,
                address,
                city,
                county,
                country,
                phone,
                alternative_phone,
                email,
                website,
                license_number,
                tax_pin,
                consultation_fee,
                currency,
                timezone,
                date_format
            } = req.body;

            let config = await HospitalConfig.findByPk(1);

            if (!config) {
                config = await HospitalConfig.create({ id: 1, hospital_name });
            }

            await config.update({
                hospital_name,
                hospital_code,
                address,
                city,
                county,
                country,
                phone,
                alternative_phone,
                email,
                website,
                license_number,
                tax_pin,
                consultation_fee,
                currency,
                timezone,
                date_format,
                setup_step: Math.max(config.setup_step, 1)
            });

            res.json({
                success: true,
                message: 'Hospital configuration updated',
                config
            });
        } catch (error) {
            console.error('Update hospital config error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update hospital configuration'
            });
        }
    },

    /**
     * Upload hospital logo
     */
    uploadLogo: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            const config = await HospitalConfig.findByPk(1);
            if (!config) {
                return res.status(404).json({
                    success: false,
                    error: 'Hospital config not found'
                });
            }

            await config.update({
                logo_path: `/uploads/logo/${req.file.filename}`
            });

            res.json({
                success: true,
                message: 'Logo uploaded successfully',
                logoPath: config.logo_path
            });
        } catch (error) {
            console.error('Upload logo error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload logo'
            });
        }
    },

    /**
     * Get all modules with current status
     */
    getModules: async (req, res) => {
        try {
            // Initialize modules if not exists
            await ModuleConfig.initializeDefaults();

            const modules = await ModuleConfig.findAll({
                order: [['category', 'ASC'], ['display_order', 'ASC']]
            });

            // Group by category
            const grouped = {
                core: [],
                clinical: [],
                financial: [],
                operations: []
            };

            modules.forEach(m => {
                if (grouped[m.category]) {
                    grouped[m.category].push(m);
                }
            });

            res.json({
                success: true,
                modules,
                grouped
            });
        } catch (error) {
            console.error('Get modules error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get modules'
            });
        }
    },

    /**
     * Update module configuration
     */
    updateModules: async (req, res) => {
        try {
            const { modules } = req.body; // Array of { module_code, is_enabled }

            if (!Array.isArray(modules)) {
                return res.status(400).json({
                    success: false,
                    error: 'Modules must be an array'
                });
            }

            const results = [];
            const errors = [];

            for (const mod of modules) {
                try {
                    const updated = await ModuleConfig.setEnabled(mod.module_code, mod.is_enabled);
                    results.push({
                        module_code: mod.module_code,
                        is_enabled: updated.is_enabled
                    });
                } catch (err) {
                    errors.push({
                        module_code: mod.module_code,
                        error: err.message
                    });
                }
            }

            // Update setup step
            const config = await HospitalConfig.findByPk(1);
            if (config) {
                await config.update({
                    setup_step: Math.max(config.setup_step, 2)
                });
            }

            res.json({
                success: true,
                message: 'Modules updated',
                results,
                errors: errors.length > 0 ? errors : undefined
            });
        } catch (error) {
            console.error('Update modules error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update modules'
            });
        }
    },

    /**
     * Toggle a single module
     */
    toggleModule: async (req, res) => {
        try {
            const { moduleCode } = req.params;
            const { enabled } = req.body;

            const module = await ModuleConfig.setEnabled(moduleCode, enabled);

            res.json({
                success: true,
                message: `Module ${module.module_name} ${enabled ? 'enabled' : 'disabled'}`,
                module
            });
        } catch (error) {
            console.error('Toggle module error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to toggle module'
            });
        }
    },

    /**
     * Complete initial setup
     */
    completeSetup: async (req, res) => {
        try {
            const config = await HospitalConfig.findByPk(1);

            if (!config) {
                return res.status(404).json({
                    success: false,
                    error: 'Hospital config not found'
                });
            }

            // Validate required fields
            if (!config.hospital_name) {
                return res.status(400).json({
                    success: false,
                    error: 'Hospital name is required'
                });
            }

            await config.update({
                setup_completed: true,
                setup_step: 3
            });

            res.json({
                success: true,
                message: 'Setup completed successfully',
                config
            });
        } catch (error) {
            console.error('Complete setup error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to complete setup'
            });
        }
    },

    /**
     * Get enabled modules list (for frontend routing)
     */
    getEnabledModules: async (req, res) => {
        try {
            const modules = await ModuleConfig.getEnabledModules();

            res.json({
                success: true,
                modules: modules.map(m => ({
                    code: m.module_code,
                    name: m.module_name,
                    category: m.category
                }))
            });
        } catch (error) {
            console.error('Get enabled modules error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get enabled modules'
            });
        }
    }
};

module.exports = setupController;
