-- =====================================================
-- MULTI-TENANCY MIGRATION SCRIPT
-- Adds hospital_id scoping to all data tables
-- =====================================================

-- IMPORTANT: Run platform_schema.sql FIRST to create hospitals table
-- This script depends on the hospitals table existing

-- =====================================================
-- STEP 1: ADD HOSPITAL_ID TO CORE TABLES
-- =====================================================

-- 1.1 Patients Table - Scoped to hospital
ALTER TABLE patients
ADD COLUMN hospital_id INT NULL AFTER patient_number,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_hospital_patient_number (hospital_id, patient_number),
ADD CONSTRAINT fk_patients_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Drop unique constraint on patient_number (will be unique per hospital, not globally)
ALTER TABLE patients DROP INDEX patient_number;

-- Make patient_number unique per hospital
ALTER TABLE patients 
ADD UNIQUE KEY unique_patient_number_per_hospital (hospital_id, patient_number);

-- 1.2 Medicines Table - Scoped to hospital
ALTER TABLE medicines
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD CONSTRAINT fk_medicines_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Drop global barcode unique, make unique per hospital
ALTER TABLE medicines DROP INDEX barcode;
ALTER TABLE medicines ADD UNIQUE KEY unique_barcode_per_hospital (hospital_id, barcode);

-- 1.3 Equipment Table - Scoped to hospital
ALTER TABLE equipment
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD CONSTRAINT fk_equipment_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Drop global serial unique, make unique per hospital
ALTER TABLE equipment DROP INDEX serial_number;
ALTER TABLE equipment ADD UNIQUE KEY unique_serial_per_hospital (hospital_id, serial_number);

-- 1.4 Lab Tests Catalog - Scoped to hospital
ALTER TABLE lab_tests
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD CONSTRAINT fk_lab_tests_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Drop global test_code unique, make unique per hospital
ALTER TABLE lab_tests DROP INDEX test_code;
ALTER TABLE lab_tests ADD UNIQUE KEY unique_test_code_per_hospital (hospital_id, test_code);

-- 1.5 Ambulances Table - Scoped to hospital
ALTER TABLE ambulances
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD CONSTRAINT fk_ambulances_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Drop global unique, make unique per hospital
ALTER TABLE ambulances DROP INDEX ambulance_number;
ALTER TABLE ambulances ADD UNIQUE KEY unique_ambulance_per_hospital (hospital_id, ambulance_number);

-- 1.6 Clinics (Chronic Care) - Scoped to hospital
ALTER TABLE clinics
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD CONSTRAINT fk_clinics_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Drop global unique, make unique per hospital
ALTER TABLE clinics DROP INDEX code;
ALTER TABLE clinics ADD UNIQUE KEY unique_clinic_code_per_hospital (hospital_id, code);

-- 1.7 Expenses Table - Scoped to hospital
ALTER TABLE expenses
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD CONSTRAINT fk_expenses_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- 1.8 Audit Logs - Scoped to hospital (optional, for filtering)
ALTER TABLE audit_logs
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id);

-- 1.9 Cashier Shifts - Scoped to hospital
ALTER TABLE cashier_shifts
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD CONSTRAINT fk_cashier_shifts_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- 1.10 Insurance Providers - Scoped to hospital (or can be shared)
-- Keep global for now but add hospital_id for custom providers
ALTER TABLE insurance_providers
ADD COLUMN hospital_id INT NULL AFTER id COMMENT 'NULL for global providers, set for hospital-specific',
ADD INDEX idx_hospital_id (hospital_id);

-- =====================================================
-- STEP 2: SYSTEM SETTINGS - HOSPITAL SCOPED
-- =====================================================

-- System settings become hospital-specific
ALTER TABLE system_settings
ADD COLUMN hospital_id INT NULL AFTER id,
DROP INDEX idx_setting_key,
ADD INDEX idx_hospital_setting (hospital_id, setting_key),
ADD UNIQUE KEY unique_setting_per_hospital (hospital_id, setting_key),
ADD CONSTRAINT fk_system_settings_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 3: PATIENT NUMBER CONFIGURATION
-- =====================================================

-- Hospital-specific patient number settings
INSERT INTO system_settings (hospital_id, setting_key, setting_value, description) 
SELECT id, 'patient_number_prefix', 'PAT', 'Prefix for patient numbers (e.g., PAT-001)'
FROM hospitals
ON DUPLICATE KEY UPDATE setting_value = setting_value;

INSERT INTO system_settings (hospital_id, setting_key, setting_value, description) 
SELECT id, 'patient_number_format', 'PREFIX-SEQUENCE', 'Format: PREFIX-SEQUENCE, YEAR-SEQUENCE, SEQUENCE'
FROM hospitals
ON DUPLICATE KEY UPDATE setting_value = setting_value;

INSERT INTO system_settings (hospital_id, setting_key, setting_value, description) 
SELECT id, 'patient_number_padding', '5', 'Number of digits (e.g., 5 = 00001)'
FROM hospitals
ON DUPLICATE KEY UPDATE setting_value = setting_value;

INSERT INTO system_settings (hospital_id, setting_key, setting_value, description) 
SELECT id, 'patient_number_start', '1', 'Starting number for sequence'
FROM hospitals
ON DUPLICATE KEY UPDATE setting_value = setting_value;

INSERT INTO system_settings (hospital_id, setting_key, setting_value, description) 
SELECT id, 'patient_number_next', '1', 'Next available patient number'
FROM hospitals
ON DUPLICATE KEY UPDATE setting_value = setting_value;

INSERT INTO system_settings (hospital_id, setting_key, setting_value, description) 
SELECT id, 'patient_number_include_year', 'false', 'Include year in patient number'
FROM hospitals
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- =====================================================
-- STEP 4: ADD BRANCH_ID TO RELEVANT TABLES
-- =====================================================

-- Queue can be branch-specific
ALTER TABLE queue
ADD COLUMN hospital_id INT NULL AFTER id,
ADD COLUMN branch_id INT NULL AFTER hospital_id,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_branch_id (branch_id),
ADD INDEX idx_hospital_branch (hospital_id, branch_id),
ADD CONSTRAINT fk_queue_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_queue_branch 
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- Bills can be branch-specific
ALTER TABLE bills
ADD COLUMN hospital_id INT NULL AFTER id,
ADD COLUMN branch_id INT NULL AFTER hospital_id,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_branch_id (branch_id),
ADD CONSTRAINT fk_bills_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_bills_branch 
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- =====================================================
-- STEP 5: COMPOSITE INDEXES FOR PERFORMANCE
-- =====================================================

-- Patients table - common queries
ALTER TABLE patients
ADD INDEX idx_hospital_name (hospital_id, name),
ADD INDEX idx_hospital_phone (hospital_id, phone),
ADD INDEX idx_hospital_id_number (hospital_id, id_number);

-- Queue table - common queries 
ALTER TABLE queue
ADD INDEX idx_hospital_dept_status (hospital_id, department, status),
ADD INDEX idx_hospital_date (hospital_id, created_at);

-- Medicines table - inventory queries
ALTER TABLE medicines
ADD INDEX idx_hospital_name (hospital_id, name),
ADD INDEX idx_hospital_stock (hospital_id, stock),
ADD INDEX idx_hospital_expiry (hospital_id, expiry_date);

-- Bills table - financial queries
ALTER TABLE bills
ADD INDEX idx_hospital_status (hospital_id, payment_status),
ADD INDEX idx_hospital_date (hospital_id, created_at);

-- Lab Orders - department queries
ALTER TABLE lab_orders
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_hospital_status (hospital_id, status),
ADD CONSTRAINT fk_lab_orders_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Prescriptions - pharmacy queries
ALTER TABLE prescriptions
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_hospital_status (hospital_id, status),
ADD CONSTRAINT fk_prescriptions_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Direct Sales - inventory/sales queries
ALTER TABLE direct_sales
ADD COLUMN hospital_id INT NULL AFTER id,
ADD COLUMN branch_id INT NULL AFTER hospital_id,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_hospital_date (hospital_id, sale_date),
ADD CONSTRAINT fk_direct_sales_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Referrals
ALTER TABLE referrals
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_hospital_status (hospital_id, status),
ADD CONSTRAINT fk_referrals_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Ambulance Requests
ALTER TABLE ambulance_requests
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_hospital_status (hospital_id, status),
ADD CONSTRAINT fk_ambulance_requests_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Chronic Enrollments
ALTER TABLE chronic_enrollments
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_hospital_status (hospital_id, status),
ADD CONSTRAINT fk_chronic_enrollments_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Clinic Visits
ALTER TABLE clinic_visits
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_hospital_date (hospital_id, visit_date),
ADD CONSTRAINT fk_clinic_visits_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Follow Ups
ALTER TABLE follow_ups
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_hospital_date (hospital_id, scheduled_date),
ADD INDEX idx_hospital_status (hospital_id, status),
ADD CONSTRAINT fk_follow_ups_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Insurance Claims
ALTER TABLE insurance_claims
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_hospital_status (hospital_id, status),
ADD CONSTRAINT fk_insurance_claims_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- Vitals
ALTER TABLE vitals
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD CONSTRAINT fk_vitals_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 6: MIGRATE EXISTING DATA TO DEFAULT HOSPITAL
-- =====================================================

-- Get the default hospital ID
SET @default_hospital_id = (SELECT id FROM hospitals WHERE code = 'DEFAULT' LIMIT 1);
SET @default_branch_id = (SELECT id FROM branches WHERE hospital_id = @default_hospital_id AND is_main_branch = 1 LIMIT 1);

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

-- =====================================================
-- STEP 7: MAKE HOSPITAL_ID NOT NULL (After migration)
-- =====================================================

-- Uncomment these after verifying data migration is successful
-- ALTER TABLE patients MODIFY COLUMN hospital_id INT NOT NULL;
-- ALTER TABLE medicines MODIFY COLUMN hospital_id INT NOT NULL;
-- ALTER TABLE equipment MODIFY COLUMN hospital_id INT NOT NULL;
-- etc...

-- =====================================================
-- STEP 8: RADIOLOGY TABLES
-- =====================================================

-- Radiology Exams - Hospital scoped
ALTER TABLE radiology_exams
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id);

-- Radiology Orders - Hospital scoped
ALTER TABLE radiology_orders
ADD COLUMN hospital_id INT NULL AFTER id,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_hospital_status (hospital_id, status);

-- Update radiology data
UPDATE radiology_exams SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;
UPDATE radiology_orders SET hospital_id = @default_hospital_id WHERE hospital_id IS NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all tables have hospital_id populated
SELECT 'patients' as table_name, COUNT(*) as null_count FROM patients WHERE hospital_id IS NULL
UNION ALL SELECT 'medicines', COUNT(*) FROM medicines WHERE hospital_id IS NULL
UNION ALL SELECT 'equipment', COUNT(*) FROM equipment WHERE hospital_id IS NULL
UNION ALL SELECT 'lab_tests', COUNT(*) FROM lab_tests WHERE hospital_id IS NULL
UNION ALL SELECT 'queue', COUNT(*) FROM queue WHERE hospital_id IS NULL
UNION ALL SELECT 'bills', COUNT(*) FROM bills WHERE hospital_id IS NULL;

-- Verify indexes exist
SHOW INDEX FROM patients WHERE Key_name LIKE '%hospital%';
SHOW INDEX FROM queue WHERE Key_name LIKE '%hospital%';
SHOW INDEX FROM medicines WHERE Key_name LIKE '%hospital%';
