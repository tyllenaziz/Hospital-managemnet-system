ALTER TABLE `lab_test_templates`
    MODIFY `default_price` DECIMAL(10, 2) NULL DEFAULT 0.00;

ALTER TABLE `medicines`
    MODIFY `price` DECIMAL(10, 2) NOT NULL;

ALTER TABLE `equipment`
    MODIFY `purchase_price` DECIMAL(10, 2) NULL DEFAULT 0.00;

ALTER TABLE `prescription_items`
    MODIFY `custom_price` DECIMAL(10, 2) NULL;

ALTER TABLE `sales`
    MODIFY `total_amount` DECIMAL(10, 2) NOT NULL;

ALTER TABLE `sales_items`
    MODIFY `unit_price` DECIMAL(10, 2) NOT NULL,
    MODIFY `subtotal` DECIMAL(10, 2) NOT NULL;

ALTER TABLE `direct_sales`
    MODIFY `total_amount` DECIMAL(10, 2) NOT NULL;

ALTER TABLE `direct_sale_items`
    MODIFY `price` DECIMAL(10, 2) NOT NULL,
    MODIFY `unit_price` DECIMAL(10, 2) NULL,
    MODIFY `total` DECIMAL(10, 2) NOT NULL;

ALTER TABLE `lab_tests`
    MODIFY `price` DECIMAL(10, 2) NOT NULL;

ALTER TABLE `radiology_exams`
    MODIFY `price` DECIMAL(10, 2) NOT NULL;

ALTER TABLE `bills`
    MODIFY `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    MODIFY `lab_fee` DECIMAL(10, 2) NULL DEFAULT 0.00,
    MODIFY `pharmacy_fee` DECIMAL(10, 2) NULL DEFAULT 0.00,
    MODIFY `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    MODIFY `final_amount` DECIMAL(10, 2) NOT NULL;

ALTER TABLE `bill_items`
    MODIFY `unit_price` DECIMAL(10, 2) NOT NULL,
    MODIFY `amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    MODIFY `subtotal` DECIMAL(10, 2) NOT NULL;

ALTER TABLE `payments`
    MODIFY `amount` DECIMAL(10, 2) NOT NULL;

ALTER TABLE `mpesa_transactions`
    MODIFY `amount` DECIMAL(10, 2) NOT NULL;

ALTER TABLE `expenses`
    MODIFY `amount` DECIMAL(10, 2) NOT NULL;

ALTER TABLE `cashier_shifts`
    MODIFY `opening_balance` DECIMAL(12, 2) NULL DEFAULT 0.00,
    MODIFY `expected_cash` DECIMAL(12, 2) NULL DEFAULT 0.00,
    MODIFY `expected_mpesa` DECIMAL(12, 2) NULL DEFAULT 0.00,
    MODIFY `expected_card` DECIMAL(12, 2) NULL DEFAULT 0.00,
    MODIFY `total_expected` DECIMAL(12, 2) NULL DEFAULT 0.00,
    MODIFY `actual_cash` DECIMAL(12, 2) NULL,
    MODIFY `actual_mpesa` DECIMAL(12, 2) NULL,
    MODIFY `actual_card` DECIMAL(12, 2) NULL,
    MODIFY `cash_variance` DECIMAL(12, 2) NULL;

ALTER TABLE `shift_transactions`
    MODIFY `amount` DECIMAL(12, 2) NOT NULL;

ALTER TABLE `patient_insurance`
    MODIFY `annual_limit` DECIMAL(12, 2) NULL;

ALTER TABLE `insurance_claims`
    MODIFY `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    MODIFY `approved_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    MODIFY `copay_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    MODIFY `claimed_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

ALTER TABLE `claim_items`
    MODIFY `unit_cost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    MODIFY `total_cost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    MODIFY `approved_amount` DECIMAL(12, 2) NULL DEFAULT 0.00;

ALTER TABLE `preauthorizations`
    MODIFY `estimated_cost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    MODIFY `approved_amount` DECIMAL(12, 2) NULL DEFAULT 0.00;
