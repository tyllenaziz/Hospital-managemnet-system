/**
 * Module Configuration
 * Defines all available modules and their default states
 */

const MODULES = {
    // Core Modules (Always Required)
    core: {
        code: 'core',
        name: 'Core System',
        description: 'Patient management, users, queue, vitals',
        enabled: true,
        required: true,
        category: 'core',
        dependencies: []
    },

    // Clinical Modules
    pharmacy: {
        code: 'pharmacy',
        name: 'Pharmacy',
        description: 'Medicine dispensing, prescriptions, direct sales',
        enabled: true,
        required: false,
        category: 'clinical',
        dependencies: ['billing', 'inventory']
    },
    laboratory: {
        code: 'laboratory',
        name: 'Laboratory',
        description: 'Lab tests, sample processing, results',
        enabled: true,
        required: false,
        category: 'clinical',
        dependencies: ['billing']
    },
    radiology: {
        code: 'radiology',
        name: 'Radiology & Imaging',
        description: 'X-Ray, Ultrasound, CT Scan, MRI imaging services',
        enabled: true,
        required: false,
        category: 'clinical',
        dependencies: ['billing']
    },
    chronicCare: {
        code: 'chronicCare',
        name: 'Chronic Care',
        description: 'Long-term condition management, clinics',
        enabled: true,
        required: false,
        category: 'clinical',
        dependencies: []
    },
    referrals: {
        code: 'referrals',
        name: 'Referrals',
        description: 'Patient referrals to other facilities',
        enabled: true,
        required: false,
        category: 'clinical',
        dependencies: []
    },
    followUp: {
        code: 'followUp',
        name: 'Follow-Up',
        description: 'Patient follow-up scheduling and tracking',
        enabled: true,
        required: false,
        category: 'clinical',
        dependencies: []
    },

    // Financial Modules
    billing: {
        code: 'billing',
        name: 'Billing',
        description: 'Invoicing, payments, receipts',
        enabled: true,
        required: true,
        category: 'financial',
        dependencies: []
    },
    insurance: {
        code: 'insurance',
        name: 'Insurance/NHIF',
        description: 'Insurance claims, NHIF/SHA integration',
        enabled: false,
        required: false,
        category: 'financial',
        dependencies: ['billing']
    },
    expenses: {
        code: 'expenses',
        name: 'Expense Management',
        description: 'Track hospital expenses, salaries, utilities',
        enabled: true,
        required: false,
        category: 'financial',
        dependencies: []
    },
    mpesa: {
        code: 'mpesa',
        name: 'M-Pesa Integration',
        description: 'Mobile money payment processing',
        enabled: true,
        required: false,
        category: 'financial',
        dependencies: ['billing']
    },

    // Operations Modules
    inventory: {
        code: 'inventory',
        name: 'Inventory',
        description: 'Stock management, equipment tracking',
        enabled: true,
        required: false,
        category: 'operations',
        dependencies: []
    },
    attendance: {
        code: 'attendance',
        name: 'HR & Attendance',
        description: 'Staff attendance, check-in/out',
        enabled: true,
        required: false,
        category: 'operations',
        dependencies: []
    },
    ambulance: {
        code: 'ambulance',
        name: 'Ambulance Services',
        description: 'Emergency transport, fleet management',
        enabled: false,
        required: false,
        category: 'operations',
        dependencies: []
    },
    audit: {
        code: 'audit',
        name: 'Audit Trail',
        description: 'System activity logging and reports',
        enabled: true,
        required: false,
        category: 'operations',
        dependencies: []
    }
};

// Radiology Sub-modules (Imaging Types)
const RADIOLOGY_SERVICES = {
    xray: {
        code: 'xray',
        name: 'X-Ray',
        description: 'Standard X-Ray imaging',
        enabled: true
    },
    ultrasound: {
        code: 'ultrasound',
        name: 'Ultrasound',
        description: 'Ultrasound/Sonography imaging',
        enabled: true
    },
    ctScan: {
        code: 'ctScan',
        name: 'CT Scan',
        description: 'Computed Tomography scanning',
        enabled: false
    },
    mri: {
        code: 'mri',
        name: 'MRI',
        description: 'Magnetic Resonance Imaging',
        enabled: false
    },
    mammography: {
        code: 'mammography',
        name: 'Mammography',
        description: 'Breast imaging',
        enabled: false
    },
    fluoroscopy: {
        code: 'fluoroscopy',
        name: 'Fluoroscopy',
        description: 'Real-time X-ray imaging',
        enabled: false
    },
    ecg: {
        code: 'ecg',
        name: 'ECG/EKG',
        description: 'Electrocardiogram',
        enabled: true
    }
};

/**
 * Get module by code
 */
function getModule(code) {
    return MODULES[code] || null;
}

/**
 * Get all modules by category
 */
function getModulesByCategory(category) {
    return Object.values(MODULES).filter(m => m.category === category);
}

/**
 * Get all enabled modules
 */
function getEnabledModules() {
    return Object.values(MODULES).filter(m => m.enabled);
}

/**
 * Check if a module is enabled
 */
function isModuleEnabled(code) {
    const module = MODULES[code];
    return module ? module.enabled : false;
}

/**
 * Get module dependencies
 */
function getModuleDependencies(code) {
    const module = MODULES[code];
    return module ? module.dependencies : [];
}

/**
 * Check if all dependencies are met
 */
function areDependenciesMet(code) {
    const deps = getModuleDependencies(code);
    return deps.every(dep => isModuleEnabled(dep));
}

module.exports = {
    MODULES,
    RADIOLOGY_SERVICES,
    getModule,
    getModulesByCategory,
    getEnabledModules,
    isModuleEnabled,
    getModuleDependencies,
    areDependenciesMet
};
