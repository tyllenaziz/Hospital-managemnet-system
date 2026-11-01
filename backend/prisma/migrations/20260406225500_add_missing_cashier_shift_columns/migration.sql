SET @schema_name = DATABASE();

SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'cashier_shifts'
    AND COLUMN_NAME = 'expected_insurance'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE `cashier_shifts` ADD COLUMN `expected_insurance` DECIMAL(12, 2) NULL DEFAULT 0 AFTER `expected_card`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'cashier_shifts'
    AND COLUMN_NAME = 'total_bills_paid'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE `cashier_shifts` ADD COLUMN `total_bills_paid` INTEGER NULL DEFAULT 0 AFTER `total_transactions`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'cashier_shifts'
    AND COLUMN_NAME = 'total_refunds'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE `cashier_shifts` ADD COLUMN `total_refunds` INTEGER NULL DEFAULT 0 AFTER `total_bills_paid`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'cashier_shifts'
    AND COLUMN_NAME = 'verifier_notes'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE `cashier_shifts` ADD COLUMN `verifier_notes` TEXT NULL AFTER `verified_at`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
