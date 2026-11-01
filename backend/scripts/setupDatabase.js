/**
 * Database Setup Script
 * Creates fresh vijomedix database with all tables and multi-tenancy support
 * 
 * Usage: node scripts/setupDatabase.js
 * 
 * For XAMPP MySQL: Make sure MySQL is running in XAMPP control panel
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Database configuration for XAMPP
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',  // XAMPP default is empty password
    port: parseInt(process.env.DB_PORT) || 3306,
    multipleStatements: true
};

const DB_NAME = 'vijomedix';

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createDatabase(connection) {
    log('\n📦 Creating database...', 'cyan');

    // Drop existing database if exists
    await connection.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    log(`   Dropped existing ${DB_NAME} database (if existed)`, 'yellow');

    // Create fresh database
    await connection.query(`CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    log(`   ✅ Created ${DB_NAME} database`, 'green');

    // Use the database
    await connection.query(`USE ${DB_NAME}`);
}

async function createCoreTables(connection) {
    log('\n📋 Creating core tables...', 'cyan');

    // Users Table
    await connection.query(`
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      branch_id INT NULL,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('superadmin', 'admin', 'receptionist', 'doctor', 'lab', 'pharmacy', 'nurse', 'supervisor', 'radiologist') NOT NULL,
      phone VARCHAR(20) NULL,
      refresh_token TEXT NULL,
      lastLogin TIMESTAMP NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_role (role),
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_branch_id (branch_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ users', 'green');

    // Patients Table
    await connection.query(`
    CREATE TABLE patients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_number VARCHAR(50),
      hospital_id INT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      alternative_phone VARCHAR(20),
      email VARCHAR(255),
      age INT NOT NULL,
      gender ENUM('Male', 'Female', 'Other') NOT NULL,
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
      INDEX idx_phone (phone),
      INDEX idx_id_number (id_number),
      INDEX idx_email (email),
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_patient_number (patient_number),
      UNIQUE KEY unique_patient_per_hospital (hospital_id, id_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ patients', 'green');

    // System Settings Table
    await connection.query(`
    CREATE TABLE system_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      hospital_id INT NULL,
      setting_key VARCHAR(50) NOT NULL,
      setting_value TEXT NOT NULL,
      description VARCHAR(255),
      updated_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_hospital_setting (hospital_id, setting_key),
      UNIQUE KEY unique_setting_per_hospital (hospital_id, setting_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ system_settings', 'green');
}

async function createHospitalTables(connection) {
    log('\n🏥 Creating hospital/multi-tenancy tables...', 'cyan');

    // Hospitals Table
    await connection.query(`
    CREATE TABLE hospitals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Unique hospital identifier for URLs',
      logo_path VARCHAR(500) NULL,
      address TEXT,
      phone VARCHAR(50),
      email VARCHAR(255),
      website VARCHAR(255),
      subscription_status ENUM('trial', 'active', 'suspended', 'cancelled') DEFAULT 'trial',
      subscription_plan ENUM('basic', 'professional', 'enterprise') DEFAULT 'basic',
      subscription_start_date DATE,
      subscription_end_date DATE,
      billing_contact_email VARCHAR(255),
      timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
      currency VARCHAR(10) DEFAULT 'KES',
      date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
      is_active BOOLEAN DEFAULT TRUE,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_code (code),
      INDEX idx_subscription_status (subscription_status),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ hospitals', 'green');

    // Branches Table
    await connection.query(`
    CREATE TABLE branches (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ branches', 'green');

    // Hospital Modules Table
    await connection.query(`
    CREATE TABLE hospital_modules (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ hospital_modules', 'green');

    // Add foreign keys to users table
    await connection.query(`
    ALTER TABLE users
    ADD CONSTRAINT fk_users_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
  `);
    log('   ✅ users foreign keys added', 'green');
}

async function createQueueAndVitalsTables(connection) {
    log('\n📊 Creating queue and vitals tables...', 'cyan');

    // Queue Table
    await connection.query(`
    CREATE TABLE queue (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      branch_id INT NULL,
      patient_id INT NOT NULL,
      department ENUM('doctor', 'nurse', 'lab', 'pharmacy', 'billing') NOT NULL,
      assigned_to INT NULL,
      status ENUM('waiting', 'in_progress', 'done', 'cancelled') DEFAULT 'waiting',
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
      INDEX idx_hospital_dept_status (hospital_id, department, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ queue', 'green');

    // Vitals Table
    await connection.query(`
    CREATE TABLE vitals (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ vitals', 'green');
}

async function createInventoryTables(connection) {
    log('\n💊 Creating inventory tables...', 'cyan');

    // Medicines Table
    await connection.query(`
    CREATE TABLE medicines (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      name VARCHAR(255) NOT NULL,
      barcode VARCHAR(100) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      price DECIMAL(10, 2) NOT NULL,
      expiry_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_barcode (barcode),
      INDEX idx_expiry (expiry_date),
      INDEX idx_name (name),
      UNIQUE KEY unique_barcode_per_hospital (hospital_id, barcode)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ medicines', 'green');

    // Equipment Table
    await connection.query(`
    CREATE TABLE equipment (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      name VARCHAR(255) NOT NULL,
      serial_number VARCHAR(100) NOT NULL,
      purchase_date DATE NOT NULL,
      purchase_price DECIMAL(10, 2) DEFAULT 0,
      quantity INT DEFAULT 1,
      warranty_expiry DATE NULL,
      status ENUM('active', 'maintenance', 'retired', 'broken') DEFAULT 'active',
      location VARCHAR(255),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_serial_number (serial_number),
      INDEX idx_status (status),
      UNIQUE KEY unique_serial_per_hospital (hospital_id, serial_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ equipment', 'green');
}

async function createPrescriptionTables(connection) {
    log('\n💉 Creating prescription tables...', 'cyan');

    // Prescriptions Table
    await connection.query(`
    CREATE TABLE prescriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      queue_id INT NOT NULL,
      patient_id INT NOT NULL,
      doctor_id INT NULL,
      notes TEXT,
      diagnosis TEXT,
      status ENUM('pending', 'dispensed', 'cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_hospital_status (hospital_id, status),
      INDEX idx_status (status),
      INDEX idx_patient_id (patient_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ prescriptions', 'green');

    // Prescription Items
    await connection.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ prescription_items', 'green');

    // Sales Table
    await connection.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ sales', 'green');

    // Sales Items
    await connection.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ sales_items', 'green');

    // Direct Sales
    await connection.query(`
    CREATE TABLE direct_sales (
      id INT PRIMARY KEY AUTO_INCREMENT,
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ direct_sales', 'green');

    // Direct Sale Items
    await connection.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ direct_sale_items', 'green');
}

async function createLabTables(connection) {
    log('\n🔬 Creating lab tables...', 'cyan');

    // Lab Tests Catalog
    await connection.query(`
    CREATE TABLE lab_tests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      test_name VARCHAR(255) NOT NULL,
      test_code VARCHAR(50) NOT NULL,
      category VARCHAR(100),
      price DECIMAL(10, 2) NOT NULL,
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ lab_tests', 'green');

    // Lab Orders
    await connection.query(`
    CREATE TABLE lab_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      queue_id INT NOT NULL,
      patient_id INT NOT NULL,
      doctor_id INT NULL,
      status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_hospital_status (hospital_id, status),
      INDEX idx_status (status),
      INDEX idx_patient_id (patient_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ lab_orders', 'green');

    // Lab Order Items
    await connection.query(`
    CREATE TABLE lab_order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lab_order_id INT NOT NULL,
      lab_test_id INT NOT NULL,
      status ENUM('pending', 'completed') DEFAULT 'pending',
      FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE CASCADE,
      INDEX idx_lab_order_id (lab_order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ lab_order_items', 'green');

    // Lab Test Parameters
    await connection.query(`
    CREATE TABLE lab_test_parameters (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lab_test_id INT NOT NULL,
      parameter_name VARCHAR(255) NOT NULL,
      unit VARCHAR(50),
      normal_range VARCHAR(100),
      FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ lab_test_parameters', 'green');

    // Lab Results
    await connection.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ lab_results', 'green');
}

async function createBillingTables(connection) {
    log('\n💰 Creating billing tables...', 'cyan');

    // Bills Table
    await connection.query(`
    CREATE TABLE bills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      branch_id INT NULL,
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
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_hospital_status (hospital_id, payment_status),
      INDEX idx_patient_id (patient_id),
      INDEX idx_payment_status (payment_status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ bills', 'green');

    // Bill Items
    await connection.query(`
    CREATE TABLE bill_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_id INT NOT NULL,
      medicine_id INT NULL,
      custom_medicine_name VARCHAR(255) NULL,
      item_type ENUM('consultation', 'lab_test', 'medicine', 'radiology') NOT NULL,
      item_id INT NOT NULL,
      description VARCHAR(255) NOT NULL,
      quantity INT DEFAULT 1,
      unit_price DECIMAL(10, 2) NOT NULL,
      subtotal DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL,
      INDEX idx_bill_id (bill_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ bill_items', 'green');

    // Payments
    await connection.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ payments', 'green');
}

async function createAmbulanceTables(connection) {
    log('\n🚑 Creating ambulance tables...', 'cyan');

    // Ambulances Table
    await connection.query(`
    CREATE TABLE ambulances (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      ambulance_number VARCHAR(50) NOT NULL,
      type ENUM('Basic', 'Advanced', 'Mobile ICU', 'Neonatal') NOT NULL,
      status ENUM('Available', 'On Call', 'On Trip', 'Maintenance') DEFAULT 'Available',
      driver_name VARCHAR(255) NOT NULL,
      driver_phone VARCHAR(20) NOT NULL,
      capacity INT NOT NULL,
      equipment TEXT,
      location VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_status (status),
      UNIQUE KEY unique_ambulance_per_hospital (hospital_id, ambulance_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ ambulances', 'green');

    // Ambulance Requests
    await connection.query(`
    CREATE TABLE ambulance_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      patient_id INT NOT NULL,
      requested_by INT NOT NULL,
      request_direction ENUM('INCOMING', 'OUTGOING') NOT NULL DEFAULT 'OUTGOING',
      requester_type ENUM('INTERNAL', 'EXTERNAL') DEFAULT 'INTERNAL',
      approved_by INT NULL,
      ambulance_id INT NULL,
      request_type ENUM('Referral', 'Emergency', 'Transfer', 'Pharmacy Pickup') NOT NULL,
      priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
      pickup_location TEXT NOT NULL,
      destination TEXT NOT NULL,
      patient_name VARCHAR(100),
      patient_phone VARCHAR(20),
      status ENUM('Pending', 'Approved', 'Assigned', 'Dispatched', 'On Route', 'At Pickup', 'On Return', 'Completed', 'Cancelled') DEFAULT 'Pending',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ ambulance_requests', 'green');
}

async function createReferralTable(connection) {
    log('\n📤 Creating referral table...', 'cyan');

    await connection.query(`
    CREATE TABLE referrals (
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
      patient_condition ENUM('Stable', 'Critical', 'Urgent', 'Emergency') DEFAULT 'Stable',
      status ENUM('Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled') DEFAULT 'Pending',
      priority ENUM('Routine', 'Urgent', 'Emergency') DEFAULT 'Routine',
      referral_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE SET NULL,
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_hospital_status (hospital_id, status),
      INDEX idx_patient_id (patient_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ referrals', 'green');
}

async function createChronicCareTables(connection) {
    log('\n❤️ Creating chronic care tables...', 'cyan');

    // Clinics
    await connection.query(`
    CREATE TABLE clinics (
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
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_hospital_id (hospital_id),
      UNIQUE KEY unique_clinic_per_hospital (hospital_id, code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ clinics', 'green');

    // Chronic Enrollments
    await connection.query(`
    CREATE TABLE chronic_enrollments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      patient_id INT NOT NULL,
      clinic_id INT NOT NULL,
      enrolled_by INT NULL,
      enrollment_date DATE NOT NULL,
      status ENUM('active', 'discharged', 'transferred', 'deceased', 'lost_to_follow_up') DEFAULT 'active',
      baseline_notes TEXT,
      discharge_date DATE NULL,
      discharge_reason TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
      FOREIGN KEY (enrolled_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_patient_id (patient_id),
      INDEX idx_clinic_id (clinic_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ chronic_enrollments', 'green');

    // Clinic Visits
    await connection.query(`
    CREATE TABLE clinic_visits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      enrollment_id INT NOT NULL,
      patient_id INT NOT NULL,
      clinic_id INT NOT NULL,
      visit_date DATE NOT NULL,
      visit_type ENUM('scheduled', 'walk_in', 'emergency') DEFAULT 'scheduled',
      recorded_by INT NULL,
      blood_pressure_systolic DECIMAL(5,2) NULL,
      blood_pressure_diastolic DECIMAL(5,2) NULL,
      blood_sugar DECIMAL(5,2) NULL,
      weight DECIMAL(5,2) NULL,
      is_abnormal BOOLEAN DEFAULT FALSE,
      nurse_notes TEXT,
      doctor_notes TEXT,
      status ENUM('recorded', 'reviewed', 'escalated', 'completed') DEFAULT 'recorded',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      FOREIGN KEY (enrollment_id) REFERENCES chronic_enrollments(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
      FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_visit_date (visit_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ clinic_visits', 'green');

    // Follow-Ups
    await connection.query(`
    CREATE TABLE follow_ups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      patient_id INT NOT NULL,
      enrollment_id INT NULL,
      clinic_id INT NULL,
      scheduled_date DATE NOT NULL,
      scheduled_time TIME NULL,
      purpose VARCHAR(255) NOT NULL,
      department ENUM('nurse', 'doctor', 'lab') NOT NULL DEFAULT 'nurse',
      scheduled_by INT NULL,
      notes TEXT,
      status ENUM('scheduled', 'completed', 'missed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ follow_ups', 'green');
}

async function createExpenseTable(connection) {
    log('\n💸 Creating expense table...', 'cyan');

    await connection.query(`
    CREATE TABLE expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      title VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      category ENUM('doctor_salary', 'staff_payment', 'misc') NOT NULL,
      paid_to VARCHAR(255) NOT NULL,
      related_user_id INT NULL,
      expense_date DATE NOT NULL,
      payment_method ENUM('cash', 'bank', 'mpesa', 'cheque') DEFAULT 'cash',
      reference_number VARCHAR(100),
      notes TEXT,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_category (category),
      INDEX idx_expense_date (expense_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ expenses', 'green');
}

async function createAuditAndCashierTables(connection) {
    log('\n📝 Creating audit and cashier tables...', 'cyan');

    // Audit Logs
    await connection.query(`
    CREATE TABLE audit_logs (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ audit_logs', 'green');

    // Cashier Shifts
    await connection.query(`
    CREATE TABLE cashier_shifts (
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
      status ENUM('open', 'closed', 'verified', 'disputed') DEFAULT 'open',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ cashier_shifts', 'green');

    // Shift Transactions
    await connection.query(`
    CREATE TABLE shift_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shift_id INT NOT NULL,
      transaction_type ENUM('payment', 'refund', 'void', 'float_in', 'float_out') NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      payment_method ENUM('cash', 'mpesa', 'card', 'insurance') NOT NULL,
      reference_type VARCHAR(50),
      reference_id INT NULL,
      patient_id INT NULL,
      patient_name VARCHAR(255),
      description TEXT,
      receipt_number VARCHAR(50),
      mpesa_code VARCHAR(50) NULL,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shift_id) REFERENCES cashier_shifts(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_shift (shift_id),
      INDEX idx_payment_method (payment_method)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ shift_transactions', 'green');
}

async function createInsuranceTables(connection) {
    log('\n🏦 Creating insurance tables...', 'cyan');

    // Insurance Providers
    await connection.query(`
    CREATE TABLE insurance_providers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL COMMENT 'NULL for global providers',
      code VARCHAR(20) NOT NULL,
      name VARCHAR(255) NOT NULL,
      type ENUM('government', 'private', 'corporate') NOT NULL DEFAULT 'private',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ insurance_providers', 'green');

    // Patient Insurance
    await connection.query(`
    CREATE TABLE patient_insurance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      provider_id INT NOT NULL,
      member_number VARCHAR(100) NOT NULL,
      member_name VARCHAR(255),
      relationship ENUM('self', 'spouse', 'child', 'parent', 'dependent') DEFAULT 'self',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ patient_insurance', 'green');

    // Insurance Claims
    await connection.query(`
    CREATE TABLE insurance_claims (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      claim_number VARCHAR(50) UNIQUE NOT NULL,
      patient_id INT NOT NULL,
      patient_insurance_id INT NOT NULL,
      provider_id INT NOT NULL,
      claim_type ENUM('outpatient', 'inpatient', 'maternity', 'dental', 'optical', 'pharmacy', 'lab', 'procedure') NOT NULL,
      service_date DATE NOT NULL,
      total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      approved_amount DECIMAL(12,2) DEFAULT 0,
      copay_amount DECIMAL(12,2) DEFAULT 0,
      claimed_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      status ENUM('draft', 'pending', 'submitted', 'processing', 'approved', 'partially_approved', 'rejected', 'paid', 'cancelled') DEFAULT 'draft',
      submitted_at TIMESTAMP NULL,
      submitted_by INT NULL,
      rejection_reason TEXT,
      payment_date DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_insurance_id) REFERENCES patient_insurance(id),
      FOREIGN KEY (provider_id) REFERENCES insurance_providers(id),
      FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_hospital_status (hospital_id, status),
      INDEX idx_patient (patient_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ insurance_claims', 'green');
}

async function createRadiologyTables(connection) {
    log('\n🩻 Creating radiology tables...', 'cyan');

    // Radiology Exams
    await connection.query(`
    CREATE TABLE radiology_exams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      exam_code VARCHAR(50) NOT NULL,
      exam_name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      modality ENUM('X-Ray', 'Ultrasound', 'CT', 'MRI', 'Mammography', 'Fluoroscopy', 'ECG') NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      description TEXT,
      preparation_instructions TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      INDEX idx_hospital_id (hospital_id),
      INDEX idx_modality (modality),
      UNIQUE KEY unique_exam_per_hospital (hospital_id, exam_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ radiology_exams', 'green');

    // Radiology Orders
    await connection.query(`
    CREATE TABLE radiology_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      queue_id INT NOT NULL,
      patient_id INT NOT NULL,
      doctor_id INT NULL,
      exam_id INT NOT NULL,
      clinical_indication TEXT,
      priority ENUM('routine', 'urgent', 'stat') DEFAULT 'routine',
      status ENUM('pending', 'scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    log('   ✅ radiology_orders', 'green');
}

async function insertDefaultData(connection) {
    log('\n📥 Inserting default data...', 'cyan');

    // Insert default hospital
    await connection.query(`
    INSERT INTO hospitals (name, code, address, phone, subscription_status, subscription_plan, is_active)
    VALUES ('Vijomedix Hospital', 'VIJO', 'Nairobi, Kenya', '+254700000000', 'active', 'enterprise', TRUE)
  `);
    const [hospitals] = await connection.query('SELECT id FROM hospitals WHERE code = ?', ['VIJO']);
    const hospitalId = hospitals[0].id;
    log('   ✅ Default hospital created', 'green');

    // Insert default branch
    await connection.query(`
    INSERT INTO branches (hospital_id, name, code, is_main_branch, is_active)
    VALUES (?, 'Main Branch', 'MAIN', TRUE, TRUE)
  `, [hospitalId]);
    const [branches] = await connection.query('SELECT id FROM branches WHERE hospital_id = ? AND is_main_branch = 1', [hospitalId]);
    const branchId = branches[0].id;
    log('   ✅ Default branch created', 'green');

    // Insert superadmin user
    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    await connection.query(`
    INSERT INTO users (username, password, role, hospital_id, branch_id)
    VALUES ('superadmin', ?, 'superadmin', NULL, NULL)
  `, [hashedPassword]);
    log('   ✅ Superadmin user created (username: superadmin, password: superadmin123)', 'green');

    // Insert default admin user for the hospital
    const adminPassword = await bcrypt.hash('admin123', 10);
    await connection.query(`
    INSERT INTO users (username, password, role, hospital_id, branch_id)
    VALUES ('admin', ?, 'admin', ?, ?)
  `, [adminPassword, hospitalId, branchId]);
    log('   ✅ Admin user created (username: admin, password: admin123)', 'green');

    // Insert default modules for the hospital
    const modules = ['core', 'pharmacy', 'laboratory', 'radiology', 'billing', 'inventory',
        'attendance', 'ambulance', 'chronicCare', 'insurance', 'expenses', 'referrals', 'audit'];
    for (const mod of modules) {
        await connection.query(`
      INSERT INTO hospital_modules (hospital_id, module_code, is_enabled, enabled_at)
      VALUES (?, ?, TRUE, NOW())
    `, [hospitalId, mod]);
    }
    log('   ✅ Default modules enabled', 'green');

    // Insert patient number settings
    const patientSettings = [
        ['patient_number_prefix', 'VIJO', 'Prefix for patient numbers'],
        ['patient_number_format', 'PREFIX-SEQUENCE', 'Format: PREFIX-SEQUENCE, YEAR-SEQUENCE, etc.'],
        ['patient_number_padding', '5', 'Number of digits (5 = 00001)'],
        ['patient_number_start', '1', 'Starting number for sequence'],
        ['patient_number_next', '1', 'Next available patient number'],
        ['patient_number_include_year', 'false', 'Include year in patient number'],
        ['consultation_fee', '500', 'Default consultation fee']
    ];
    for (const [key, value, desc] of patientSettings) {
        await connection.query(`
      INSERT INTO system_settings (hospital_id, setting_key, setting_value, description)
      VALUES (?, ?, ?, ?)
    `, [hospitalId, key, value, desc]);
    }
    log('   ✅ Patient number settings configured', 'green');

    // Insert default insurance providers
    const insuranceProviders = [
        ['SHA', 'Social Health Authority (SHA)', 'government'],
        ['NHIF', 'National Hospital Insurance Fund (Legacy)', 'government'],
        ['AAR', 'AAR Insurance', 'private'],
        ['JUBILEE', 'Jubilee Health Insurance', 'private'],
        ['BRITAM', 'Britam Insurance', 'private'],
        ['CIC', 'CIC Insurance', 'private'],
        ['SELF', 'Self Pay / Cash', 'private']
    ];
    for (const [code, name, type] of insuranceProviders) {
        await connection.query(`
      INSERT INTO insurance_providers (code, name, type, is_active)
      VALUES (?, ?, ?, TRUE)
    `, [code, name, type]);
    }
    log('   ✅ Default insurance providers created', 'green');

    // Insert default clinics
    const defaultClinics = [
        ['Diabetes Clinic', 'DM', 'Management of Type 1 and Type 2 Diabetes Mellitus', 30],
        ['Hypertension Clinic', 'HTN', 'Blood pressure monitoring and management', 30],
        ['HIV/AIDS Clinic', 'HIV', 'Comprehensive HIV care and ART management', 30],
        ['Tuberculosis Clinic', 'TB', 'TB treatment and follow-up', 14],
        ['Antenatal Clinic', 'ANC', 'Pregnancy care and maternal health', 28],
        ['Child Wellness Clinic', 'CWC', 'Immunization and child growth monitoring', 30]
    ];
    for (const [name, code, desc, days] of defaultClinics) {
        await connection.query(`
      INSERT INTO clinics (hospital_id, name, code, description, default_follow_up_days, is_active)
      VALUES (?, ?, ?, ?, ?, TRUE)
    `, [hospitalId, name, code, desc, days]);
    }
    log('   ✅ Default clinics created', 'green');
}

async function main() {
    log('\n╔══════════════════════════════════════════════════════════╗', 'blue');
    log('║     VIJOMEDIX DATABASE SETUP SCRIPT                      ║', 'blue');
    log('║     Creating fresh database with all tables              ║', 'blue');
    log('╚══════════════════════════════════════════════════════════╝', 'blue');

    let connection;

    try {
        // Connect to MySQL
        log('\n🔌 Connecting to MySQL (XAMPP)...', 'cyan');
        connection = await mysql.createConnection(DB_CONFIG);
        log('   ✅ Connected successfully', 'green');

        // Create database
        await createDatabase(connection);

        // Create tables in order (respecting foreign keys)
        await createCoreTables(connection);
        await createHospitalTables(connection);
        await createQueueAndVitalsTables(connection);
        await createInventoryTables(connection);
        await createPrescriptionTables(connection);
        await createLabTables(connection);
        await createBillingTables(connection);
        await createAmbulanceTables(connection);
        await createReferralTable(connection);
        await createChronicCareTables(connection);
        await createExpenseTable(connection);
        await createAuditAndCashierTables(connection);
        await createInsuranceTables(connection);
        await createRadiologyTables(connection);

        // Insert default data
        await insertDefaultData(connection);

        log('\n╔══════════════════════════════════════════════════════════╗', 'green');
        log('║     ✅ DATABASE SETUP COMPLETE!                          ║', 'green');
        log('╚══════════════════════════════════════════════════════════╝', 'green');

        log('\n📋 Summary:', 'cyan');
        log('   • Database: vijomedix', 'reset');
        log('   • Tables: 30+ tables created', 'reset');
        log('   • Default hospital: Vijomedix Hospital (code: VIJO)', 'reset');
        log('   • Superadmin: username=superadmin, password=superadmin123', 'reset');
        log('   • Admin: username=admin, password=admin123', 'reset');

        log('\n⚠️  Next Steps:', 'yellow');
        log('   1. Update .env file: DB_NAME=vijomedix', 'reset');
        log('   2. Start backend: npm start', 'reset');
        log('   3. Start frontend: npm run dev', 'reset');
        log('   4. Login at http://localhost:5173/login', 'reset');

    } catch (error) {
        log('\n❌ Error: ' + error.message, 'red');
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            log('\n🔌 Database connection closed\n', 'cyan');
        }
    }
}

// Run the script
main();
