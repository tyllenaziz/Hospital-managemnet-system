const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  multipleStatements: true
};

// SQL statements array
const sqlStatements = [
  // Users Table
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'receptionist', 'doctor', 'lab', 'pharmacy') NOT NULL,
    phone VARCHAR(20) NULL,
    refresh_token TEXT NULL,
    lastLogin TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Patients Table (Updated version)
  `CREATE TABLE IF NOT EXISTS patients (
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
  )`,

  // Queue Table
  `CREATE TABLE IF NOT EXISTS queue (
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
  )`,

  // Attendance Table
  `CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    check_in_time TIME NULL,
    check_out_time TIME NULL,
    date DATE NOT NULL,
    status ENUM('checked_in', 'checked_out', 'late', 'absent') DEFAULT 'checked_in',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_date (user_id, date),
    INDEX idx_date (date),
    INDEX idx_status (status)
  )`,

  // Medicines Table
  `CREATE TABLE IF NOT EXISTS medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_barcode (barcode),
    INDEX idx_expiry (expiry_date)
  )`,

  // Equipment Table
  `CREATE TABLE IF NOT EXISTS equipment (
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
  )`,

  // Prescriptions Table
  `CREATE TABLE IF NOT EXISTS prescriptions (
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
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
  )`,

  // Prescription Items
  `CREATE TABLE IF NOT EXISTS prescription_items (
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
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
  )`,

  // Sales/Dispensing Records
  `CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    pharmacist_id INT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'insurance', 'mpesa') DEFAULT 'cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (pharmacist_id) REFERENCES users(id) ON DELETE SET NULL
  )`,

  // Sales Items
  `CREATE TABLE IF NOT EXISTS sales_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
  )`,

  // Lab Tests Catalog
  `CREATE TABLE IF NOT EXISTS lab_tests (
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
    INDEX idx_test_code (test_code)
  )`,

  // Lab Orders
  `CREATE TABLE IF NOT EXISTS lab_orders (
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
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
  )`,

  // Lab Order Items
  `CREATE TABLE IF NOT EXISTS lab_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_order_id INT NOT NULL,
    lab_test_id INT NOT NULL,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE CASCADE
  )`,

  // Lab Results
  `CREATE TABLE IF NOT EXISTS lab_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_order_item_id INT NOT NULL,
    result_value VARCHAR(255),
    remarks TEXT,
    is_abnormal BOOLEAN DEFAULT FALSE,
    tested_by INT NULL,
    tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_order_item_id) REFERENCES lab_order_items(id) ON DELETE CASCADE,
    FOREIGN KEY (tested_by) REFERENCES users(id) ON DELETE SET NULL
  )`,

  // Bills
  `CREATE TABLE IF NOT EXISTS bills (
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
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  )`,

  // Bill Items
  `CREATE TABLE IF NOT EXISTS bill_items (
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
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL
  )`,

  // Payments
  `CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'insurance', 'mpesa') NOT NULL,
    reference_number VARCHAR(100),
    received_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
  )`,

  // Direct Sales
  `CREATE TABLE IF NOT EXISTS direct_sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash',
    sold_by INT NULL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sold_by) REFERENCES users(id) ON DELETE SET NULL
  )`,

  // Direct Sale Items
  `CREATE TABLE IF NOT EXISTS direct_sale_items (
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
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
  )`,

  // Referrals
  `CREATE TABLE IF NOT EXISTS referrals (
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
    current_medications TEXT COMMENT 'Current medications',
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
  )`,

  // Ambulances
  `CREATE TABLE IF NOT EXISTS ambulances (
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
  )`,

  // Ambulance Requests
  `CREATE TABLE IF NOT EXISTS ambulance_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    requested_by INT NOT NULL COMMENT 'User ID who requested',
    request_direction ENUM('INCOMING', 'OUTGOING') NOT NULL DEFAULT 'OUTGOING',
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
    expected_pickup_time DATETIME,
    patient_condition TEXT,
    emergency_details TEXT,
    vital_signs JSON,
    symptoms JSON,
    medical_history TEXT,
    current_medications TEXT,
    allergies TEXT,
    required_equipment TEXT COMMENT 'JSON array of required equipment',
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
    INDEX idx_created_at (created_at)
  )`
];

// Stored procedure for auto-expiring old queue items
const createStoredProcedure = `
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS expire_old_queue_items()
BEGIN
  UPDATE queue 
  SET status = 'cancelled', 
      notes = CONCAT(IFNULL(notes, ''), '\\n[AUTO-EXPIRED: Queue item older than 24 hours]'),
      updated_at = CURRENT_TIMESTAMP
  WHERE status IN ('waiting', 'in_progress')
    AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
  SELECT ROW_COUNT() as expired_count;
END$$
DELIMITER ;
`;

// Create event for auto-expiring queue items
const createEvent = `
CREATE EVENT IF NOT EXISTS auto_expire_queue
ON SCHEDULE EVERY 1 HOUR
DO CALL expire_old_queue_items()
`;

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!\n');

    // Create all tables
    for (let i = 0; i < sqlStatements.length; i++) {
      const tableName = sqlStatements[i].match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/)?.[1];
      try {
        console.log(`📝 Creating table: ${tableName}...`);
        await connection.execute(sqlStatements[i]);
        console.log(`✅ Table ${tableName} created successfully`);
      } catch (err) {
        console.error(`❌ Error creating table ${tableName}:`, err.message);
      }
    }

    // Note: Stored procedures and events need special handling
    console.log('\n⚠️  Note: Stored procedures and events need to be created manually');
    console.log('   Run these separately if needed:');
    console.log('   - expire_old_queue_items() stored procedure');
    console.log('   - auto_expire_queue event');
    console.log('   - Enable event scheduler: SET GLOBAL event_scheduler = ON;');

    console.log('\n✨ Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the setup
setupDatabase();