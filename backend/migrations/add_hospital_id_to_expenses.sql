ALTER TABLE expenses ADD COLUMN hospital_id INT DEFAULT NULL;
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL;
