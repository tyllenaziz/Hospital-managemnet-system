-- =====================================================
-- VIJOMEDIX PLATFORM MANAGEMENT SCHEMA
-- Super Admin, Hospitals, Branches, Hospital Modules
-- =====================================================

-- Add superadmin and radiologist to users role enum
ALTER TABLE users 
MODIFY COLUMN role 
ENUM('superadmin', 'admin', 'receptionist', 'doctor', 'lab', 'pharmacy', 'nurse', 'supervisor', 'radiologist') 
NOT NULL;

-- Hospitals Table - Each hospital on the platform
CREATE TABLE IF NOT EXISTS hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL COMMENT 'Used in URL query param',
  logo_path VARCHAR(255) NULL,
  address TEXT,
  city VARCHAR(100),
  county VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Kenya',
  phone VARCHAR(20),
  alternative_phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(255),
  license_number VARCHAR(100),
  tax_pin VARCHAR(50),
  
  -- Operational settings
  consultation_fee DECIMAL(10, 2) DEFAULT 500.00,
  currency VARCHAR(10) DEFAULT 'KES',
  timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  subscription_status ENUM('trial', 'active', 'suspended', 'expired') DEFAULT 'trial',
  subscription_expires_at DATE NULL,
  
  -- Metadata
  created_by INT NULL COMMENT 'Super Admin who created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_code (code),
  INDEX idx_is_active (is_active),
  INDEX idx_subscription_status (subscription_status)
);

-- Branches Table - Each hospital can have multiple branches
CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL COMMENT 'Branch code within hospital',
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(20),
  is_main_branch BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  UNIQUE KEY unique_branch_code (hospital_id, code),
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_is_active (is_active)
);

-- Hospital Modules Table - Module subscriptions per hospital
CREATE TABLE IF NOT EXISTS hospital_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  module_code VARCHAR(50) NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  enabled_by INT NULL COMMENT 'Super Admin who enabled',
  enabled_at TIMESTAMP NULL,
  config_data JSON NULL COMMENT 'Module-specific settings',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  UNIQUE KEY unique_hospital_module (hospital_id, module_code),
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_module_code (module_code),
  INDEX idx_is_enabled (is_enabled)
);

-- Add hospital_id and branch_id to users table
ALTER TABLE users 
ADD COLUMN hospital_id INT NULL AFTER role,
ADD COLUMN branch_id INT NULL AFTER hospital_id,
ADD FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
ADD FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
ADD INDEX idx_hospital_id (hospital_id),
ADD INDEX idx_branch_id (branch_id);

-- Insert default Super Admin user (password: superadmin123)
-- Note: In production, change this password immediately!
INSERT INTO users (username, password, role, hospital_id, branch_id) 
VALUES ('superadmin', '$2b$10$rIC/EXqQw.HBQYVn0A0Zz.kqF5HgjxNH.8OvZaOBWoFV5U1VV5Z/C', 'superadmin', NULL, NULL)
ON DUPLICATE KEY UPDATE role = 'superadmin';

-- Create a default hospital for existing data migration
INSERT INTO hospitals (name, code, is_active, subscription_status)
VALUES ('Default Hospital', 'DEFAULT', TRUE, 'active')
ON DUPLICATE KEY UPDATE name = name;

-- Create main branch for default hospital
INSERT INTO branches (hospital_id, name, code, is_main_branch, is_active)
SELECT id, 'Main Branch', 'MAIN', TRUE, TRUE FROM hospitals WHERE code = 'DEFAULT'
ON DUPLICATE KEY UPDATE name = name;

-- Update existing users to belong to default hospital (if they don't have one)
UPDATE users 
SET hospital_id = (SELECT id FROM hospitals WHERE code = 'DEFAULT'),
    branch_id = (SELECT id FROM branches WHERE code = 'MAIN' AND hospital_id = (SELECT id FROM hospitals WHERE code = 'DEFAULT'))
WHERE hospital_id IS NULL AND role != 'superadmin';
