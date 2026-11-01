ALTER TABLE direct_sales ADD COLUMN hospital_id INT DEFAULT NULL;
ALTER TABLE direct_sales ADD CONSTRAINT fk_direct_sales_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL;
