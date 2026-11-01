const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Branch Model
 * Represents a branch/location of a hospital
 */
const Branch = sequelize.define('Branch', {
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
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Branch code within hospital'
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    is_main_branch: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'branches',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['hospital_id', 'code']
        }
    ]
});

/**
 * Get all branches for a hospital
 */
Branch.getByHospital = async function (hospitalId) {
    return await Branch.findAll({
        where: { hospital_id: hospitalId, is_active: true },
        order: [['is_main_branch', 'DESC'], ['name', 'ASC']]
    });
};

/**
 * Get main branch for a hospital
 */
Branch.getMainBranch = async function (hospitalId) {
    return await Branch.findOne({
        where: { hospital_id: hospitalId, is_main_branch: true }
    });
};

module.exports = Branch;
