-- =====================================================
-- MASTER MIGRATION SCRIPT
-- Run this file to execute all platform migrations
-- =====================================================
-- 
-- This script combines:
-- 1. Platform schema (hospitals, branches, hospital_modules)
-- 2. Multi-tenancy updates (adding hospital_id to all tables)
--
-- IMPORTANT: Backup your database before running!
-- =====================================================

-- Check MySQL version
SELECT VERSION() as mysql_version;

-- =====================================================
-- PART 1: PLATFORM SCHEMA (from platform_schema.sql)
-- =====================================================

-- Create hospitals table if not exists
CREATE TABLE IF NOT EXISTS hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Unique hospital identifier for URLs',
  logo_path VARCHAR(500) NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Subscription & Billing
  subscription_status ENUM('trial', 'active', 'suspended', 'cancelled') DEFAULT 'trial',
  subscription_plan ENUM('basic', 'professional', 'enterprise') DEFAULT 'basic',
  subscription_start_date DATE,
  subscription_end_date DATE,
  billing_contact_email VARCHAR(255),
  
  -- Settings
  timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
  currency VARCHAR(10) DEFAULT 'KES',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_code (code),
  INDEX idx_subscription_status (subscription_status),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create branches table if not exists
CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL COMMENT 'Branch code within hospital',
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  is_main_branch BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Branch manager/supervisor
  supervisor_id INT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_code (code),
  UNIQUE KEY unique_branch_code (hospital_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create hospital_modules table if not exists
CREATE TABLE IF NOT EXISTS hospital_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  module_code VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  enabled_at TIMESTAMP NULL,
  enabled_by INT NULL,
  configuration JSON NULL COMMENT 'Module-specific settings',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_module_code (module_code),
  UNIQUE KEY unique_hospital_module (hospital_id, module_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extend users table for multi-tenancy
ALTER TABLE users
ADD COLUMN IF NOT EXISTS hospital_id INT NULL AFTER id,
ADD COLUMN IF NOT EXISTS branch_id INT NULL AFTER hospital_id;

-- Add superadmin role if not exists
ALTER TABLE users 
MODIFY COLUMN role 
ENUM('superadmin', 'admin', 'receptionist', 'doctor', 'lab', 'pharmacy', 'nurse', 'supervisor', 'radiologist') 
NOT NULL;

-- Add foreign keys to users (if not exist)
-- Note: Using dynamic SQL to check if constraint exists
SET @constraint_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_NAME = 'fk_users_hospital' 
  AND TABLE_NAME = 'users' 
  AND TABLE_SCHEMA = DATABASE()
);

SET @sql = IF(@constraint_exists = 0, 
  'ALTER TABLE users ADD CONSTRAINT fk_users_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes to users
CREATE INDEX IF NOT EXISTS idx_users_hospital ON users(hospital_id);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);

-- Insert default hospital
INSERT INTO hospitals (name, code, address, phone, subscription_status, subscription_plan, is_active)
VALUES ('Default Hospital', 'DEFAULT', 'Default Address', '0000000000', 'active', 'enterprise', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Get default hospital ID
SET @default_hospital_id = (SELECT id FROM hospitals WHERE code = 'DEFAULT' LIMIT 1);

-- Insert default main branch
INSERT INTO branches (hospital_id, name, code, is_main_branch, is_active)
VALUES (@default_hospital_id, 'Main Branch', 'MAIN', TRUE, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

SET @default_branch_id = (SELECT id FROM branches WHERE hospital_id = @default_hospital_id AND is_main_branch = 1 LIMIT 1);

-- Create superadmin user if not exists
INSERT INTO users (username, password, role, hospital_id)
VALUES ('superadmin', '$2b$10$LJpMSHuJTJq4rGVL6NVJG.5QZ9dJxR4kCM5yDnwIxkfRXa4xU9MCe', 'superadmin', NULL)
ON DUPLICATE KEY UPDATE role = 'superadmin', hospital_id = NULL;

-- Update existing users to default hospital
UPDATE users SET hospital_id = @default_hospital_id, branch_id = @default_branch_id 
WHERE hospital_id IS NULL AND role != 'superadmin';

-- =====================================================
-- PART 2: MULTI-TENANCY COLUMNS
-- =====================================================

-- Helper procedure to add column if not exists
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
  IN p_table_name VARCHAR(64),
  IN p_column_name VARCHAR(64),
  IN p_column_definition VARCHAR(255)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = p_table_name 
    AND COLUMN_NAME = p_column_name
  ) THEN
    SET @sql = CONCAT('ALTER TABLE ', p_table_name, ' ADD COLUMN ', p_column_name, ' ', p_column_definition);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

-- Add hospital_id to all major tables
CALL add_column_if_not_exists('patients', 'hospital_id', 'INT NULL AFTER patient_number');
CALL add_column_if_not_exists('medicines', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('equipment', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('lab_tests', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('ambulances', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('clinics', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('expenses', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('audit_logs', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('cashier_shifts', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('system_settings', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('queue', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('queue', 'branch_id', 'INT NULL AFTER hospital_id');
CALL add_column_if_not_exists('bills', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('bills', 'branch_id', 'INT NULL AFTER hospital_id');
CALL add_column_if_not_exists('lab_orders', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('prescriptions', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('direct_sales', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('direct_sales', 'branch_id', 'INT NULL AFTER hospital_id');
CALL add_column_if_not_exists('referrals', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('ambulance_requests', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('chronic_enrollments', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('clinic_visits', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('follow_ups', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('insurance_claims', 'hospital_id', 'INT NULL AFTER id');
CALL add_column_if_not_exists('vitals', 'hospital_id', 'INT NULL AFTER id');

-- Add hospital_id to radiology tables if they exist
SET @radiology_exams_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'radiology_exams');
SET @radiology_orders_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'radiology_orders');

SET @sql = IF(@radiology_exams_exists > 0, 'CALL add_column_if_not_exists(''radiology_exams'', ''hospital_id'', ''INT NULL AFTER id'')', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@radiology_orders_exists > 0, 'CALL add_column_if_not_exists(''radiology_orders'', ''hospital_id'', ''INT NULL AFTER id'')', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PART 3: ADD INDEXES FOR HOSPITAL_ID COLUMNS
-- =====================================================

-- Helper procedure to create index if not exists
DROP PROCEDURE IF EXISTS create_index_if_not_exists;
DELIMITER //
CREATE PROCEDURE create_index_if_not_exists(
  IN p_table_name VARCHAR(64),
  IN p_index_name VARCHAR(64),
  IN p_column_list VARCHAR(255)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = p_table_name 
    AND INDEX_NAME = p_index_name
  ) THEN
    SET @sql = CONCAT('CREATE INDEX ', p_index_name, ' ON ', p_table_name, '(', p_column_list, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

-- Create indexes on all hospital_id columns
CALL create_index_if_not_exists('patients', 'idx_patients_hospital', 'hospital_id');
CALL create_index_if_not_exists('medicines', 'idx_medicines_hospital', 'hospital_id');
CALL create_index_if_not_exists('equipment', 'idx_equipment_hospital', 'hospital_id');
CALL create_index_if_not_exists('lab_tests', 'idx_lab_tests_hospital', 'hospital_id');
CALL create_index_if_not_exists('ambulances', 'idx_ambulances_hospital', 'hospital_id');
CALL create_index_if_not_exists('clinics', 'idx_clinics_hospital', 'hospital_id');
CALL create_index_if_not_exists('expenses', 'idx_expenses_hospital', 'hospital_id');
CALL create_index_if_not_exists('audit_logs', 'idx_audit_logs_hospital', 'hospital_id');
CALL create_index_if_not_exists('cashier_shifts', 'idx_cashier_shifts_hospital', 'hospital_id');
CALL create_index_if_not_exists('queue', 'idx_queue_hospital', 'hospital_id');
CALL create_index_if_not_exists('bills', 'idx_bills_hospital', 'hospital_id');
CALL create_index_if_not_exists('lab_orders', 'idx_lab_orders_hospital', 'hospital_id');
CALL create_index_if_not_exists('prescriptions', 'idx_prescriptions_hospital', 'hospital_id');
CALL create_index_if_not_exists('direct_sales', 'idx_direct_sales_hospital', 'hospital_id');
CALL create_index_if_not_exists('referrals', 'idx_referrals_hospital', 'hospital_id');
CALL create_index_if_not_exists('ambulance_requests', 'idx_ambulance_requests_hospital', 'hospital_id');
CALL create_index_if_not_exists('chronic_enrollments', 'idx_chronic_enrollments_hospital', 'hospital_id');
CALL create_index_if_not_exists('clinic_visits', 'idx_clinic_visits_hospital', 'hospital_id');
CALL create_index_if_not_exists('follow_ups', 'idx_follow_ups_hospital', 'hospital_id');
CALL create_index_if_not_exists('insurance_claims', 'idx_insurance_claims_hospital', 'hospital_id');
CALL create_index_if_not_exists('vitals', 'idx_vitals_hospital', 'hospital_id');

-- Composite indexes for common queries
CALL create_index_if_not_exists('patients', 'idx_patients_hospital_phone', 'hospital_id, phone');
CALL create_index_if_not_exists('queue', 'idx_queue_hospital_dept', 'hospital_id, department, status');
CALL create_index_if_not_exists('bills', 'idx_bills_hospital_status', 'hospital_id, payment_status');
CALL create_index_if_not_exists('medicines', 'idx_medicines_hospital_name', 'hospital_id, name');


-- Enterprise hot-path composite indexes
CALL create_index_if_not_exists('queue', 'idx_queue_hospital_dept_status_created', 'hospital_id, department, status, created_at');
CALL create_index_if_not_exists('bills', 'idx_bills_hospital_created_status', 'hospital_id, created_at, payment_status');
CALL create_index_if_not_exists('prescriptions', 'idx_prescriptions_hospital_status_created', 'hospital_id, status, created_at');
CALL create_index_if_not_exists('patients', 'idx_patients_hospital_created', 'hospital_id, created_at');

-- =====================================================
-- PART 4: MIGRATE EXISTING DATA TO DEFAULT HOSPITAL
-- =====================================================

-- Update all existing data to belong to default hospital
UPDATE patients SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE medicines SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE equipment SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE lab_tests SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE ambulances SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE clinics SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE expenses SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE queue SET hospital_id = @default_hospital_id, branch_id = @default_branch_id WHERE hospital_id IS NULL;
UPDATE bills SET hospital_id = @default_hospital_id, branch_id = @default_branch_id WHERE hospital_id IS NULL;
UPDATE lab_orders SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE prescriptions SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE direct_sales SET hospital_id = @default_hospital_id, branch_id = @default_branch_id WHERE hospital_id IS NULL;
UPDATE referrals SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE ambulance_requests SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE chronic_enrollments SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE clinic_visits SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE follow_ups SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE insurance_claims SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE vitals SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE cashier_shifts SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE audit_logs SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;

-- Update radiology tables if they exist
SET @sql = IF(@radiology_exams_exists > 0, 
  CONCAT('UPDATE radiology_exams SET hospital_id = ', @default_hospital_id, ' WHERE hospital_id IS NULL'),
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@radiology_orders_exists > 0, 
  CONCAT('UPDATE radiology_orders SET hospital_id = ', @default_hospital_id, ' WHERE hospital_id IS NULL'),
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PART 5: PATIENT NUMBER SETTINGS
-- =====================================================

-- Make system_settings hospital-scoped (unique per hospital)
-- First make setting_key unique per hospital instead of globally
ALTER TABLE system_settings DROP INDEX IF EXISTS idx_setting_key;
ALTER TABLE system_settings DROP INDEX IF EXISTS setting_key;

-- Add unique constraint per hospital
DROP PROCEDURE IF EXISTS add_unique_constraint_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_unique_constraint_if_not_exists(
  IN p_table_name VARCHAR(64),
  IN p_constraint_name VARCHAR(64),
  IN p_column_list VARCHAR(255)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = p_table_name 
    AND CONSTRAINT_NAME = p_constraint_name
  ) THEN
    SET @sql = CONCAT('ALTER TABLE ', p_table_name, ' ADD UNIQUE KEY ', p_constraint_name, '(', p_column_list, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

-- Insert default patient number settings for default hospital
INSERT INTO system_settings (hospital_id, setting_key, setting_value, description) VALUES
(@default_hospital_id, 'patient_number_prefix', 'PAT', 'Prefix for patient numbers (e.g., PAT-001)'),
(@default_hospital_id, 'patient_number_format', 'PREFIX-SEQUENCE', 'Format: PREFIX-SEQUENCE, YEAR-SEQUENCE, PREFIX-YEAR-SEQUENCE'),
(@default_hospital_id, 'patient_number_padding', '5', 'Number of digits (e.g., 5 = 00001)'),
(@default_hospital_id, 'patient_number_start', '1', 'Starting number for sequence'),
(@default_hospital_id, 'patient_number_next', '1', 'Next available patient number'),
(@default_hospital_id, 'patient_number_include_year', 'false', 'Include year in patient number')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);


-- Insert default receipt settings for default hospital
INSERT INTO system_settings (hospital_id, setting_key, setting_value, description) VALUES
(@default_hospital_id, 'receipt_prefix', CONCAT(UPPER(SUBSTRING((SELECT code FROM hospitals WHERE id = @default_hospital_id LIMIT 1), 1, 4)), '-RCP'), 'Prefix for payment receipts'),
(@default_hospital_id, 'receipt_next', '1', 'Next receipt sequence number')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Calculate next patient number based on existing patients
SET @max_patient = (SELECT COALESCE(MAX(id), 0) + 1 FROM patients WHERE hospital_id = @default_hospital_id);
UPDATE system_settings 
SET setting_value = @max_patient
WHERE hospital_id = @default_hospital_id 
AND setting_key = 'patient_number_next';

-- =====================================================
-- PART 6: DEFAULT MODULES FOR DEFAULT HOSPITAL
-- =====================================================

-- Insert default modules for the default hospital
INSERT INTO hospital_modules (hospital_id, module_code, is_enabled, enabled_at) VALUES
(@default_hospital_id, 'core', TRUE, NOW()),
(@default_hospital_id, 'pharmacy', TRUE, NOW()),
(@default_hospital_id, 'laboratory', TRUE, NOW()),
(@default_hospital_id, 'radiology', TRUE, NOW()),
(@default_hospital_id, 'billing', TRUE, NOW()),
(@default_hospital_id, 'inventory', TRUE, NOW()),
(@default_hospital_id, 'attendance', TRUE, NOW()),
(@default_hospital_id, 'ambulance', TRUE, NOW()),
(@default_hospital_id, 'chronicCare', TRUE, NOW()),
(@default_hospital_id, 'insurance', TRUE, NOW()),
(@default_hospital_id, 'expenses', TRUE, NOW()),
(@default_hospital_id, 'referrals', TRUE, NOW()),
(@default_hospital_id, 'audit', TRUE, NOW())
ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled);

-- =====================================================
-- CLEANUP
-- =====================================================

-- Drop helper procedures
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DROP PROCEDURE IF EXISTS create_index_if_not_exists;
DROP PROCEDURE IF EXISTS add_unique_constraint_if_not_exists;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show summary
SELECT 'Migration completed successfully!' as status;

SELECT 
  (SELECT COUNT(*) FROM hospitals) as total_hospitals,
  (SELECT COUNT(*) FROM branches) as total_branches,
  (SELECT COUNT(*) FROM users WHERE role = 'superadmin') as superadmins,
  (SELECT COUNT(*) FROM patients WHERE hospital_id IS NOT NULL) as patients_with_hospital,
  (SELECT COUNT(*) FROM hospital_modules) as module_assignments;
