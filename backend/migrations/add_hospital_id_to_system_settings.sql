ALTER TABLE system_settings ADD COLUMN hospital_id INT DEFAULT NULL;
ALTER TABLE system_settings ADD CONSTRAINT fk_settings_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;
