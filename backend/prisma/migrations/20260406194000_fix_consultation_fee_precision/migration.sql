ALTER TABLE `hospitals`
    MODIFY `consultation_fee` DECIMAL(10, 2) NULL DEFAULT 500.00;

ALTER TABLE `bills`
    MODIFY `consultation_fee` DECIMAL(10, 2) NULL DEFAULT 0.00;

ALTER TABLE `hospital_config`
    MODIFY `consultation_fee` DECIMAL(10, 2) NULL DEFAULT 500.00;
