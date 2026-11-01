const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Module Configuration Model
 * Stores enabled/disabled status of each module
 */
const ModuleConfig = sequelize.define('ModuleConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    module_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    module_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category: {
        type: DataTypes.ENUM('core', 'clinical', 'financial', 'operations'),
        defaultValue: 'clinical'
    },
    is_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Module-specific configuration stored as JSON
    config_data: {
        type: DataTypes.JSON,
        allowNull: true
    },
    // Order for display in UI
    display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'module_config',
    timestamps: true,
    underscored: true
});

/**
 * Initialize default modules from config
 */
ModuleConfig.initializeDefaults = async function () {
    const { MODULES } = require('../config/modules.config');

    let order = 0;
    for (const [code, module] of Object.entries(MODULES)) {
        await ModuleConfig.findOrCreate({
            where: { module_code: code },
            defaults: {
                module_code: module.code,
                module_name: module.name,
                description: module.description,
                category: module.category,
                is_enabled: module.enabled,
                is_required: module.required,
                display_order: order++
            }
        });
    }
};

/**
 * Get all enabled modules
 */
ModuleConfig.getEnabledModules = async function () {
    return await ModuleConfig.findAll({
        where: { is_enabled: true },
        order: [['display_order', 'ASC']]
    });
};

/**
 * Check if a module is enabled
 */
ModuleConfig.isEnabled = async function (moduleCode) {
    const module = await ModuleConfig.findOne({
        where: { module_code: moduleCode }
    });
    return module ? module.is_enabled : false;
};

/**
 * Enable or disable a module
 */
ModuleConfig.setEnabled = async function (moduleCode, enabled) {
    const module = await ModuleConfig.findOne({
        where: { module_code: moduleCode }
    });

    if (!module) {
        throw new Error(`Module ${moduleCode} not found`);
    }

    if (module.is_required && !enabled) {
        throw new Error(`Cannot disable required module: ${module.module_name}`);
    }

    module.is_enabled = enabled;
    await module.save();
    return module;
};

module.exports = ModuleConfig;
