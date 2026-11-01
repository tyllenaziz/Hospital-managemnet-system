const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Hospital Module Model
 * Tracks which modules are enabled for each hospital
 */
const HospitalModule = sequelize.define('HospitalModule', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    hospital_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'hospitals',
            key: 'id'
        }
    },
    module_code: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    module_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    is_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    enabled_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Super Admin who enabled this module'
    },
    enabled_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    config_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Module-specific settings'
    }
}, {
    tableName: 'hospital_modules',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['hospital_id', 'module_code']
        }
    ]
});

/**
 * Modules that cannot be disabled
 */
const REQUIRED_MODULES = ['core', 'billing'];

/**
 * Initialize default modules for a hospital
 */
HospitalModule.initializeForHospital = async function (hospitalId) {
    const { MODULES } = require('../config/modules.config');

    for (const [code, module] of Object.entries(MODULES)) {
        await HospitalModule.findOrCreate({
            where: { hospital_id: hospitalId, module_code: code },
            defaults: {
                hospital_id: hospitalId,
                module_code: module.code,
                module_name: module.name,
                is_enabled: module.required, // Only required modules enabled by default
                config_data: null
            }
        });
    }
};

/**
 * Get all modules for a hospital
 */
HospitalModule.getByHospital = async function (hospitalId) {
    return await HospitalModule.findAll({
        where: { hospital_id: hospitalId },
        order: [['module_name', 'ASC']]
    });
};

/**
 * Get enabled modules for a hospital
 */
HospitalModule.getEnabledModules = async function (hospitalId) {
    return await HospitalModule.findAll({
        where: { hospital_id: hospitalId, is_enabled: true }
    });
};

/**
 * Get enabled module codes as a string array (for login response)
 */
HospitalModule.getEnabledModuleCodes = async function (hospitalId) {
    const modules = await HospitalModule.findAll({
        where: { hospital_id: hospitalId, is_enabled: true },
        attributes: ['module_code']
    });
    return modules.map(m => m.module_code);
};

/**
 * Get all modules for a hospital, auto-initializing if empty
 */
HospitalModule.getAllModulesForHospital = async function (hospitalId) {
    let modules = await HospitalModule.findAll({
        where: { hospital_id: hospitalId },
        order: [['module_name', 'ASC']]
    });

    if (modules.length === 0) {
        await HospitalModule.initializeForHospital(hospitalId);
        modules = await HospitalModule.findAll({
            where: { hospital_id: hospitalId },
            order: [['module_name', 'ASC']]
        });
    }

    return modules;
};

/**
 * Check if a module is enabled for a hospital
 */
HospitalModule.isEnabled = async function (hospitalId, moduleCode) {
    const module = await HospitalModule.findOne({
        where: { hospital_id: hospitalId, module_code: moduleCode }
    });
    return module ? module.is_enabled : false;
};

/**
 * Enable or disable a module for a hospital
 */
HospitalModule.setEnabled = async function (hospitalId, moduleCode, enabled, enabledBy = null) {
    // Prevent disabling required modules
    if (REQUIRED_MODULES.includes(moduleCode) && !enabled) {
        throw new Error(`Cannot disable required module: ${moduleCode}`);
    }

    const [module, created] = await HospitalModule.findOrCreate({
        where: { hospital_id: hospitalId, module_code: moduleCode },
        defaults: {
            hospital_id: hospitalId,
            module_code: moduleCode,
            module_name: moduleCode, // Will be updated
            is_enabled: enabled,
            enabled_by: enabled ? enabledBy : null,
            enabled_at: enabled ? new Date() : null
        }
    });

    if (!created) {
        module.is_enabled = enabled;
        module.enabled_by = enabled ? enabledBy : null;
        module.enabled_at = enabled ? new Date() : null;
        await module.save();
    }

    return module;
};

module.exports = HospitalModule;
module.exports.REQUIRED_MODULES = REQUIRED_MODULES;
