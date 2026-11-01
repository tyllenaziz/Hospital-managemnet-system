const db = require('../config/dbconfig');
const bcrypt = require('bcrypt');
const { MODULES } = require('../config/modules.config');
const { seedMasterLabTemplates, syncTemplatesToHospital } = require('../services/labCatalogService');
const { uploadBufferToCloudinary } = require('../utils/cloudinaryHelper');
const {
    attachHospitalTenantMeta,
    findHospitalByIdentifier,
} = require('../utils/hospitalTenant');

const normalizeHospitalCode = (value = '') => String(value).trim().toUpperCase();

const normalizeConsultationFee = (value, fallback = 500) => {
    const parsedValue = Number.parseFloat(value);

    if (!Number.isFinite(parsedValue)) {
        return Number(fallback).toFixed(2);
    }

    return parsedValue.toFixed(2);
};

const parseBooleanFlag = (value, defaultValue = true) => {
    if (value === undefined || value === null || value === '') {
        return defaultValue ? 1 : 0;
    }

    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }

    const normalizedValue = String(value).trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalizedValue) ? 1 : 0;
};

const uploadHospitalLogo = async (file) => {
    if (!file?.buffer) {
        return null;
    }

    const uploadedLogo = await uploadBufferToCloudinary(file.buffer, {
        folder: 'vijomedix/hospital-logos',
    });

    return uploadedLogo.secure_url;
};

const initializeHospitalModules = async (executor, hospitalId) => {
    for (const module of Object.values(MODULES)) {
        await executor.query(`
            INSERT INTO hospital_modules (hospital_id, module_code, module_name, is_enabled, config_data)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                module_name = VALUES(module_name),
                is_enabled = VALUES(is_enabled)
        `, [
            hospitalId,
            module.code,
            module.name,
            module.required ? 1 : 0,
            null,
        ]);
    }
};

/**
 * Super Admin Controller
 * Platform-level management of hospitals, branches, and modules
 */
const superadminController = {
    /**
     * Get platform dashboard stats
     */
    getDashboardStats: async (req, res) => {
        try {
            const [[stats]] = await db.query(`
                SELECT 
                    (SELECT COUNT(*) FROM hospitals WHERE is_active = 1) as total_hospitals,
                    (SELECT COUNT(*) FROM hospitals WHERE subscription_status = 'active') as active_subscriptions,
                    (SELECT COUNT(*) FROM hospitals WHERE subscription_status = 'trial') as trial_hospitals,
                    (SELECT COUNT(*) FROM branches WHERE is_active = 1) as total_branches,
                    (SELECT COUNT(*) FROM users WHERE role != 'superadmin') as total_users,
                    (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins
            `);

            res.json({ success: true, stats });
        } catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Get all hospitals
     */
    getHospitals: async (req, res) => {
        try {
            const [hospitals] = await db.query(`
                SELECT h.*, 
                    (SELECT COUNT(*) FROM branches WHERE hospital_id = h.id) as branch_count,
                    (SELECT COUNT(*) FROM users WHERE hospital_id = h.id AND role = 'admin') as admin_count,
                    (SELECT COUNT(*) FROM users WHERE hospital_id = h.id) as user_count
                FROM hospitals h
                ORDER BY h.created_at DESC
            `);

            res.json({
                success: true,
                hospitals: hospitals.map((hospital) => attachHospitalTenantMeta(hospital)),
            });
        } catch (error) {
            console.error('Get hospitals error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Get single hospital by ID
     */
    getHospitalById: async (req, res) => {
        try {
            const { id } = req.params;
            const [[hospital]] = await db.query(`
                SELECT * FROM hospitals WHERE id = ?
            `, [id]);

            if (!hospital) {
                return res.status(404).json({ success: false, error: 'Hospital not found' });
            }

            // Get branches
            const [branches] = await db.query(`
                SELECT * FROM branches WHERE hospital_id = ? ORDER BY is_main_branch DESC, name ASC
            `, [id]);

            // Get admins
            const [admins] = await db.query(`
                SELECT id, username, role, phone, createdAt 
                FROM users WHERE hospital_id = ? AND role IN ('admin', 'supervisor')
            `, [id]);

            res.json({
                success: true,
                hospital: attachHospitalTenantMeta(hospital),
                branches,
                admins,
            });
        } catch (error) {
            console.error('Get hospital error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Create new hospital
     */
    createHospital: async (req, res) => {
        let connection;

        try {
            const {
                name, code, address, city, county, country,
                phone, alternative_phone, email, website,
                license_number, tax_pin, consultation_fee,
                subscription_status, subscription_expires_at, is_active,
                // Admin details
                admin_username, admin_password, admin_phone
            } = req.body;

            const normalizedCode = normalizeHospitalCode(code);
            const normalizedConsultationFee = normalizeConsultationFee(consultation_fee);
            if (!normalizedCode) {
                return res.status(400).json({ success: false, error: 'Hospital code is required' });
            }

            const logo_path = await uploadHospitalLogo(req.file);

            connection = await db.getConnection();
            await connection.beginTransaction();

            // Check if code already exists
            const [[existing]] = await connection.query('SELECT id FROM hospitals WHERE code = ?', [normalizedCode]);
            if (existing) {
                await connection.rollback();
                return res.status(400).json({ success: false, error: 'Hospital code already exists' });
            }

            // Check if admin username exists (if provided)
            if (admin_username) {
                const [[existingUser]] = await connection.query('SELECT id FROM users WHERE username = ?', [admin_username]);
                if (existingUser) {
                    await connection.rollback();
                    return res.status(400).json({ success: false, error: 'Admin username already exists' });
                }
            }

            const [result] = await connection.query(`
                INSERT INTO hospitals (
                    name, code, logo_path, address, city, county, country,
                    phone, alternative_phone, email, website,
                    license_number, tax_pin, consultation_fee,
                    subscription_status, subscription_expires_at, is_active, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                name, normalizedCode, logo_path, address, city, county, country || 'Kenya',
                phone, alternative_phone, email, website,
                license_number, tax_pin, normalizedConsultationFee,
                subscription_status || 'trial', subscription_expires_at,
                parseBooleanFlag(is_active, true),
                req.user?.id
            ]);

            const hospitalId = result.insertId;

            // Create main branch
            const [branchResult] = await connection.query(`
                INSERT INTO branches (hospital_id, name, code, is_main_branch, is_active)
                VALUES (?, 'Main Branch', 'MAIN', TRUE, TRUE)
            `, [hospitalId]);
            const branchId = branchResult.insertId;

            // Initialize default modules for the hospital
            await initializeHospitalModules(connection, hospitalId);

            // Create admin user if details provided
            let adminCreated = false;
            let adminId = null;
            if (admin_username && admin_password) {
                const hashedPassword = await bcrypt.hash(admin_password, 10);
                const [adminResult] = await connection.query(`
                    INSERT INTO users (username, password, role, phone, hospital_id, branch_id)
                    VALUES (?, ?, 'admin', ?, ?, ?)
                `, [admin_username, hashedPassword, admin_phone || null, hospitalId, branchId]);
                adminCreated = true;
                adminId = adminResult.insertId;
            }

            // Initialize patient number settings for the hospital
            const patientSettings = [
                ['patient_number_prefix', normalizedCode.substring(0, 4), 'Prefix for patient numbers'],
                ['patient_number_format', 'PREFIX-SEQUENCE', 'Format: PREFIX-SEQUENCE, YEAR-SEQUENCE, etc.'],
                ['patient_number_padding', '5', 'Number of digits (5 = 00001)'],
                ['patient_number_next', '1', 'Next available patient number'],
                ['receipt_prefix', `${normalizedCode.substring(0, 4)}-RCP`, 'Prefix for payment receipts'],
                ['receipt_next', '1', 'Next receipt sequence number'],
                ['consultation_fee', normalizedConsultationFee, 'Default consultation fee']
            ];
            for (const [key, value, desc] of patientSettings) {
                await connection.query(`
                    INSERT INTO system_settings (hospital_id, setting_key, setting_value, description)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
                `, [hospitalId, key, value, desc]);
            }

            // Seed the platform lab catalog once and sync it into the new hospital.
            await seedMasterLabTemplates(connection);
            await syncTemplatesToHospital(hospitalId, connection);

            await connection.commit();

            res.json({
                success: true,
                message: adminCreated
                    ? 'Hospital created successfully with admin user'
                    : 'Hospital created successfully',
                hospitalId,
                adminCreated,
                adminId
            });
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('Create hospital error:', error);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            connection?.release();
        }
    },

    /**
     * Update hospital
     */
    updateHospital: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                name, address, city, county, country,
                phone, alternative_phone, email, website,
                license_number, tax_pin, consultation_fee,
                is_active, subscription_status, subscription_expires_at
            } = req.body;
            const normalizedConsultationFee = normalizeConsultationFee(consultation_fee);

            // Handle logo upload
            let logoUpdate = '';
            const params = [];

            if (req.file) {
                logoUpdate = ', logo_path = ?';
                params.push(await uploadHospitalLogo(req.file));
            }

            await db.query(`
                UPDATE hospitals SET
                    name = ?, address = ?, city = ?, county = ?, country = ?,
                    phone = ?, alternative_phone = ?, email = ?, website = ?,
                    license_number = ?, tax_pin = ?, consultation_fee = ?,
                    is_active = ?, subscription_status = ?, subscription_expires_at = ?
                    ${logoUpdate}
                WHERE id = ?
            `, [
                name, address, city, county, country,
                phone, alternative_phone, email, website,
                license_number, tax_pin, normalizedConsultationFee,
                parseBooleanFlag(is_active, true), subscription_status, subscription_expires_at,
                ...params, id
            ]);

            res.json({ success: true, message: 'Hospital updated successfully' });
        } catch (error) {
            console.error('Update hospital error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Get hospital branding for login page (public endpoint)
     */
    getHospitalBranding: async (req, res) => {
        try {
            const { code } = req.params;
            const hospital = await findHospitalByIdentifier(db, code, {
                fields: 'id, name, code, logo_path, phone, email, is_active',
            });

            if (!hospital) {
                return res.status(404).json({
                    success: false,
                    error: 'Hospital not found'
                });
            }

            res.json({ success: true, hospital });
        } catch (error) {
            console.error('Get hospital branding error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Get modules for a hospital
     */
    getHospitalModules: async (req, res) => {
        try {
            const { id } = req.params;

            // Get all available modules with hospital-specific status
            const { MODULES } = require('../config/modules.config');

            const [hospitalModules] = await db.query(`
                SELECT * FROM hospital_modules WHERE hospital_id = ?
            `, [id]);

            // Map modules with enabled status
            const modules = Object.entries(MODULES).map(([code, module]) => {
                const hospitalModule = hospitalModules.find(hm => hm.module_code === code);
                return {
                    code: module.code,
                    name: module.name,
                    description: module.description,
                    category: module.category,
                    required: module.required,
                    is_enabled: hospitalModule ? hospitalModule.is_enabled : false,
                    enabled_at: hospitalModule?.enabled_at,
                    config_data: hospitalModule?.config_data
                };
            });

            res.json({ success: true, modules });
        } catch (error) {
            console.error('Get hospital modules error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Enable/disable module for a hospital
     */
    setHospitalModule: async (req, res) => {
        try {
            const { id, moduleCode } = req.params;
            const { enabled } = req.body;

            const { MODULES } = require('../config/modules.config');
            const moduleConfig = MODULES[moduleCode];

            if (!moduleConfig) {
                return res.status(404).json({ success: false, error: 'Module not found' });
            }

            // Check if trying to disable a required module
            if (moduleConfig.required && !enabled) {
                return res.status(400).json({
                    success: false,
                    error: `Cannot disable required module: ${moduleConfig.name}`
                });
            }

            // Upsert the module setting
            await db.query(`
                INSERT INTO hospital_modules (hospital_id, module_code, module_name, is_enabled, enabled_by, enabled_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    is_enabled = VALUES(is_enabled),
                    enabled_by = VALUES(enabled_by),
                    enabled_at = VALUES(enabled_at)
            `, [
                id, moduleCode, moduleConfig.name, enabled,
                enabled ? req.user?.id : null,
                enabled ? new Date() : null
            ]);

            res.json({
                success: true,
                message: `Module ${enabled ? 'enabled' : 'disabled'} successfully`
            });
        } catch (error) {
            console.error('Set hospital module error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Get branches for a hospital
     */
    getBranches: async (req, res) => {
        try {
            const { id } = req.params;

            const [branches] = await db.query(`
                SELECT b.*,
                    (SELECT COUNT(*) FROM users WHERE branch_id = b.id) as user_count,
                    (SELECT username FROM users WHERE branch_id = b.id AND role = 'supervisor' LIMIT 1) as supervisor
                FROM branches b
                WHERE b.hospital_id = ?
                ORDER BY b.is_main_branch DESC, b.name ASC
            `, [id]);

            res.json({ success: true, branches });
        } catch (error) {
            console.error('Get branches error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Create branch for a hospital
     */
    createBranch: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, code, address, city, phone, is_main_branch } = req.body;

            // Check for duplicate code within hospital
            const [[existing]] = await db.query(
                'SELECT id FROM branches WHERE hospital_id = ? AND code = ?',
                [id, code.toUpperCase()]
            );
            if (existing) {
                return res.status(400).json({ success: false, error: 'Branch code already exists' });
            }

            // If setting as main branch, unset others
            if (is_main_branch) {
                await db.query('UPDATE branches SET is_main_branch = FALSE WHERE hospital_id = ?', [id]);
            }

            const [result] = await db.query(`
                INSERT INTO branches (hospital_id, name, code, address, city, phone, is_main_branch)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [id, name, code.toUpperCase(), address, city, phone, is_main_branch || false]);

            res.json({
                success: true,
                message: 'Branch created successfully',
                branchId: result.insertId
            });
        } catch (error) {
            console.error('Create branch error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Update branch
     */
    updateBranch: async (req, res) => {
        try {
            const { branchId } = req.params;
            const { name, address, city, phone, is_active, is_main_branch } = req.body;

            // Get branch to find hospital_id
            const [[branch]] = await db.query('SELECT hospital_id FROM branches WHERE id = ?', [branchId]);
            if (!branch) {
                return res.status(404).json({ success: false, error: 'Branch not found' });
            }

            // If setting as main branch, unset others
            if (is_main_branch) {
                await db.query(
                    'UPDATE branches SET is_main_branch = FALSE WHERE hospital_id = ?',
                    [branch.hospital_id]
                );
            }

            await db.query(`
                UPDATE branches SET
                    name = ?, address = ?, city = ?, phone = ?,
                    is_active = ?, is_main_branch = ?
                WHERE id = ?
            `, [name, address, city, phone, is_active, is_main_branch, branchId]);

            res.json({ success: true, message: 'Branch updated successfully' });
        } catch (error) {
            console.error('Update branch error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Add admin user for a hospital
     */
    addHospitalAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const { username, password, phone, branch_id, role } = req.body;

            // Validate role
            const allowedRoles = ['admin', 'supervisor'];
            if (!allowedRoles.includes(role)) {
                return res.status(400).json({ success: false, error: 'Invalid role' });
            }

            // Check if username exists
            const [[existing]] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
            if (existing) {
                return res.status(400).json({ success: false, error: 'Username already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            const [result] = await db.query(`
                INSERT INTO users (username, password, role, phone, hospital_id, branch_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [username, hashedPassword, role, phone, id, branch_id]);

            res.json({
                success: true,
                message: `${role} created successfully`,
                userId: result.insertId
            });
        } catch (error) {
            console.error('Add hospital admin error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Get all users for a hospital
     */
    getHospitalUsers: async (req, res) => {
        try {
            const { id } = req.params;

            const [users] = await db.query(`
                SELECT u.id, u.username, u.role, u.phone, u.createdAt, u.lastLogin,
                    b.name as branch_name, b.code as branch_code
                FROM users u
                LEFT JOIN branches b ON u.branch_id = b.id
                WHERE u.hospital_id = ?
                ORDER BY u.role, u.username
            `, [id]);

            res.json({ success: true, users });
        } catch (error) {
            console.error('Get hospital users error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = superadminController;
