const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Hospital Model
 * Represents a hospital on the Vijomedix platform
 */
const Hospital = sequelize.define('Hospital', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Used in URL query param for login branding'
    },
    logo_path: {
        type: DataTypes.STRING(255),
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
    // Status
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    subscription_status: {
        type: DataTypes.ENUM('trial', 'active', 'suspended', 'expired'),
        defaultValue: 'trial'
    },
    subscription_expires_at: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'hospitals',
    timestamps: true,
    underscored: true
});

/**
 * Get hospital by code (for login page branding)
 */
Hospital.getByCode = async function(code) {
    return await Hospital.findOne({
        where: { code, is_active: true },
        attributes: ['id', 'name', 'code', 'logo_path', 'phone', 'email']
    });
};

/**
 * Get all active hospitals
 */
Hospital.getAllActive = async function() {
    return await Hospital.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']]
    });
};

module.exports = Hospital;
