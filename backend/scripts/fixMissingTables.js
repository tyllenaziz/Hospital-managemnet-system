/**
 * Quick fix script to add missing tables
 * Run this after setupDatabase.js to add tables used by legacy models
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: 'vijomedix',
    multipleStatements: true
};

async function fixMissingTables() {
    console.log('🔧 Fixing missing tables...\n');

    const connection = await mysql.createConnection(DB_CONFIG);

    try {
        // Add module_config table (used by ModuleConfig.js model)
        console.log('Creating module_config table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS module_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_code VARCHAR(50) NOT NULL UNIQUE,
        module_name VARCHAR(100) NOT NULL,
        description TEXT,
        category ENUM('core', 'clinical', 'financial', 'operations') DEFAULT 'clinical',
        is_enabled BOOLEAN DEFAULT FALSE,
        is_required BOOLEAN DEFAULT FALSE,
        config_data JSON,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('   ✅ module_config created');

        // Add hospital_config table (used by HospitalConfig.js model)
        console.log('Creating hospital_config table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS hospital_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hospital_name VARCHAR(255) NOT NULL,
        hospital_code VARCHAR(50) UNIQUE,
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('   ✅ hospital_config created');

        // Add radiology_templates table (used by RadiologyOrder.js model)
        console.log('Creating radiology_templates table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS radiology_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        template_name VARCHAR(255) NOT NULL,
        imaging_type ENUM('xray', 'ultrasound', 'ct_scan', 'mri', 'mammography', 'fluoroscopy', 'ecg', 'doppler', 'other') NOT NULL,
        body_part VARCHAR(100),
        template_content TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('   ✅ radiology_templates created');

        // Add sync tables (used by SyncQueue.js model)
        console.log('Creating sync_queue table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INT AUTO_INCREMENT PRIMARY KEY,
        operation_type ENUM('create', 'update', 'delete') NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NOT NULL,
        payload JSON,
        status ENUM('pending', 'syncing', 'synced', 'failed', 'conflict') DEFAULT 'pending',
        retry_count INT DEFAULT 0,
        max_retries INT DEFAULT 3,
        error_message TEXT,
        local_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_entity (entity_type, entity_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('   ✅ sync_queue created');

        console.log('Creating sync_metadata table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL UNIQUE,
        last_sync_timestamp TIMESTAMP NULL,
        last_server_cursor VARCHAR(255),
        sync_status ENUM('idle', 'syncing', 'error') DEFAULT 'idle',
        records_synced INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('   ✅ sync_metadata created');

        console.log('Creating sync_conflicts table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS sync_conflicts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NOT NULL,
        local_data JSON,
        server_data JSON,
        conflict_type ENUM('update_conflict', 'delete_conflict', 'create_conflict') NOT NULL,
        resolution ENUM('pending', 'local_wins', 'server_wins', 'merged', 'skipped') DEFAULT 'pending',
        resolved_by INT,
        resolved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_resolution (resolution)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('   ✅ sync_conflicts created');

        // Add diagnosis_codes table if missing
        console.log('Creating diagnosis_codes table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS diagnosis_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('   ✅ diagnosis_codes created');

        // Add attendance table if missing
        console.log('Creating attendance table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        status ENUM('present', 'absent', 'late', 'half_day', 'on_leave') DEFAULT 'present',
        device_id VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_date (user_id, date),
        INDEX idx_user_id (user_id),
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('   ✅ attendance created');

        // Insert default hospital config
        console.log('Inserting default hospital config...');
        await connection.query(`
      INSERT INTO hospital_config (hospital_name, hospital_code, currency, timezone)
      VALUES ('Vijomedix Hospital', 'VIJO', 'KES', 'Africa/Nairobi')
      ON DUPLICATE KEY UPDATE hospital_name = VALUES(hospital_name)
    `);
        console.log('   ✅ hospital_config data inserted');

        console.log('\n✅ All missing tables fixed!\n');

    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

fixMissingTables();
