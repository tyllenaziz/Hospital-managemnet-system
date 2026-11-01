const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Hospital Configuration Model
 * Stores hospital details and setup status
 */
const HospitalConfig = sequelize.define('HospitalConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        defaultValue: 1
    },
    hospital_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    hospital_code: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    county: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    country: {
        type: DataTypes.STRING(100),
        defaultValue: 'Kenya'
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    alternative_phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    website: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    logo_path: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    license_number: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    tax_pin: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    // Operational settings
    consultation_fee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 500.00
    },
    currency: {
        type: DataTypes.STRING(10),
        defaultValue: 'KES'
    },
    timezone: {
        type: DataTypes.STRING(50),
        defaultValue: 'Africa/Nairobi'
    },
    date_format: {
        type: DataTypes.STRING(20),
        defaultValue: 'DD/MM/YYYY'
    },
    // Setup status
    setup_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    setup_step: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Sync settings
    cloud_sync_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    last_sync_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'hospital_config',
    timestamps: true,
    underscored: true
});

module.exports = HospitalConfig;
