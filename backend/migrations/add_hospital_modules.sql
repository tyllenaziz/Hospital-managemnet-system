-- Hospital Modules: Per-hospital module subscriptions
-- Each hospital can enable/disable modules independently

CREATE TABLE IF NOT EXISTS hospital_modules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hospital_id BIGINT NOT NULL,
    module_code VARCHAR(50) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    enabled_by INT NULL COMMENT 'Super Admin who enabled this module',
    enabled_at TIMESTAMP NULL,
    config_data JSON NULL COMMENT 'Module-specific settings',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hospital_module (hospital_id, module_code),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default modules for all existing hospitals (all enabled by default)
INSERT IGNORE INTO hospital_modules (hospital_id, module_code, module_name, is_enabled)
SELECT h.id, m.module_code, m.module_name, TRUE
FROM hospitals h
CROSS JOIN (
    SELECT 'core' AS module_code, 'Core System' AS module_name UNION ALL
    SELECT 'pharmacy', 'Pharmacy' UNION ALL
    SELECT 'laboratory', 'Laboratory' UNION ALL
    SELECT 'radiology', 'Radiology' UNION ALL
    SELECT 'chronicCare', 'Chronic Care' UNION ALL
    SELECT 'referrals', 'Referrals' UNION ALL
    SELECT 'followUp', 'Follow-Up' UNION ALL
    SELECT 'billing', 'Billing' UNION ALL
    SELECT 'insurance', 'Insurance/NHIF' UNION ALL
    SELECT 'expenses', 'Expenses' UNION ALL
    SELECT 'mpesa', 'M-Pesa Payments' UNION ALL
    SELECT 'inventory', 'Inventory' UNION ALL
    SELECT 'attendance', 'Attendance' UNION ALL
    SELECT 'ambulance', 'Ambulance' UNION ALL
    SELECT 'audit', 'Audit Trail'
) m;
