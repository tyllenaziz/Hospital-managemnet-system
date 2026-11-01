const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Radiology Order Model
 * Handles all imaging requests: X-Ray, Ultrasound, CT, MRI, etc.
 */
const RadiologyOrder = sequelize.define('RadiologyOrder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_number: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'patients',
            key: 'id'
        }
    },
    queue_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'queue',
            key: 'id'
        }
    },
    ordered_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    performed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    reported_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // Imaging type
    imaging_type: {
        type: DataTypes.ENUM(
            'xray',
            'ultrasound',
            'ct_scan',
            'mri',
            'mammography',
            'fluoroscopy',
            'ecg',
            'doppler',
            'other'
        ),
        allowNull: false
    },
    // Body part / region
    body_part: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    // Specific examination name
    examination_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    // Clinical information
    clinical_history: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    clinical_indication: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Priority
    priority: {
        type: DataTypes.ENUM('routine', 'urgent', 'stat'),
        defaultValue: 'routine'
    },
    // Status tracking
    status: {
        type: DataTypes.ENUM(
            'ordered',
            'scheduled',
            'in_progress',
            'completed',
            'reported',
            'cancelled'
        ),
        defaultValue: 'ordered'
    },
    // Scheduling
    scheduled_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    scheduled_time: {
        type: DataTypes.TIME,
        allowNull: true
    },
    performed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Results
    findings: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    impression: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    recommendations: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Image storage
    image_paths: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    // Billing
    price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    is_billed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    bill_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Notes
    technician_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    radiologist_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Report
    report_generated_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'radiology_orders',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (order) => {
            // Generate order number
            const date = new Date();
            const prefix = 'RAD';
            const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
            const count = await RadiologyOrder.count({
                where: sequelize.where(
                    sequelize.fn('DATE', sequelize.col('created_at')),
                    sequelize.fn('CURDATE')
                )
            });
            order.order_number = `${prefix}-${datePart}-${String(count + 1).padStart(4, '0')}`;
        }
    }
});

/**
 * Radiology Examination Types
 * Master list of available imaging examinations
 */
const RadiologyExam = sequelize.define('RadiologyExam', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    imaging_type: {
        type: DataTypes.ENUM(
            'xray',
            'ultrasound',
            'ct_scan',
            'mri',
            'mammography',
            'fluoroscopy',
            'ecg',
            'doppler',
            'other'
        ),
        allowNull: false
    },
    exam_code: {
        type: DataTypes.STRING(20),
        unique: true
    },
    exam_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    body_part: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    duration_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 30
    },
    preparation_instructions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'radiology_exams',
    timestamps: true,
    underscored: true
});

/**
 * Radiology Report Templates
 */
const RadiologyTemplate = sequelize.define('RadiologyTemplate', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    template_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    imaging_type: {
        type: DataTypes.ENUM(
            'xray',
            'ultrasound',
            'ct_scan',
            'mri',
            'mammography',
            'fluoroscopy',
            'ecg',
            'doppler',
            'other'
        ),
        allowNull: false
    },
    body_part: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    template_content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'radiology_templates',
    timestamps: true,
    underscored: true
});

// Initialize default exams
RadiologyExam.initializeDefaults = async function () {
    const defaultExams = [
        // X-Ray examinations
        { imaging_type: 'xray', exam_code: 'XR-CHEST', exam_name: 'Chest X-Ray (PA)', body_part: 'Chest', price: 1500 },
        { imaging_type: 'xray', exam_code: 'XR-CHEST-LAT', exam_name: 'Chest X-Ray (Lateral)', body_part: 'Chest', price: 1500 },
        { imaging_type: 'xray', exam_code: 'XR-ABDOMEN', exam_name: 'Abdominal X-Ray', body_part: 'Abdomen', price: 1500 },
        { imaging_type: 'xray', exam_code: 'XR-SKULL', exam_name: 'Skull X-Ray', body_part: 'Head', price: 2000 },
        { imaging_type: 'xray', exam_code: 'XR-SPINE-C', exam_name: 'Cervical Spine X-Ray', body_part: 'Spine', price: 2500 },
        { imaging_type: 'xray', exam_code: 'XR-SPINE-L', exam_name: 'Lumbar Spine X-Ray', body_part: 'Spine', price: 2500 },
        { imaging_type: 'xray', exam_code: 'XR-PELVIS', exam_name: 'Pelvis X-Ray', body_part: 'Pelvis', price: 2000 },
        { imaging_type: 'xray', exam_code: 'XR-HAND', exam_name: 'Hand X-Ray', body_part: 'Upper Limb', price: 1200 },
        { imaging_type: 'xray', exam_code: 'XR-FOOT', exam_name: 'Foot X-Ray', body_part: 'Lower Limb', price: 1200 },
        { imaging_type: 'xray', exam_code: 'XR-KNEE', exam_name: 'Knee X-Ray', body_part: 'Lower Limb', price: 1500 },

        // Ultrasound examinations
        { imaging_type: 'ultrasound', exam_code: 'US-ABD', exam_name: 'Abdominal Ultrasound', body_part: 'Abdomen', price: 3000 },
        { imaging_type: 'ultrasound', exam_code: 'US-PELVIS', exam_name: 'Pelvic Ultrasound', body_part: 'Pelvis', price: 3000 },
        { imaging_type: 'ultrasound', exam_code: 'US-OBS', exam_name: 'Obstetric Ultrasound', body_part: 'Pelvis', price: 3500 },
        { imaging_type: 'ultrasound', exam_code: 'US-THYROID', exam_name: 'Thyroid Ultrasound', body_part: 'Neck', price: 2500 },
        { imaging_type: 'ultrasound', exam_code: 'US-BREAST', exam_name: 'Breast Ultrasound', body_part: 'Chest', price: 3000 },
        { imaging_type: 'ultrasound', exam_code: 'US-PROSTATE', exam_name: 'Prostate Ultrasound', body_part: 'Pelvis', price: 3500 },
        { imaging_type: 'ultrasound', exam_code: 'US-KIDNEY', exam_name: 'Renal Ultrasound', body_part: 'Abdomen', price: 2500 },

        // ECG
        { imaging_type: 'ecg', exam_code: 'ECG-12', exam_name: '12-Lead ECG', body_part: 'Heart', price: 1000 },
        { imaging_type: 'ecg', exam_code: 'ECHO', exam_name: 'Echocardiogram', body_part: 'Heart', price: 5000 },

        // Doppler
        { imaging_type: 'doppler', exam_code: 'DOP-CAROTID', exam_name: 'Carotid Doppler', body_part: 'Neck', price: 4000 },
        { imaging_type: 'doppler', exam_code: 'DOP-VENOUS', exam_name: 'Venous Doppler (Leg)', body_part: 'Lower Limb', price: 4500 }
    ];

    for (const exam of defaultExams) {
        await RadiologyExam.findOrCreate({
            where: { exam_code: exam.exam_code },
            defaults: exam
        });
    }
};

module.exports = {
    RadiologyOrder,
    RadiologyExam,
    RadiologyTemplate
};
