-- Complete Hospital Management System Database Schema
-- Drop existing tables if needed (WARNING: This deletes all data!)
-- Uncomment the following lines to start fresh:
/*
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bill_items;
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS lab_results;
DROP TABLE IF EXISTS lab_order_items;
DROP TABLE IF EXISTS lab_orders;
DROP TABLE IF EXISTS lab_tests;
DROP TABLE IF EXISTS sales_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS prescription_items;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS direct_sale_items;
DROP TABLE IF EXISTS direct_sales;
DROP TABLE IF EXISTS ambulance_requests;
DROP TABLE IF EXISTS ambulances;
DROP TABLE IF EXISTS referrals;
DROP TABLE IF EXISTS queue;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS medicines;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS users;
DROP PROCEDURE IF EXISTS expire_old_queue_items;
DROP EVENT IF EXISTS auto_expire_queue;
*/

-- Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'receptionist', 'doctor', 'lab', 'pharmacy', 'nurse', 'supervisor') NOT NULL,
  phone VARCHAR(20) NULL,
  refresh_token TEXT NULL,
  lastLogin TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role)
);

ALTER TABLE users 
MODIFY COLUMN role 
ENUM('admin', 'receptionist', 'doctor', 'lab', 'pharmacy', 'nurse', 'supervisor') 
NOT NULL;


-- Patients Table
CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  alternative_phone VARCHAR(20),
  email VARCHAR(255),
  age INT NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  id_number VARCHAR(50) UNIQUE NOT NULL,
  next_of_kin_name VARCHAR(255),
  next_of_kin_phone VARCHAR(20),
  next_of_kin_relationship VARCHAR(100),
  county VARCHAR(100),
  town VARCHAR(100),
  address TEXT,
  house_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_id_number (id_number),
  INDEX idx_email (email)
);

ALTER TABLE patients 
ADD COLUMN patient_number VARCHAR(20) UNIQUE AFTER id,
ADD INDEX idx_patient_number (patient_number);




-- System Settings Table
CREATE TABLE system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description VARCHAR(255),
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_setting_key (setting_key)
);

-- Queue Table
CREATE TABLE queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  department ENUM('doctor', 'lab', 'pharmacy', 'billing') NOT NULL,
  assigned_to INT NULL,
  status ENUM('waiting', 'in_progress', 'done', 'cancelled') DEFAULT 'waiting',
  queue_number VARCHAR(10) NOT NULL,
  notes TEXT NULL,
  diagnosis TEXT NULL,
  prescription TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_department_status (department, status),
  INDEX idx_created_at (created_at),
  INDEX idx_dept_status_created (department, status, created_at)
);

-- Add 'nurse' as valid department to queue table (if not already exists)
ALTER TABLE queue 
MODIFY COLUMN department ENUM('doctor', 'nurse', 'lab', 'pharmacy', 'billing') NOT NULL;


-- Create vitals table
CREATE TABLE IF NOT EXISTS vitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  queue_id INT NOT NULL,
  patient_id INT NOT NULL,
  recorded_by INT NOT NULL,
  
  -- Vital signs measurements
  blood_pressure_systolic DECIMAL(5,2) NULL COMMENT 'Systolic BP in mmHg',
  blood_pressure_diastolic DECIMAL(5,2) NULL COMMENT 'Diastolic BP in mmHg',
  temperature DECIMAL(4,2) NULL COMMENT 'Body temperature in Celsius',
  pulse_rate INT NULL COMMENT 'Heart rate in beats per minute',
  respiratory_rate INT NULL COMMENT 'Breaths per minute',
  weight DECIMAL(5,2) NULL COMMENT 'Weight in kg',
  height DECIMAL(5,2) NULL COMMENT 'Height in cm',
  blood_sugar DECIMAL(5,2) NULL COMMENT 'Blood glucose in mg/dL',
  oxygen_saturation INT NULL COMMENT 'SpO2 percentage',
  bmi DECIMAL(5,2) NULL COMMENT 'Body Mass Index',
  
  -- Additional info
  notes TEXT NULL,
  drug_allergies TEXT NULL COMMENT 'Patient drug allergies and reactions',
  updated_by INT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  
  -- Indexes for better performance
  INDEX idx_queue_id (queue_id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_recorded_by (recorded_by),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medicines Table
CREATE TABLE medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  barcode VARCHAR(100) UNIQUE NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_barcode (barcode),
  INDEX idx_expiry (expiry_date),
  INDEX idx_name (name)
);

-- Equipment Table
CREATE TABLE equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_price DECIMAL(10, 2) DEFAULT 0,
  quantity INT DEFAULT 1,
  warranty_expiry DATE NULL,
  status ENUM('active', 'maintenance', 'retired', 'broken') DEFAULT 'active',
  location VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_serial_number (serial_number),
  INDEX idx_status (status),
  INDEX idx_warranty_expiry (warranty_expiry)
);

-- Prescriptions Table
CREATE TABLE prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  queue_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NULL,
  notes TEXT,
  diagnosis TEXT,
  status ENUM('pending', 'dispensed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_patient_id (patient_id)
);

-- Prescription Items
CREATE TABLE prescription_items (
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
);

-- Sales/Dispensing Records
CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prescription_id INT NOT NULL,
  pharmacist_id INT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'card', 'insurance', 'mpesa') DEFAULT 'cash',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (pharmacist_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_created_at (created_at)
);

-- Sales Items
CREATE TABLE sales_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  medicine_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  INDEX idx_sale_id (sale_id)
);

-- Direct Sales
CREATE TABLE direct_sales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  sold_by INT NULL,
  sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sold_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sale_date (sale_date)
);

-- Direct Sale Items
CREATE TABLE direct_sale_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
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
);

-- Lab Tests Catalog
CREATE TABLE lab_tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_name VARCHAR(255) NOT NULL,
  test_code VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  normal_range TEXT,
  unit VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_test_code (test_code),
  INDEX idx_category (category)
);

-- Lab Orders
CREATE TABLE lab_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  queue_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NULL,
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_patient_id (patient_id)
);

-- Lab Order Items
CREATE TABLE lab_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lab_order_id INT NOT NULL,
  lab_test_id INT NOT NULL,
  status ENUM('pending', 'completed') DEFAULT 'pending',
  FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE CASCADE,
  INDEX idx_lab_order_id (lab_order_id)
);

CREATE TABLE lab_test_parameters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lab_test_id INT NOT NULL,
  parameter_name VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  normal_range VARCHAR(100),
  FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE CASCADE
);

CREATE TABLE lab_results (
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
);


-- Bills Table
CREATE TABLE bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  queue_id INT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  consultation_fee DECIMAL(10, 2) DEFAULT 0,
  lab_fee DECIMAL(10, 2) DEFAULT 0,
  pharmacy_fee DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
  payment_method ENUM('cash', 'card', 'insurance', 'mpesa') DEFAULT 'cash',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_patient_id (patient_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created_at (created_at)
);

-- Bill Items
CREATE TABLE bill_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  medicine_id INT NULL,
  custom_medicine_name VARCHAR(255) NULL,
  item_type ENUM('consultation', 'lab_test', 'medicine') NOT NULL,
  item_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL,
  INDEX idx_bill_id (bill_id)
);

-- Payments
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'card', 'insurance', 'mpesa') NOT NULL,
  reference_number VARCHAR(100),
  received_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
  FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_bill_id (bill_id),
  INDEX idx_created_at (created_at)
);

-- Referrals Table
CREATE TABLE referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  queue_id INT,
  referring_hospital VARCHAR(255) NOT NULL,
  referred_to_hospital VARCHAR(255) NOT NULL,
  referred_to_department VARCHAR(255),
  referral_reason TEXT NOT NULL,
  clinical_summary TEXT NOT NULL,
  diagnosis TEXT,
  patient_condition ENUM('Stable', 'Critical', 'Urgent', 'Emergency') DEFAULT 'Stable',
  vital_signs TEXT,
  services_needed TEXT NOT NULL COMMENT 'JSON array of services',
  investigations_done TEXT COMMENT 'Lab tests, X-rays done',
  current_medications TEXT,
  referring_doctor_name VARCHAR(255) NOT NULL,
  referring_doctor_phone VARCHAR(20) NOT NULL,
  referring_doctor_email VARCHAR(255),
  status ENUM('Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled') DEFAULT 'Pending',
  priority ENUM('Routine', 'Urgent', 'Emergency') DEFAULT 'Routine',
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  feedback_from_referred_hospital TEXT,
  attachment_urls TEXT COMMENT 'JSON array of file URLs',
  referral_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_visit_date DATE,
  completed_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE SET NULL,
  INDEX idx_patient_id (patient_id),
  INDEX idx_doctor_id (doctor_id),
  INDEX idx_status (status),
  INDEX idx_referral_date (referral_date),
  INDEX idx_priority (priority)
);

-- Ambulances Table
CREATE TABLE ambulances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ambulance_number VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('Basic', 'Advanced', 'Mobile ICU', 'Neonatal') NOT NULL,
  status ENUM('Available', 'On Call', 'On Trip', 'Maintenance') DEFAULT 'Available',
  driver_name VARCHAR(255) NOT NULL,
  driver_phone VARCHAR(20) NOT NULL,
  capacity INT NOT NULL,
  equipment TEXT COMMENT 'JSON array of equipment',
  location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_ambulance_number (ambulance_number)
);

-- Ambulance Requests Table
CREATE TABLE ambulance_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  requested_by INT NOT NULL COMMENT 'User ID who requested',
  request_direction ENUM('INCOMING', 'OUTGOING') NOT NULL DEFAULT 'OUTGOING',
  requester_type ENUM('INTERNAL', 'EXTERNAL') DEFAULT 'INTERNAL',
  approved_by INT NULL COMMENT 'Doctor who approved',
  ambulance_id INT NULL,
  request_type ENUM('Referral', 'Emergency', 'Transfer', 'Pharmacy Pickup') NOT NULL,
  priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
  pickup_location TEXT NOT NULL,
  pickup_location_details TEXT,
  destination TEXT NOT NULL,
  destination_details TEXT,
  patient_name VARCHAR(100),
  patient_age INT,
  patient_gender ENUM('Male', 'Female', 'Other'),
  patient_phone VARCHAR(20),
  patient_id_number VARCHAR(50) NULL,
  expected_pickup_time DATETIME,
  patient_condition TEXT,
  emergency_details TEXT,
  special_instructions TEXT,
  vital_signs JSON,
  symptoms JSON,
  medical_history TEXT,
  current_medications TEXT,
  allergies TEXT,
  required_equipment TEXT COMMENT 'JSON array of required equipment',
  requesting_hospital_name VARCHAR(255) NULL,
  requesting_hospital_location TEXT NULL,
  requesting_hospital_contact VARCHAR(20) NULL,
  requesting_hospital_contact_person VARCHAR(255) NULL,
  status ENUM('Pending', 'Approved', 'Assigned', 'Dispatched', 'On Route', 'At Pickup', 'On Return', 'Completed', 'Cancelled') DEFAULT 'Pending',
  doctor_notes TEXT,
  approval_date TIMESTAMP NULL,
  assigned_at TIMESTAMP NULL,
  dispatched_at TIMESTAMP NULL,
  assigned_driver VARCHAR(255),
  dispatch_time TIMESTAMP NULL,
  pickup_time TIMESTAMP NULL,
  completion_time TIMESTAMP NULL,
  printed_by INT NULL,
  printed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE SET NULL,
  FOREIGN KEY (printed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_request_type (request_type),
  INDEX idx_priority (priority),
  INDEX idx_patient_id (patient_id),
  INDEX idx_created_at (created_at),
  INDEX idx_request_direction (request_direction)
);

-- Stored Procedure for Auto-Expiring Queue Items
DELIMITER $$

CREATE PROCEDURE expire_old_queue_items()
BEGIN
  UPDATE queue 
  SET status = 'cancelled', 
      notes = CONCAT(IFNULL(notes, ''), '\n[AUTO-EXPIRED: Queue item older than 24 hours]'),
      updated_at = CURRENT_TIMESTAMP
  WHERE status IN ('waiting', 'in_progress')
    AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
  SELECT ROW_COUNT() as expired_count;
END$$

DELIMITER ;

-- Event to Auto-Expire Queue Items (requires event_scheduler to be ON)
CREATE EVENT IF NOT EXISTS auto_expire_queue
ON SCHEDULE EVERY 1 HOUR
DO CALL expire_old_queue_items();

-- Insert Default System Settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('consultation_fee', '500', 'Default consultation fee charged per visit')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- =====================================================
-- CHRONIC CARE MODULE TABLES
-- =====================================================

-- Chronic Clinics (Diabetes, HIV, ANC, TB, Hypertension, etc.)
CREATE TABLE IF NOT EXISTS clinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  default_follow_up_days INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_code (code),
  INDEX idx_is_active (is_active)
);

-- Patient Enrollments in Chronic Clinics
CREATE TABLE IF NOT EXISTS chronic_enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  clinic_id INT NOT NULL,
  enrolled_by INT NULL,
  enrollment_date DATE NOT NULL,
  status ENUM('active', 'discharged', 'transferred', 'deceased', 'lost_to_follow_up') DEFAULT 'active',
  baseline_notes TEXT,
  baseline_weight DECIMAL(5,2) NULL,
  baseline_bp_systolic DECIMAL(5,2) NULL,
  baseline_bp_diastolic DECIMAL(5,2) NULL,
  baseline_blood_sugar DECIMAL(5,2) NULL,
  discharge_date DATE NULL,
  discharge_reason TEXT NULL,
  discharged_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (enrolled_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (discharged_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_patient_id (patient_id),
  INDEX idx_clinic_id (clinic_id),
  INDEX idx_status (status),
  INDEX idx_enrollment_date (enrollment_date)
);

-- Clinic Visits (Nurse-led, separate from regular queue)
CREATE TABLE IF NOT EXISTS clinic_visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT NOT NULL,
  patient_id INT NOT NULL,
  clinic_id INT NOT NULL,
  visit_date DATE NOT NULL,
  visit_type ENUM('scheduled', 'walk_in', 'emergency') DEFAULT 'scheduled',
  recorded_by INT NULL,
  reviewed_by INT NULL,
  review_date TIMESTAMP NULL,

  
  -- Vitals
  blood_pressure_systolic DECIMAL(5,2) NULL,
  blood_pressure_diastolic DECIMAL(5,2) NULL,
  blood_sugar DECIMAL(5,2) NULL,
  weight DECIMAL(5,2) NULL,
  pulse_rate INT NULL,
  temperature DECIMAL(4,2) NULL,
  oxygen_saturation INT NULL,
  
  -- Comparison flags (calculated)
  bp_change_from_last VARCHAR(50) NULL COMMENT 'e.g., +10/-5 from last visit',
  bp_change_from_baseline VARCHAR(50) NULL,
  weight_change_from_last DECIMAL(5,2) NULL,
  sugar_change_from_last DECIMAL(5,2) NULL,
  
  -- Abnormal flags
  is_abnormal BOOLEAN DEFAULT FALSE,
  abnormal_flags JSON NULL COMMENT 'Array of abnormal indicators',
  
  -- Notes and actions
  nurse_notes TEXT,
  doctor_notes TEXT,
  medication_changes TEXT,
  current_medications TEXT,
  
  -- Status
  status ENUM('recorded', 'reviewed', 'escalated', 'completed') DEFAULT 'recorded',
  escalated_to_consultation BOOLEAN DEFAULT FALSE,
  queue_id INT NULL COMMENT 'If escalated to full consultation',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (enrollment_id) REFERENCES chronic_enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE SET NULL,
  
  INDEX idx_enrollment_id (enrollment_id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_clinic_id (clinic_id),
  INDEX idx_visit_date (visit_date),
  INDEX idx_status (status),
  INDEX idx_is_abnormal (is_abnormal)
);

-- Follow-Up Appointments
CREATE TABLE IF NOT EXISTS follow_ups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  enrollment_id INT NULL COMMENT 'NULL for non-chronic follow-ups',
  clinic_id INT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NULL,
  purpose VARCHAR(255) NOT NULL,
  department ENUM('nurse', 'doctor', 'lab') NOT NULL DEFAULT 'nurse',
  scheduled_by INT NULL,
  notes TEXT,

  
  -- Status tracking
  status ENUM('scheduled', 'completed', 'missed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
  completed_at TIMESTAMP NULL,
  completed_by INT NULL,
  missed_reason TEXT NULL,
  reschedule_count INT DEFAULT 0,
  
  -- For tracking defaulters
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollment_id) REFERENCES chronic_enrollments(id) ON DELETE SET NULL,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL,
  FOREIGN KEY (scheduled_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_patient_id (patient_id),
  INDEX idx_scheduled_date (scheduled_date),
  INDEX idx_status (status),
  INDEX idx_clinic_id (clinic_id),
  INDEX idx_department (department)
);

-- Insert default clinics
INSERT INTO clinics (name, code, description, default_follow_up_days) VALUES
('Diabetes Clinic', 'DM', 'Management of Type 1 and Type 2 Diabetes Mellitus', 30),
('Hypertension Clinic', 'HTN', 'Blood pressure monitoring and management', 30),
('HIV/AIDS Clinic', 'HIV', 'Comprehensive HIV care and ART management', 30),
('Tuberculosis Clinic', 'TB', 'TB treatment and follow-up', 14),
('Antenatal Clinic', 'ANC', 'Pregnancy care and maternal health', 28),
('Postnatal Clinic', 'PNC', 'Post-delivery maternal and child health', 42),
('Child Wellness Clinic', 'CWC', 'Immunization and child growth monitoring', 30),
('Mental Health Clinic', 'MH', 'Psychiatric care and counseling', 30)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Enable Event Scheduler (uncomment to run)
-- SET GLOBAL event_scheduler = ON;

-- expense table
CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,

  category ENUM(
    'doctor_salary',
    'staff_payment',
    'misc'
  ) NOT NULL,

  paid_to VARCHAR(255) NOT NULL,
  related_user_id INT NULL COMMENT 'Doctor or staff user ID (if applicable)',

  expense_date DATE NOT NULL,
  payment_method ENUM('cash', 'bank', 'mpesa', 'cheque') DEFAULT 'cash',
  reference_number VARCHAR(100),

  notes TEXT,

  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_category (category),
  INDEX idx_expense_date (expense_date),
  INDEX idx_created_at (created_at)
);
-- =====================================================
-- AUDIT TRAIL MODULE
-- =====================================================

-- Audit Logs Table - Track all user actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  username VARCHAR(100),
  user_role VARCHAR(50),
  action VARCHAR(50) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, PRINT, DISPENSE, PAYMENT',
  entity_type VARCHAR(50) NOT NULL COMMENT 'patient, bill, prescription, medicine, user, etc.',
  entity_id INT NULL,
  description TEXT,
  old_values JSON NULL COMMENT 'State before change',
  new_values JSON NULL COMMENT 'State after change',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at),
  INDEX idx_user_action_date (user_id, action, created_at)
);

-- =====================================================
-- CASHIER SHIFT MANAGEMENT MODULE
-- =====================================================

-- Cashier Shifts Table - Track shift open/close
CREATE TABLE IF NOT EXISTS cashier_shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  shift_date DATE NOT NULL,
  opening_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closing_time TIMESTAMP NULL,
  opening_balance DECIMAL(12,2) DEFAULT 0 COMMENT 'Starting cash float',
  
  -- Expected amounts by payment method
  expected_cash DECIMAL(12,2) DEFAULT 0,
  expected_mpesa DECIMAL(12,2) DEFAULT 0,
  expected_card DECIMAL(12,2) DEFAULT 0,
  expected_insurance DECIMAL(12,2) DEFAULT 0,
  total_expected DECIMAL(12,2) DEFAULT 0,
  
  -- Actual amounts entered at close
  actual_cash DECIMAL(12,2) NULL,
  actual_mpesa DECIMAL(12,2) NULL,
  actual_card DECIMAL(12,2) NULL,
  
  -- Variance
  cash_variance DECIMAL(12,2) NULL COMMENT 'Actual - Expected',
  
  -- Counts
  total_transactions INT DEFAULT 0,
  total_bills_paid INT DEFAULT 0,
  total_refunds INT DEFAULT 0,
  
  status ENUM('open', 'closed', 'verified', 'disputed') DEFAULT 'open',
  cashier_notes TEXT,
  
  -- Verification
  verified_by INT NULL,
  verified_at TIMESTAMP NULL,
  verifier_notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_date (user_id, shift_date),
  INDEX idx_status (status),
  INDEX idx_shift_date (shift_date),
  UNIQUE KEY unique_user_open_shift (user_id, status, shift_date)
);

-- Shift Transactions Table - Individual transactions within a shift
CREATE TABLE IF NOT EXISTS shift_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shift_id INT NOT NULL,
  transaction_type ENUM('payment', 'refund', 'void', 'float_in', 'float_out') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('cash', 'mpesa', 'card', 'insurance') NOT NULL,
  
  -- Reference to source
  reference_type VARCHAR(50) COMMENT 'bill, prescription, direct_sale',
  reference_id INT NULL,
  patient_id INT NULL,
  patient_name VARCHAR(255),
  
  -- Transaction details
  description TEXT,
  receipt_number VARCHAR(50),
  mpesa_code VARCHAR(50) NULL,
  
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (shift_id) REFERENCES cashier_shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_shift (shift_id),
  INDEX idx_payment_method (payment_method),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_created_at (created_at)
);

-- =====================================================
-- NHIF/SHA INSURANCE INTEGRATION MODULE
-- =====================================================

-- Insurance Providers/Schemes Table
CREATE TABLE IF NOT EXISTS insurance_providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL COMMENT 'e.g., SHA, NHIF, JUBILEE, AAR',
  name VARCHAR(255) NOT NULL,
  type ENUM('government', 'private', 'corporate') NOT NULL DEFAULT 'private',
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  api_endpoint VARCHAR(500) COMMENT 'API URL for claims submission',
  api_key_encrypted TEXT COMMENT 'Encrypted API credentials',
  is_active BOOLEAN DEFAULT TRUE,
  requires_preauth BOOLEAN DEFAULT FALSE COMMENT 'Requires pre-authorization for admissions',
  payment_terms_days INT DEFAULT 30 COMMENT 'Expected payment turnaround',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default insurance providers
INSERT INTO insurance_providers (code, name, type, requires_preauth) VALUES
('SHA', 'Social Health Authority (SHA)', 'government', TRUE),
('NHIF', 'National Hospital Insurance Fund (Legacy)', 'government', TRUE),
('SHIF', 'Social Health Insurance Fund', 'government', TRUE),
('AAR', 'AAR Insurance', 'private', TRUE),
('JUBILEE', 'Jubilee Health Insurance', 'private', TRUE),
('BRITAM', 'Britam Insurance', 'private', TRUE),
('CIC', 'CIC Insurance', 'private', TRUE),
('UAP', 'UAP Old Mutual', 'private', TRUE),
('MADISON', 'Madison Insurance', 'private', FALSE),
('GA', 'GA Insurance', 'private', FALSE),
('RESOLUTION', 'Resolution Insurance', 'private', TRUE),
('SANLAM', 'Sanlam Kenya', 'private', TRUE),
('MINET', 'Minet Kenya', 'private', TRUE),
('SELF', 'Self Pay / Cash', 'private', FALSE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Patient Insurance Coverage Table
CREATE TABLE IF NOT EXISTS patient_insurance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  provider_id INT NOT NULL,
  
  -- Member details
  member_number VARCHAR(100) NOT NULL COMMENT 'NHIF/SHA/Insurance member number',
  member_name VARCHAR(255) COMMENT 'Name as per insurance card',
  relationship ENUM('self', 'spouse', 'child', 'parent', 'dependent') DEFAULT 'self',
  principal_member_number VARCHAR(100) COMMENT 'If dependent, the principal member number',
  principal_member_name VARCHAR(255),
  
  -- SHA/NHIF Specific
  national_id VARCHAR(20) COMMENT 'Kenya National ID',
  sha_id VARCHAR(50) COMMENT 'SHA unique identifier',
  
  -- Coverage details
  scheme_name VARCHAR(255) COMMENT 'e.g., SHIF, ECCIF, Corporate Scheme',
  scheme_type ENUM('outpatient', 'inpatient', 'comprehensive', 'maternity', 'dental', 'optical') DEFAULT 'comprehensive',
  coverage_start_date DATE,
  coverage_end_date DATE,
  annual_limit DECIMAL(12,2) COMMENT 'Annual coverage limit',
  balance_remaining DECIMAL(12,2) COMMENT 'Remaining balance if tracked',
  copay_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'Patient co-pay %',
  copay_fixed DECIMAL(10,2) DEFAULT 0 COMMENT 'Fixed co-pay amount',
  
  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP NULL,
  verified_by INT NULL,
  verification_response JSON COMMENT 'API response from verification',
  
  is_primary BOOLEAN DEFAULT TRUE COMMENT 'Primary insurance for this patient',
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES insurance_providers(id),
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_patient (patient_id),
  INDEX idx_member_number (member_number),
  INDEX idx_national_id (national_id),
  INDEX idx_sha_id (sha_id),
  UNIQUE KEY unique_patient_provider (patient_id, provider_id, member_number)
);

-- Insurance Claims Table
CREATE TABLE IF NOT EXISTS insurance_claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Patient and visit info
  patient_id INT NOT NULL,
  patient_insurance_id INT NOT NULL,
  visit_id INT COMMENT 'Link to queue/visit if applicable',
  admission_id INT COMMENT 'Link to admission if inpatient',
  
  -- Provider info
  provider_id INT NOT NULL,
  
  -- Claim details
  claim_type ENUM('outpatient', 'inpatient', 'maternity', 'dental', 'optical', 'pharmacy', 'lab', 'procedure') NOT NULL,
  service_date DATE NOT NULL,
  admission_date DATE NULL,
  discharge_date DATE NULL,
  
  -- Diagnosis (ICD-10)
  primary_diagnosis_code VARCHAR(20),
  primary_diagnosis_description TEXT,
  secondary_diagnosis_codes JSON COMMENT 'Array of secondary diagnosis codes',
  
  -- Financial
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  approved_amount DECIMAL(12,2) DEFAULT 0,
  copay_amount DECIMAL(12,2) DEFAULT 0,
  claimed_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Status workflow
  status ENUM('draft', 'pending', 'submitted', 'processing', 'approved', 'partially_approved', 'rejected', 'paid', 'cancelled') DEFAULT 'draft',
  
  -- SHA/External reference
  external_claim_id VARCHAR(100) COMMENT 'Claim ID from SHA/insurer',
  external_reference VARCHAR(100),
  preauth_number VARCHAR(100) COMMENT 'Pre-authorization reference if applicable',
  
  -- Submission details
  submitted_at TIMESTAMP NULL,
  submitted_by INT NULL,
  
  -- Processing details
  processed_at TIMESTAMP NULL,
  rejection_reason TEXT,
  rejection_code VARCHAR(50),
  adjudication_notes TEXT,
  
  -- Payment
  payment_date DATE NULL,
  payment_reference VARCHAR(100),
  payment_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Documents
  invoice_url TEXT,
  supporting_docs JSON COMMENT 'Array of document URLs',
  
  -- Tracking
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_insurance_id) REFERENCES patient_insurance(id),
  FOREIGN KEY (provider_id) REFERENCES insurance_providers(id),
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_patient (patient_id),
  INDEX idx_provider (provider_id),
  INDEX idx_status (status),
  INDEX idx_claim_number (claim_number),
  INDEX idx_service_date (service_date),
  INDEX idx_created_at (created_at)
);

-- Claim Line Items Table
CREATE TABLE IF NOT EXISTS claim_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  claim_id INT NOT NULL,
  
  item_type ENUM('consultation', 'procedure', 'lab_test', 'radiology', 'medication', 'consumable', 'bed', 'theatre', 'other') NOT NULL,
  
  -- Item reference
  reference_type VARCHAR(50) COMMENT 'bill_item, prescription_item, lab_order',
  reference_id INT,
  
  -- Item details
  item_code VARCHAR(50) COMMENT 'CPT code, drug code, etc.',
  item_name VARCHAR(255) NOT NULL,
  item_description TEXT,
  
  -- Quantity and pricing
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  
  -- Approval
  approved_quantity INT,
  approved_amount DECIMAL(12,2),
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (claim_id) REFERENCES insurance_claims(id) ON DELETE CASCADE,
  INDEX idx_claim (claim_id),
  INDEX idx_item_type (item_type)
);

-- Pre-Authorization Requests Table
CREATE TABLE IF NOT EXISTS preauthorizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  preauth_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Patient and insurance
  patient_id INT NOT NULL,
  patient_insurance_id INT NOT NULL,
  provider_id INT NOT NULL,
  
  -- Request details
  request_type ENUM('admission', 'surgery', 'procedure', 'expensive_treatment', 'long_stay', 'other') NOT NULL,
  
  -- Clinical information
  primary_diagnosis_code VARCHAR(20),
  primary_diagnosis TEXT,
  procedure_code VARCHAR(50),
  procedure_description TEXT,
  clinical_notes TEXT,
  
  -- Estimated costs
  estimated_cost DECIMAL(12,2),
  estimated_days INT COMMENT 'Estimated admission days',
  
  -- Hospital details
  admission_date DATE,
  expected_discharge_date DATE,
  treating_doctor VARCHAR(255),
  ward_type ENUM('general', 'private', 'icu', 'hdu', 'maternity', 'paediatric') DEFAULT 'general',
  
  -- Status
  status ENUM('pending', 'submitted', 'under_review', 'approved', 'partially_approved', 'rejected', 'expired', 'cancelled') DEFAULT 'pending',
  
  -- External reference
  external_preauth_id VARCHAR(100),
  
  -- Approval details
  approved_amount DECIMAL(12,2),
  approved_days INT,
  approval_notes TEXT,
  valid_from DATE,
  valid_until DATE,
  
  -- Rejection details
  rejection_reason TEXT,
  rejection_code VARCHAR(50),
  
  -- Tracking
  requested_by INT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  processed_by_name VARCHAR(255) COMMENT 'Name from insurer',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_insurance_id) REFERENCES patient_insurance(id),
  FOREIGN KEY (provider_id) REFERENCES insurance_providers(id),
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_patient (patient_id),
  INDEX idx_provider (provider_id),
  INDEX idx_status (status),
  INDEX idx_preauth_number (preauth_number)
);
