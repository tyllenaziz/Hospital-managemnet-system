ALTER TABLE prescriptions ADD COLUMN hospital_id INT DEFAULT NULL;
ALTER TABLE prescriptions ADD CONSTRAINT fk_prescriptions_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL;
