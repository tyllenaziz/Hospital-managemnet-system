ALTER TABLE `vitals`
    MODIFY `blood_pressure_systolic` DECIMAL(5, 2) NULL,
    MODIFY `blood_pressure_diastolic` DECIMAL(5, 2) NULL,
    MODIFY `temperature` DECIMAL(4, 2) NULL,
    MODIFY `weight` DECIMAL(5, 2) NULL,
    MODIFY `height` DECIMAL(5, 2) NULL,
    MODIFY `blood_sugar` DECIMAL(5, 2) NULL,
    MODIFY `bmi` DECIMAL(5, 2) NULL;

ALTER TABLE `clinic_visits`
    MODIFY `blood_pressure_systolic` DECIMAL(5, 2) NULL,
    MODIFY `blood_pressure_diastolic` DECIMAL(5, 2) NULL,
    MODIFY `blood_sugar` DECIMAL(5, 2) NULL,
    MODIFY `weight` DECIMAL(5, 2) NULL;
