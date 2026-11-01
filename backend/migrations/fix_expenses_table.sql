-- Add hospital_id to expenses table
SET @dbname = DATABASE();
SET @tablename = "expenses";
SET @columnname = "hospital_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE expenses ADD COLUMN hospital_id INT DEFAULT NULL, ADD KEY idx_expenses_hospital (hospital_id), ADD CONSTRAINT fk_expenses_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
