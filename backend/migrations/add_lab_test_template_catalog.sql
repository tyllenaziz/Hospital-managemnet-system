CREATE TABLE IF NOT EXISTS lab_test_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_name VARCHAR(255) NOT NULL,
  test_code VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  default_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  normal_range TEXT,
  unit VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_lab_test_template_code (test_code),
  INDEX idx_lab_test_templates_category (category),
  INDEX idx_lab_test_templates_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lab_test_template_parameters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  parameter_name VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  normal_range VARCHAR(255),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_lab_test_template_parameter (template_id, parameter_name),
  INDEX idx_lab_test_template_parameters_template (template_id),
  CONSTRAINT fk_lab_test_template_parameters_template
    FOREIGN KEY (template_id) REFERENCES lab_test_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE lab_tests
  ADD COLUMN IF NOT EXISTS template_id INT NULL AFTER hospital_id,
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT FALSE AFTER description,
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE AFTER is_enabled,
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP NULL AFTER is_custom;

ALTER TABLE lab_test_parameters
  ADD COLUMN IF NOT EXISTS template_parameter_id INT NULL AFTER lab_test_id;

CREATE UNIQUE INDEX IF NOT EXISTS unique_hospital_template_test
  ON lab_tests (hospital_id, template_id);

CREATE INDEX IF NOT EXISTS idx_lab_tests_template_id
  ON lab_tests (template_id);

CREATE INDEX IF NOT EXISTS idx_lab_tests_hospital_enabled
  ON lab_tests (hospital_id, is_enabled);

CREATE INDEX IF NOT EXISTS idx_lab_test_parameters_template_parameter
  ON lab_test_parameters (template_parameter_id);
