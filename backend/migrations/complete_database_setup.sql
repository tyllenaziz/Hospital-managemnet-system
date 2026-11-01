-- =====================================================
-- COMPLETE DATABASE SETUP (BASE + PLATFORM + MULTI-TENANCY)
-- =====================================================
-- Usage (MySQL CLI):
--   mysql -u <user> -p <database> < backend/migrations/complete_database_setup.sql
--
-- This file provides a single entry point by chaining:
-- 1) base schema
-- 2) platform + multi-tenant migrations
-- 3) final hot-path index + tenant receipt settings hardening
-- =====================================================

-- NOTE: `SOURCE` is resolved by the MySQL client.
SOURCE backend/schema.sql;
SOURCE backend/migrations/run_all_migrations.sql;

-- =====================================================
-- PART 3: ENTERPRISE HOT-PATH COMPOSITE INDEXES (IDEMPOTENT)
-- =====================================================
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

CALL create_index_if_not_exists('queue', 'idx_queue_hospital_dept_status_created', 'hospital_id, department, status, created_at');
CALL create_index_if_not_exists('bills', 'idx_bills_hospital_created_status', 'hospital_id, created_at, payment_status');
CALL create_index_if_not_exists('prescriptions', 'idx_prescriptions_hospital_status_created', 'hospital_id, status, created_at');
CALL create_index_if_not_exists('patients', 'idx_patients_hospital_created', 'hospital_id, created_at');

-- =====================================================
-- PART 4: RECEIPT SETTINGS FOR ALL HOSPITALS (IDEMPOTENT)
-- =====================================================
INSERT INTO system_settings (hospital_id, setting_key, setting_value, description)
SELECT h.id, 'receipt_prefix', CONCAT(UPPER(SUBSTRING(h.code, 1, 4)), '-RCP'), 'Prefix for payment receipts'
FROM hospitals h
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO system_settings (hospital_id, setting_key, setting_value, description)
SELECT h.id, 'receipt_next', '1', 'Next receipt sequence number'
FROM hospitals h
ON DUPLICATE KEY UPDATE setting_value = setting_value;

DROP PROCEDURE IF EXISTS create_index_if_not_exists;

SELECT 'Complete database setup finished successfully' AS status;
