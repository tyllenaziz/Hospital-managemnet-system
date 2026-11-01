-- ============================================================================
-- BENSMMA HOSPITAL MANAGEMENT INFORMATION SYSTEM (HMIS)
-- MASTER DATABASE SCHEMA — Production-Ready Consolidated Script
-- ============================================================================
-- Target Engine  : MySQL 8.0+ / MariaDB 10.5+
-- Character Set  : utf8mb4 (full Unicode support)
-- Collation      : utf8mb4_unicode_ci
-- Idempotent     : YES — safe to run on a fresh or existing database
-- ============================================================================
-- This script consolidates ALL tables from:
--   backend/schema.sql, backend/migrations/*, backend/scripts/setupDatabase.js,
--   backend/scripts/fixMissingTables.js, backend/scripts/fixRadiologyTable.js,
--   backend/mpesa_migration.sql, backend/diagnosis_codes.sql, backend/lab_tests.sql
-- ============================================================================

SET NAMES utf8mb4;
SET @OLD_TIME_ZONE = @@SESSION.time_zone;
SET time_zone = '+03:00';
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;
SET @OLD_SQL_MODE = @@SQL_MODE;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ============================================================================
-- SECTION 1: PLATFORM / MULTI-TENANCY TABLES
-- ============================================================================

-- 1.1 Hospitals (root multi-tenant entity)
CREATE TABLE IF NOT EXISTS hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL COMMENT 'Unique hospital identifier for URLs',
  logo_path VARCHAR(500) NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  subscription_status ENUM('trial','active','suspended','cancelled') DEFAULT 'trial',
  subscription_plan ENUM('basic','professional','enterprise') DEFAULT 'basic',
  subscription_start_date DATE NULL,
  subscription_end_date DATE NULL,
  billing_contact_email VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
  currency VARCHAR(10) DEFAULT 'KES',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uk_hospital_code (code),
  INDEX idx_code (code),
  INDEX idx_subscription_status (subscription_status),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 Branches
CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  is_main_branch BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  supervisor_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_code (code),
  UNIQUE KEY unique_branch_code (hospital_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.3 Hospital Modules
CREATE TABLE IF NOT EXISTS hospital_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  module_code VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  enabled_at TIMESTAMP NULL,
  enabled_by INT NULL,
  configuration JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_module_code (module_code),
  UNIQUE KEY unique_hospital_module (hospital_id, module_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 2: CORE TABLES
-- ============================================================================

-- 2.1 Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  branch_id INT NULL,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin','admin','receptionist','doctor','lab','pharmacy','nurse','supervisor','radiologist') NOT NULL,
  phone VARCHAR(20) NULL,
  refresh_token TEXT NULL,
  lastLogin TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uk_username (username),
  INDEX idx_username (username),
  INDEX idx_role (role),
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_branch_id (branch_id),
  CONSTRAINT fk_users_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
  CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2 Patients
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_number VARCHAR(50),
  hospital_id INT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  alternative_phone VARCHAR(20),
  email VARCHAR(255),
  age INT NOT NULL,
  gender ENUM('Male','Female','Other') NOT NULL,
  id_number VARCHAR(50) NOT NULL,
  next_of_kin_name VARCHAR(255),
  next_of_kin_phone VARCHAR(20),
  next_of_kin_relationship VARCHAR(100),
  county VARCHAR(100),
  town VARCHAR(100),
  address TEXT,
  house_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_phone (phone),
  INDEX idx_id_number (id_number),
  INDEX idx_email (email),
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_patient_number (patient_number),
  INDEX idx_patients_hospital_created (hospital_id, created_at),
  UNIQUE KEY unique_patient_per_hospital (hospital_id, id_number),
  CONSTRAINT fk_patients_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3 System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  setting_key VARCHAR(50) NOT NULL,
  setting_value TEXT NOT NULL,
  description VARCHAR(255),
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hospital_setting (hospital_id, setting_key),
  UNIQUE KEY unique_setting_per_hospital (hospital_id, setting_key),
  CONSTRAINT fk_settings_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 3: CLINICAL WORKFLOW
-- ============================================================================

-- 3.1 Queue
CREATE TABLE IF NOT EXISTS queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  branch_id INT NULL,
  patient_id INT NOT NULL,
  department ENUM('doctor','nurse','lab','pharmacy','billing') NOT NULL,
  assigned_to INT NULL,
  status ENUM('waiting','in_progress','done','cancelled') DEFAULT 'waiting',
  queue_number VARCHAR(10) NOT NULL,
  notes TEXT NULL,
  diagnosis TEXT NULL,
  prescription TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_department_status (department, status),
  INDEX idx_created_at (created_at),
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_hospital_dept_status (hospital_id, department, status),
  INDEX idx_queue_hospital_dept_status_created (hospital_id, department, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.2 Vitals
CREATE TABLE IF NOT EXISTS vitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  queue_id INT NOT NULL,
  patient_id INT NOT NULL,
  recorded_by INT NOT NULL,
  blood_pressure_systolic DECIMAL(5,2) NULL,
  blood_pressure_diastolic DECIMAL(5,2) NULL,
  temperature DECIMAL(4,2) NULL,
  pulse_rate INT NULL,
  respiratory_rate INT NULL,
  weight DECIMAL(5,2) NULL,
  height DECIMAL(5,2) NULL,
  blood_sugar DECIMAL(5,2) NULL,
  oxygen_saturation INT NULL,
  bmi DECIMAL(5,2) NULL,
  notes TEXT NULL,
  drug_allergies TEXT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id),
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_queue_id (queue_id),
  INDEX idx_patient_id (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 4: PHARMACY / INVENTORY
-- ============================================================================

-- 4.1 Medicines
CREATE TABLE IF NOT EXISTS medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  name VARCHAR(255) NOT NULL,
  barcode VARCHAR(100) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_barcode (barcode),
  INDEX idx_expiry (expiry_date),
  INDEX idx_name (name),
  UNIQUE KEY unique_barcode_per_hospital (hospital_id, barcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.2 Equipment
CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(100) NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_price DECIMAL(10,2) DEFAULT 0,
  quantity INT DEFAULT 1,
  warranty_expiry DATE NULL,
  status ENUM('active','maintenance','retired','broken') DEFAULT 'active',
  location VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_serial_number (serial_number),
  INDEX idx_status (status),
  UNIQUE KEY unique_serial_per_hospital (hospital_id, serial_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 5: PRESCRIPTIONS & SALES
-- ============================================================================

-- 5.1 Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  queue_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NULL,
  notes TEXT,
  diagnosis TEXT,
  status ENUM('pending','dispensed','cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_hospital_status (hospital_id, status),
  INDEX idx_status (status),
  INDEX idx_patient_id (patient_id),
  INDEX idx_prescriptions_hospital_status_created (hospital_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.2 Prescription Items
CREATE TABLE IF NOT EXISTS prescription_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prescription_id INT NOT NULL,
  medicine_id INT NULL,
  custom_medicine_name VARCHAR(255) NULL,
  custom_price DECIMAL(10,2) NULL,
  quantity INT NOT NULL,
  dosage VARCHAR(255),
  duration VARCHAR(100),
  instructions TEXT,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  INDEX idx_prescription_id (prescription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.3 Sales (prescription-based)
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  prescription_id INT NOT NULL,
  pharmacist_id INT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash','card','insurance','mpesa') DEFAULT 'cash',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (pharmacist_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.4 Sales Items
CREATE TABLE IF NOT EXISTS sales_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  medicine_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  INDEX idx_sale_id (sale_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.5 Direct Sales (OTC / walk-in)
CREATE TABLE IF NOT EXISTS direct_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  branch_id INT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  sold_by INT NULL,
  sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (sold_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_sale_date (sale_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.6 Direct Sale Items
CREATE TABLE IF NOT EXISTS direct_sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  medicine_id INT NULL,
  medicine_name VARCHAR(255),
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NULL,
  total DECIMAL(10,2) NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (sale_id) REFERENCES direct_sales(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  INDEX idx_sale_id (sale_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 6: LABORATORY
-- ============================================================================

-- 6.1 Lab Tests Catalog
CREATE TABLE IF NOT EXISTS lab_tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  test_name VARCHAR(255) NOT NULL,
  test_code VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  normal_range TEXT,
  unit VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_test_code (test_code),
  INDEX idx_category (category),
  UNIQUE KEY unique_test_code_per_hospital (hospital_id, test_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.2 Lab Orders
CREATE TABLE IF NOT EXISTS lab_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  queue_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NULL,
  status ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_hospital_status (hospital_id, status),
  INDEX idx_status (status),
  INDEX idx_patient_id (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.3 Lab Order Items
CREATE TABLE IF NOT EXISTS lab_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lab_order_id INT NOT NULL,
  lab_test_id INT NOT NULL,
  status ENUM('pending','completed') DEFAULT 'pending',
  FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE CASCADE,
  INDEX idx_lab_order_id (lab_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.4 Lab Test Parameters
CREATE TABLE IF NOT EXISTS lab_test_parameters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lab_test_id INT NOT NULL,
  parameter_name VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  normal_range VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE CASCADE,
  INDEX idx_lab_test_id (lab_test_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.5 Lab Results
CREATE TABLE IF NOT EXISTS lab_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lab_order_item_id INT NOT NULL,
  lab_test_parameter_id INT NOT NULL,
  result_value VARCHAR(255),
  remarks TEXT,
  is_abnormal BOOLEAN DEFAULT FALSE,
  tested_by INT NULL,
  tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lab_order_item_id) REFERENCES lab_order_items(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_test_parameter_id) REFERENCES lab_test_parameters(id) ON DELETE CASCADE,
  FOREIGN KEY (tested_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 7: RADIOLOGY
-- ============================================================================

-- 7.1 Radiology Exams Catalog
CREATE TABLE IF NOT EXISTS radiology_exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  imaging_type ENUM('xray','ultrasound','ct_scan','mri','mammography','fluoroscopy','ecg','doppler','other') NOT NULL DEFAULT 'xray',
  exam_code VARCHAR(50) NOT NULL,
  exam_name VARCHAR(255) NOT NULL,
  body_part VARCHAR(100) NOT NULL DEFAULT 'General',
  category VARCHAR(100),
  modality ENUM('X-Ray','Ultrasound','CT','MRI','Mammography','Fluoroscopy','ECG') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INT DEFAULT 30,
  description TEXT,
  preparation_instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_modality (modality),
  UNIQUE KEY unique_exam_per_hospital (hospital_id, exam_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7.2 Radiology Orders
CREATE TABLE IF NOT EXISTS radiology_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  queue_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NULL,
  exam_id INT NOT NULL,
  clinical_indication TEXT,
  priority ENUM('routine','urgent','stat') DEFAULT 'routine',
  status ENUM('pending','scheduled','in_progress','completed','cancelled') DEFAULT 'pending',
  scheduled_at TIMESTAMP NULL,
  performed_by INT NULL,
  performed_at TIMESTAMP NULL,
  findings TEXT,
  impression TEXT,
  recommendations TEXT,
  reported_by INT NULL,
  reported_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (exam_id) REFERENCES radiology_exams(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_hospital_status (hospital_id, status),
  INDEX idx_status (status),
  INDEX idx_patient_id (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7.3 Radiology Templates
CREATE TABLE IF NOT EXISTS radiology_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_name VARCHAR(255) NOT NULL,
  imaging_type ENUM('xray','ultrasound','ct_scan','mri','mammography','fluoroscopy','ecg','doppler','other') NOT NULL,
  body_part VARCHAR(100),
  template_content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 8: BILLING & PAYMENTS
-- ============================================================================

-- 8.1 Bills
CREATE TABLE IF NOT EXISTS bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  branch_id INT NULL,
  patient_id INT NOT NULL,
  queue_id INT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  lab_fee DECIMAL(10,2) DEFAULT 0,
  pharmacy_fee DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('pending','partial','paid') DEFAULT 'pending',
  payment_method ENUM('cash','card','insurance','mpesa') DEFAULT 'cash',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_hospital_status (hospital_id, payment_status),
  INDEX idx_patient_id (patient_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created_at (created_at),
  INDEX idx_bills_hospital_created_status (hospital_id, created_at, payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8.2 Bill Items
CREATE TABLE IF NOT EXISTS bill_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  queue_id INT NULL,
  medicine_id INT NULL,
  custom_medicine_name VARCHAR(255) NULL,
  item_type ENUM('consultation','lab_test','medicine','radiology') NOT NULL,
  item_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL,
  INDEX idx_bill_id (bill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8.3 Payments
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash','card','insurance','mpesa') NOT NULL,
  reference_number VARCHAR(100),
  transaction_code VARCHAR(100) NULL,
  status ENUM('pending','completed','failed','refunded') DEFAULT 'completed',
  received_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
  FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_bill_id (bill_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8.4 M-Pesa Transactions
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  checkout_request_id VARCHAR(100) NOT NULL,
  merchant_request_id VARCHAR(100),
  phone VARCHAR(15) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  bill_id INT NOT NULL,
  status ENUM('pending','completed','failed','cancelled') DEFAULT 'pending',
  mpesa_receipt VARCHAR(50),
  transaction_date VARCHAR(20),
  result_code INT,
  result_desc VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_checkout_request (checkout_request_id),
  INDEX idx_checkout_request_id (checkout_request_id),
  INDEX idx_bill_id (bill_id),
  INDEX idx_hospital_id (hospital_id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 9: AMBULANCE
-- ============================================================================

-- 9.1 Ambulances
CREATE TABLE IF NOT EXISTS ambulances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  ambulance_number VARCHAR(50) NOT NULL,
  type ENUM('Basic','Advanced','Mobile ICU','Neonatal') NOT NULL,
  status ENUM('Available','On Call','On Trip','Maintenance') DEFAULT 'Available',
  driver_name VARCHAR(255) NOT NULL,
  driver_phone VARCHAR(20) NOT NULL,
  capacity INT NOT NULL,
  equipment TEXT,
  location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_status (status),
  UNIQUE KEY unique_ambulance_per_hospital (hospital_id, ambulance_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9.2 Ambulance Requests
CREATE TABLE IF NOT EXISTS ambulance_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  patient_id INT NOT NULL,
  requested_by INT NOT NULL,
  request_direction ENUM('INCOMING','OUTGOING') NOT NULL DEFAULT 'OUTGOING',
  requester_type ENUM('INTERNAL','EXTERNAL') DEFAULT 'INTERNAL',
  approved_by INT NULL,
  ambulance_id INT NULL,
  request_type ENUM('Referral','Emergency','Transfer','Pharmacy Pickup') NOT NULL,
  priority ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  patient_name VARCHAR(100),
  patient_phone VARCHAR(20),
  status ENUM('Pending','Approved','Assigned','Dispatched','On Route','At Pickup','On Return','Completed','Cancelled') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_hospital_status (hospital_id, status),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 10: REFERRALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  queue_id INT NULL,
  referring_hospital VARCHAR(255) NOT NULL,
  referred_to_hospital VARCHAR(255) NOT NULL,
  referred_to_department VARCHAR(255),
  referral_reason TEXT NOT NULL,
  clinical_summary TEXT NOT NULL,
  diagnosis TEXT,
  patient_condition ENUM('Stable','Critical','Urgent','Emergency') DEFAULT 'Stable',
  status ENUM('Pending','Accepted','Rejected','Completed','Cancelled') DEFAULT 'Pending',
  priority ENUM('Routine','Urgent','Emergency') DEFAULT 'Routine',
  referral_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_hospital_status (hospital_id, status),
  INDEX idx_patient_id (patient_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 11: CHRONIC CARE
-- ============================================================================

-- 11.1 Clinics
CREATE TABLE IF NOT EXISTS clinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT,
  default_follow_up_days INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  UNIQUE KEY unique_clinic_per_hospital (hospital_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11.2 Chronic Enrollments
CREATE TABLE IF NOT EXISTS chronic_enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  patient_id INT NOT NULL,
  clinic_id INT NOT NULL,
  enrolled_by INT NULL,
  enrollment_date DATE NOT NULL,
  status ENUM('active','discharged','transferred','deceased','lost_to_follow_up') DEFAULT 'active',
  baseline_notes TEXT,
  discharge_date DATE NULL,
  discharge_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (enrolled_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_clinic_id (clinic_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11.3 Clinic Visits
CREATE TABLE IF NOT EXISTS clinic_visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  enrollment_id INT NOT NULL,
  patient_id INT NOT NULL,
  clinic_id INT NOT NULL,
  visit_date DATE NOT NULL,
  visit_type ENUM('scheduled','walk_in','emergency') DEFAULT 'scheduled',
  recorded_by INT NULL,
  blood_pressure_systolic DECIMAL(5,2) NULL,
  blood_pressure_diastolic DECIMAL(5,2) NULL,
  blood_sugar DECIMAL(5,2) NULL,
  weight DECIMAL(5,2) NULL,
  is_abnormal BOOLEAN DEFAULT FALSE,
  nurse_notes TEXT,
  doctor_notes TEXT,
  status ENUM('recorded','reviewed','escalated','completed') DEFAULT 'recorded',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollment_id) REFERENCES chronic_enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_visit_date (visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11.4 Follow-Ups
CREATE TABLE IF NOT EXISTS follow_ups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  patient_id INT NOT NULL,
  enrollment_id INT NULL,
  clinic_id INT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NULL,
  purpose VARCHAR(255) NOT NULL,
  department ENUM('nurse','doctor','lab') NOT NULL DEFAULT 'nurse',
  scheduled_by INT NULL,
  notes TEXT,
  status ENUM('scheduled','completed','missed','cancelled','rescheduled') DEFAULT 'scheduled',
  completed_at TIMESTAMP NULL,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollment_id) REFERENCES chronic_enrollments(id) ON DELETE SET NULL,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL,
  FOREIGN KEY (scheduled_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_scheduled_date (scheduled_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 12: EXPENSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category ENUM('doctor_salary','staff_payment','misc') NOT NULL,
  paid_to VARCHAR(255) NOT NULL,
  related_user_id INT NULL,
  expense_date DATE NOT NULL,
  payment_method ENUM('cash','bank','mpesa','cheque') DEFAULT 'cash',
  reference_number VARCHAR(100),
  notes TEXT,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_category (category),
  INDEX idx_expense_date (expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 13: AUDIT & CASHIER
-- ============================================================================

-- 13.1 Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  user_id INT NULL,
  username VARCHAR(100),
  user_role VARCHAR(50),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NULL,
  description TEXT,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13.2 Cashier Shifts
CREATE TABLE IF NOT EXISTS cashier_shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  user_id INT NOT NULL,
  shift_date DATE NOT NULL,
  opening_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closing_time TIMESTAMP NULL,
  opening_balance DECIMAL(12,2) DEFAULT 0,
  expected_cash DECIMAL(12,2) DEFAULT 0,
  expected_mpesa DECIMAL(12,2) DEFAULT 0,
  expected_card DECIMAL(12,2) DEFAULT 0,
  total_expected DECIMAL(12,2) DEFAULT 0,
  actual_cash DECIMAL(12,2) NULL,
  actual_mpesa DECIMAL(12,2) NULL,
  actual_card DECIMAL(12,2) NULL,
  cash_variance DECIMAL(12,2) NULL,
  total_transactions INT DEFAULT 0,
  status ENUM('open','closed','verified','disputed') DEFAULT 'open',
  cashier_notes TEXT,
  verified_by INT NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_user_date (user_id, shift_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13.3 Shift Transactions
CREATE TABLE IF NOT EXISTS shift_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shift_id INT NOT NULL,
  transaction_type ENUM('payment','refund','void','float_in','float_out') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('cash','mpesa','card','insurance') NOT NULL,
  reference_type VARCHAR(50),
  reference_id INT NULL,
  patient_id INT NULL,
  patient_name VARCHAR(255),
  description TEXT,
  receipt_number VARCHAR(50),
  mpesa_code VARCHAR(50) NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id) REFERENCES cashier_shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_shift (shift_id),
  INDEX idx_payment_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 14: INSURANCE
-- ============================================================================

-- 14.1 Insurance Providers
CREATE TABLE IF NOT EXISTS insurance_providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL COMMENT 'NULL for global providers',
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('government','private','corporate') NOT NULL DEFAULT 'private',
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  requires_preauth BOOLEAN DEFAULT FALSE,
  payment_terms_days INT DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hospital_id (hospital_id),
  UNIQUE KEY unique_provider_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14.2 Patient Insurance
CREATE TABLE IF NOT EXISTS patient_insurance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  provider_id INT NOT NULL,
  member_number VARCHAR(100) NOT NULL,
  member_name VARCHAR(255),
  relationship ENUM('self','spouse','child','parent','dependent') DEFAULT 'self',
  national_id VARCHAR(20),
  scheme_name VARCHAR(255),
  coverage_start_date DATE,
  coverage_end_date DATE,
  annual_limit DECIMAL(12,2),
  is_verified BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES insurance_providers(id),
  INDEX idx_patient (patient_id),
  INDEX idx_member_number (member_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14.3 Insurance Claims
CREATE TABLE IF NOT EXISTS insurance_claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  claim_number VARCHAR(50) NOT NULL,
  patient_id INT NOT NULL,
  patient_insurance_id INT NOT NULL,
  provider_id INT NOT NULL,
  claim_type ENUM('outpatient','inpatient','maternity','dental','optical','pharmacy','lab','procedure') NOT NULL,
  service_date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  approved_amount DECIMAL(12,2) DEFAULT 0,
  copay_amount DECIMAL(12,2) DEFAULT 0,
  claimed_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('draft','pending','submitted','processing','approved','partially_approved','rejected','paid','cancelled') DEFAULT 'draft',
  submitted_at TIMESTAMP NULL,
  submitted_by INT NULL,
  rejection_reason TEXT,
  payment_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uk_claim_number (claim_number),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_insurance_id) REFERENCES patient_insurance(id),
  FOREIGN KEY (provider_id) REFERENCES insurance_providers(id),
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_hospital_status (hospital_id, status),
  INDEX idx_patient (patient_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14.4 Claim Items
CREATE TABLE IF NOT EXISTS claim_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  claim_id INT NOT NULL,
  service_description VARCHAR(255) NOT NULL,
  service_date DATE NOT NULL,
  quantity INT DEFAULT 1,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  approved_amount DECIMAL(12,2) DEFAULT 0,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (claim_id) REFERENCES insurance_claims(id) ON DELETE CASCADE,
  INDEX idx_claim_id (claim_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14.5 Preauthorizations
CREATE TABLE IF NOT EXISTS preauthorizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NULL,
  patient_id INT NOT NULL,
  patient_insurance_id INT NOT NULL,
  provider_id INT NOT NULL,
  preauth_number VARCHAR(50),
  service_type VARCHAR(100) NOT NULL,
  diagnosis TEXT,
  estimated_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  approved_amount DECIMAL(12,2) DEFAULT 0,
  status ENUM('pending','approved','rejected','expired') DEFAULT 'pending',
  valid_from DATE NULL,
  valid_until DATE NULL,
  requested_by INT NULL,
  approved_by_provider VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_insurance_id) REFERENCES patient_insurance(id),
  FOREIGN KEY (provider_id) REFERENCES insurance_providers(id),
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_patient (patient_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 15: DIAGNOSIS & CLINICAL CODING
-- ============================================================================

-- 15.1 Diagnosis Codes (ICD-10)
CREATE TABLE IF NOT EXISTS diagnosis_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  is_common BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_diag_code (code),
  INDEX idx_code (code),
  INDEX idx_category (category),
  FULLTEXT idx_search (code, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15.2 Prescription Diagnoses (junction table)
CREATE TABLE IF NOT EXISTS prescription_diagnoses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prescription_id INT NOT NULL,
  diagnosis_code_id INT NULL,
  custom_diagnosis TEXT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (diagnosis_code_id) REFERENCES diagnosis_codes(id) ON DELETE SET NULL,
  INDEX idx_prescription_id (prescription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 16: SYNC TABLES (offline/localbridge support)
-- ============================================================================

-- 16.1 Sync Queue
CREATE TABLE IF NOT EXISTS sync_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operation_type ENUM('create','update','delete') NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  payload JSON,
  status ENUM('pending','syncing','synced','failed','conflict') DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  error_message TEXT,
  local_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16.2 Sync Metadata
CREATE TABLE IF NOT EXISTS sync_metadata (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  last_sync_timestamp TIMESTAMP NULL,
  last_server_cursor VARCHAR(255),
  sync_status ENUM('idle','syncing','error') DEFAULT 'idle',
  records_synced INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_entity_type (entity_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16.3 Sync Conflicts
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  local_data JSON,
  server_data JSON,
  conflict_type ENUM('update_conflict','delete_conflict','create_conflict') NOT NULL,
  resolution ENUM('pending','local_wins','server_wins','merged','skipped') DEFAULT 'pending',
  resolved_by INT NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_resolution (resolution)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 17: CONFIGURATION TABLES
-- ============================================================================

-- 17.1 Module Config (global module definitions)
CREATE TABLE IF NOT EXISTS module_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_code VARCHAR(50) NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  description TEXT,
  category ENUM('core','clinical','financial','operations') DEFAULT 'clinical',
  is_enabled BOOLEAN DEFAULT FALSE,
  is_required BOOLEAN DEFAULT FALSE,
  config_data JSON,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_module_code (module_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17.2 Hospital Config (legacy branding/settings)
CREATE TABLE IF NOT EXISTS hospital_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_name VARCHAR(255) NOT NULL,
  hospital_code VARCHAR(50),
  logo_path VARCHAR(500),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  tagline VARCHAR(255),
  primary_color VARCHAR(20) DEFAULT '#3B82F6',
  secondary_color VARCHAR(20) DEFAULT '#1E40AF',
  currency VARCHAR(10) DEFAULT 'KES',
  timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(20) DEFAULT 'HH:mm',
  fiscal_year_start INT DEFAULT 1,
  receipt_prefix VARCHAR(20) DEFAULT 'RCP',
  invoice_prefix VARCHAR(20) DEFAULT 'INV',
  patient_id_prefix VARCHAR(20) DEFAULT 'PAT',
  smtp_host VARCHAR(255),
  smtp_port INT,
  smtp_user VARCHAR(255),
  smtp_pass VARCHAR(255),
  sms_provider VARCHAR(50),
  sms_api_key VARCHAR(255),
  sms_sender_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_hospital_code (hospital_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 18: ATTENDANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status ENUM('present','absent','late','half_day','on_leave') DEFAULT 'present',
  device_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date (user_id, date),
  INDEX idx_user_id (user_id),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 19: STORED PROCEDURES & EVENTS
-- ============================================================================

-- 19.1 Expire old queue items (older than 24 hours, still waiting)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS expire_old_queue_items()
BEGIN
  UPDATE queue
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE status = 'waiting'
    AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
END //
DELIMITER ;

-- 19.2 Scheduled event: auto-expire queue every hour
-- NOTE: Requires event_scheduler = ON in your MySQL config
-- SET GLOBAL event_scheduler = ON;
DELIMITER //
CREATE EVENT IF NOT EXISTS auto_expire_queue
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  CALL expire_old_queue_items();
END //
DELIMITER ;

-- ============================================================================
-- SECTION 20: SEED DATA
-- ============================================================================

-- Re-enable foreign key checks before seeding
SET FOREIGN_KEY_CHECKS = 1;

-- 20.1 Default Insurance Providers (Kenya)
INSERT INTO insurance_providers (code, name, type, is_active) VALUES
  ('SHA',     'Social Health Authority (SHA)',           'government', TRUE),
  ('NHIF',    'National Hospital Insurance Fund (Legacy)','government', TRUE),
  ('AAR',     'AAR Insurance',                           'private',    TRUE),
  ('JUBILEE', 'Jubilee Health Insurance',                'private',    TRUE),
  ('BRITAM',  'Britam Insurance',                        'private',    TRUE),
  ('CIC',     'CIC Insurance',                           'private',    TRUE),
  ('SELF',    'Self Pay / Cash',                         'private',    TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 20.2 Default Module Config entries
INSERT INTO module_config (module_code, module_name, category, is_enabled, is_required, display_order) VALUES
  ('core',        'Core System',       'core',       TRUE,  TRUE,  1),
  ('pharmacy',    'Pharmacy',          'clinical',   TRUE,  FALSE, 2),
  ('laboratory',  'Laboratory',        'clinical',   TRUE,  FALSE, 3),
  ('radiology',   'Radiology',         'clinical',   TRUE,  FALSE, 4),
  ('billing',     'Billing',           'financial',  TRUE,  FALSE, 5),
  ('inventory',   'Inventory',         'operations', TRUE,  FALSE, 6),
  ('attendance',  'Staff Attendance',  'operations', TRUE,  FALSE, 7),
  ('ambulance',   'Ambulance',         'operations', TRUE,  FALSE, 8),
  ('chronicCare', 'Chronic Care',      'clinical',   TRUE,  FALSE, 9),
  ('insurance',   'Insurance',         'financial',  TRUE,  FALSE, 10),
  ('expenses',    'Expenses',          'financial',  TRUE,  FALSE, 11),
  ('referrals',   'Referrals',         'clinical',   TRUE,  FALSE, 12),
  ('audit',       'Audit Trail',       'core',       TRUE,  FALSE, 13)
ON DUPLICATE KEY UPDATE module_name = VALUES(module_name);

-- 20.3 ICD-10 Diagnosis Codes (common Kenyan clinical codes)
INSERT INTO diagnosis_codes (code, description, category, is_common) VALUES
  -- Infectious & Parasitic Diseases
  ('A09', 'Infectious gastroenteritis and colitis', 'Infectious Diseases', TRUE),
  ('A15', 'Respiratory tuberculosis', 'Infectious Diseases', TRUE),
  ('A90', 'Dengue fever', 'Infectious Diseases', FALSE),
  ('B15', 'Acute hepatitis A', 'Infectious Diseases', FALSE),
  ('B20', 'HIV disease', 'Infectious Diseases', TRUE),
  ('B50', 'Plasmodium falciparum malaria', 'Infectious Diseases', TRUE),
  ('B54', 'Unspecified malaria', 'Infectious Diseases', TRUE),
  -- Respiratory
  ('J00', 'Acute nasopharyngitis (common cold)', 'Respiratory', TRUE),
  ('J02', 'Acute pharyngitis', 'Respiratory', TRUE),
  ('J06', 'Acute upper respiratory infections', 'Respiratory', TRUE),
  ('J11', 'Influenza, virus not identified', 'Respiratory', TRUE),
  ('J18', 'Pneumonia, unspecified organism', 'Respiratory', TRUE),
  ('J20', 'Acute bronchitis', 'Respiratory', TRUE),
  ('J45', 'Asthma', 'Respiratory', TRUE),
  -- Gastrointestinal
  ('K21', 'Gastro-oesophageal reflux disease', 'Gastrointestinal', TRUE),
  ('K29', 'Gastritis and duodenitis', 'Gastrointestinal', TRUE),
  ('K30', 'Functional dyspepsia', 'Gastrointestinal', TRUE),
  ('K35', 'Acute appendicitis', 'Gastrointestinal', FALSE),
  ('K59', 'Other functional intestinal disorders', 'Gastrointestinal', TRUE),
  -- Cardiovascular
  ('I10', 'Essential (primary) hypertension', 'Cardiovascular', TRUE),
  ('I11', 'Hypertensive heart disease', 'Cardiovascular', FALSE),
  ('I20', 'Angina pectoris', 'Cardiovascular', FALSE),
  ('I21', 'Acute myocardial infarction', 'Cardiovascular', FALSE),
  ('I50', 'Heart failure', 'Cardiovascular', FALSE),
  ('I64', 'Stroke, not specified', 'Cardiovascular', FALSE),
  -- Endocrine / Metabolic
  ('E10', 'Type 1 diabetes mellitus', 'Endocrine', TRUE),
  ('E11', 'Type 2 diabetes mellitus', 'Endocrine', TRUE),
  ('E55', 'Vitamin D deficiency', 'Endocrine', FALSE),
  ('E78', 'Disorders of lipoprotein metabolism', 'Endocrine', FALSE),
  -- Musculoskeletal
  ('M54', 'Dorsalgia (back pain)', 'Musculoskeletal', TRUE),
  ('M79', 'Other soft tissue disorders', 'Musculoskeletal', TRUE),
  -- Genitourinary
  ('N30', 'Cystitis', 'Genitourinary', TRUE),
  ('N39', 'Other disorders of urinary system (UTI)', 'Genitourinary', TRUE),
  ('N76', 'Other inflammation of vagina', 'Genitourinary', TRUE),
  -- Pregnancy & Obstetric
  ('O80', 'Single spontaneous delivery', 'Obstetric', TRUE),
  ('O82', 'Single delivery by caesarean section', 'Obstetric', FALSE),
  ('Z34', 'Supervision of normal pregnancy', 'Obstetric', TRUE),
  -- Dermatological
  ('L02', 'Cutaneous abscess, furuncle and carbuncle', 'Dermatological', TRUE),
  ('L20', 'Atopic dermatitis / Eczema', 'Dermatological', TRUE),
  ('L30', 'Other dermatitis', 'Dermatological', TRUE),
  -- Mental Health
  ('F32', 'Depressive episode', 'Mental Health', TRUE),
  ('F41', 'Other anxiety disorders', 'Mental Health', TRUE),
  -- Eye / ENT
  ('H10', 'Conjunctivitis', 'Eye', TRUE),
  ('H66', 'Otitis media', 'ENT', TRUE),
  -- Injuries
  ('S00', 'Superficial injury of head', 'Injuries', TRUE),
  ('S61', 'Open wound of wrist, hand and fingers', 'Injuries', TRUE),
  ('T14', 'Injury of unspecified body region', 'Injuries', TRUE),
  -- Paediatric
  ('P07', 'Disorders related to short gestation / low birth weight', 'Paediatric', FALSE),
  ('R50', 'Fever of other and unknown origin', 'General Symptoms', TRUE),
  ('R10', 'Abdominal and pelvic pain', 'General Symptoms', TRUE),
  ('R11', 'Nausea and vomiting', 'General Symptoms', TRUE),
  ('R51', 'Headache', 'General Symptoms', TRUE),
  ('R05', 'Cough', 'General Symptoms', TRUE)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ============================================================================
-- RESTORE SESSION SETTINGS
-- ============================================================================

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE = @OLD_SQL_MODE;
SET time_zone = @OLD_TIME_ZONE;

-- ============================================================================
-- SCHEMA CREATION COMPLETE
-- Total Tables: 52
-- ============================================================================
-- To verify: SELECT COUNT(*) FROM information_schema.TABLES
--            WHERE TABLE_SCHEMA = DATABASE();
-- ============================================================================
