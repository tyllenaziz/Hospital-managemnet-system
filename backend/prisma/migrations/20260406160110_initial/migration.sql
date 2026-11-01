-- CreateTable
CREATE TABLE `hospitals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `logo_path` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `county` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL DEFAULT 'Kenya',
    `phone` VARCHAR(191) NULL,
    `alternative_phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `license_number` VARCHAR(191) NULL,
    `tax_pin` VARCHAR(191) NULL,
    `consultation_fee` DECIMAL(65, 30) NULL DEFAULT 500,
    `subscription_status` ENUM('trial', 'active', 'suspended', 'cancelled', 'expired') NULL DEFAULT 'trial',
    `subscription_plan` ENUM('basic', 'professional', 'enterprise') NULL DEFAULT 'basic',
    `subscription_start_date` DATETIME(3) NULL,
    `subscription_end_date` DATETIME(3) NULL,
    `subscription_expires_at` DATETIME(3) NULL,
    `billing_contact_email` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NULL DEFAULT 'Africa/Nairobi',
    `currency` VARCHAR(191) NULL DEFAULT 'KES',
    `date_format` VARCHAR(191) NULL DEFAULT 'DD/MM/YYYY',
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_code`(`code`),
    INDEX `idx_subscription_status`(`subscription_status`),
    INDEX `idx_is_active`(`is_active`),
    UNIQUE INDEX `uk_hospital_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `is_main_branch` BOOLEAN NULL DEFAULT false,
    `is_active` BOOLEAN NULL DEFAULT true,
    `supervisor_id` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_code`(`code`),
    UNIQUE INDEX `unique_branch_code`(`hospital_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hospital_modules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NOT NULL,
    `module_code` VARCHAR(191) NOT NULL,
    `module_name` VARCHAR(191) NOT NULL,
    `is_enabled` BOOLEAN NULL DEFAULT false,
    `enabled_at` DATETIME(3) NULL,
    `enabled_by` INTEGER NULL,
    `config_data` JSON NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_module_code`(`module_code`),
    UNIQUE INDEX `unique_hospital_module`(`hospital_id`, `module_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `branch_id` INTEGER NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('superadmin', 'admin', 'receptionist', 'doctor', 'lab', 'pharmacy', 'nurse', 'supervisor', 'radiologist') NOT NULL,
    `phone` VARCHAR(191) NULL,
    `refresh_token` VARCHAR(191) NULL,
    `lastLogin` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_username`(`username`),
    INDEX `idx_role`(`role`),
    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_branch_id`(`branch_id`),
    UNIQUE INDEX `uk_username`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_number` VARCHAR(191) NULL,
    `hospital_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `alternative_phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `age` INTEGER NOT NULL,
    `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
    `id_number` VARCHAR(191) NOT NULL,
    `next_of_kin_name` VARCHAR(191) NULL,
    `next_of_kin_phone` VARCHAR(191) NULL,
    `next_of_kin_relationship` VARCHAR(191) NULL,
    `county` VARCHAR(191) NULL,
    `town` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `house_number` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_phone`(`phone`),
    INDEX `idx_id_number`(`id_number`),
    INDEX `idx_email`(`email`),
    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_patient_number`(`patient_number`),
    INDEX `idx_patients_hospital_created`(`hospital_id`, `created_at`),
    UNIQUE INDEX `unique_patient_per_hospital`(`hospital_id`, `id_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_test_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `test_name` VARCHAR(191) NOT NULL,
    `test_code` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `default_price` DECIMAL(65, 30) NULL DEFAULT 0,
    `normal_range` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_lab_test_templates_category`(`category`),
    INDEX `idx_lab_test_templates_active`(`is_active`),
    UNIQUE INDEX `uk_lab_test_template_code`(`test_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_test_template_parameters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_id` INTEGER NOT NULL,
    `parameter_name` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NULL,
    `normal_range` VARCHAR(191) NULL,
    `sort_order` INTEGER NULL DEFAULT 0,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_lab_test_template_parameters_template`(`template_id`),
    UNIQUE INDEX `uk_lab_test_template_parameter`(`template_id`, `parameter_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `setting_key` VARCHAR(191) NOT NULL,
    `setting_value` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `updated_by` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_hospital_setting`(`hospital_id`, `setting_key`),
    UNIQUE INDEX `unique_setting_per_hospital`(`hospital_id`, `setting_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `queue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `branch_id` INTEGER NULL,
    `patient_id` INTEGER NOT NULL,
    `department` ENUM('doctor', 'nurse', 'lab', 'pharmacy', 'billing') NOT NULL,
    `assigned_to` INTEGER NULL,
    `status` ENUM('waiting', 'in_progress', 'done', 'cancelled') NULL DEFAULT 'waiting',
    `queue_number` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `diagnosis` VARCHAR(191) NULL,
    `prescription` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_department_status`(`department`, `status`),
    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_hospital_dept_status`(`hospital_id`, `department`, `status`),
    INDEX `idx_queue_hospital_dept_status_created`(`hospital_id`, `department`, `status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vitals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `queue_id` INTEGER NOT NULL,
    `patient_id` INTEGER NOT NULL,
    `recorded_by` INTEGER NOT NULL,
    `blood_pressure_systolic` DECIMAL(65, 30) NULL,
    `blood_pressure_diastolic` DECIMAL(65, 30) NULL,
    `temperature` DECIMAL(65, 30) NULL,
    `pulse_rate` INTEGER NULL,
    `respiratory_rate` INTEGER NULL,
    `weight` DECIMAL(65, 30) NULL,
    `height` DECIMAL(65, 30) NULL,
    `blood_sugar` DECIMAL(65, 30) NULL,
    `oxygen_saturation` INTEGER NULL,
    `bmi` DECIMAL(65, 30) NULL,
    `notes` VARCHAR(191) NULL,
    `drug_allergies` VARCHAR(191) NULL,
    `updated_by` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_queue_id`(`queue_id`),
    INDEX `idx_patient_id`(`patient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medicines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `barcode` VARCHAR(191) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `price` DECIMAL(65, 30) NOT NULL,
    `expiry_date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_barcode`(`barcode`),
    INDEX `idx_expiry`(`expiry_date`),
    INDEX `idx_name`(`name`),
    UNIQUE INDEX `unique_barcode_per_hospital`(`hospital_id`, `barcode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `serial_number` VARCHAR(191) NOT NULL,
    `purchase_date` DATETIME(3) NOT NULL,
    `purchase_price` DECIMAL(65, 30) NULL DEFAULT 0,
    `quantity` INTEGER NULL DEFAULT 1,
    `warranty_expiry` DATETIME(3) NULL,
    `status` ENUM('active', 'maintenance', 'retired', 'broken') NULL DEFAULT 'active',
    `location` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_serial_number`(`serial_number`),
    INDEX `idx_status`(`status`),
    UNIQUE INDEX `unique_serial_per_hospital`(`hospital_id`, `serial_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `queue_id` INTEGER NOT NULL,
    `patient_id` INTEGER NOT NULL,
    `doctor_id` INTEGER NULL,
    `notes` VARCHAR(191) NULL,
    `diagnosis` VARCHAR(191) NULL,
    `status` ENUM('pending', 'dispensed', 'cancelled') NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_hospital_status`(`hospital_id`, `status`),
    INDEX `idx_status`(`status`),
    INDEX `idx_patient_id`(`patient_id`),
    INDEX `idx_prescriptions_hospital_status_created`(`hospital_id`, `status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescription_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prescription_id` INTEGER NOT NULL,
    `medicine_id` INTEGER NULL,
    `custom_medicine_name` VARCHAR(191) NULL,
    `custom_price` DECIMAL(65, 30) NULL,
    `quantity` INTEGER NOT NULL,
    `dosage` VARCHAR(191) NULL,
    `duration` VARCHAR(191) NULL,
    `instructions` VARCHAR(191) NULL,

    INDEX `idx_prescription_id`(`prescription_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `prescription_id` INTEGER NOT NULL,
    `pharmacist_id` INTEGER NULL,
    `total_amount` DECIMAL(65, 30) NOT NULL,
    `payment_method` ENUM('cash', 'card', 'insurance', 'mpesa') NULL DEFAULT 'cash',
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sale_id` INTEGER NOT NULL,
    `medicine_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(65, 30) NOT NULL,
    `subtotal` DECIMAL(65, 30) NOT NULL,

    INDEX `idx_sale_id`(`sale_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direct_sales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `branch_id` INTEGER NULL,
    `total_amount` DECIMAL(65, 30) NOT NULL,
    `payment_method` VARCHAR(191) NULL DEFAULT 'cash',
    `sold_by` INTEGER NULL,
    `sale_date` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_sale_date`(`sale_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direct_sale_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sale_id` INTEGER NOT NULL,
    `medicine_id` INTEGER NULL,
    `medicine_name` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `price` DECIMAL(65, 30) NOT NULL,
    `unit_price` DECIMAL(65, 30) NULL,
    `total` DECIMAL(65, 30) NOT NULL,
    `is_custom` BOOLEAN NULL DEFAULT false,

    INDEX `idx_sale_id`(`sale_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_tests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `template_id` INTEGER NULL,
    `test_name` VARCHAR(191) NOT NULL,
    `test_code` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `price` DECIMAL(65, 30) NOT NULL,
    `normal_range` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `is_enabled` BOOLEAN NULL DEFAULT false,
    `is_custom` BOOLEAN NULL DEFAULT false,
    `synced_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_lab_tests_template_id`(`template_id`),
    INDEX `idx_test_code`(`test_code`),
    INDEX `idx_category`(`category`),
    INDEX `idx_lab_tests_hospital_enabled`(`hospital_id`, `is_enabled`),
    UNIQUE INDEX `unique_hospital_template_test`(`hospital_id`, `template_id`),
    UNIQUE INDEX `unique_test_code_per_hospital`(`hospital_id`, `test_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `queue_id` INTEGER NOT NULL,
    `patient_id` INTEGER NOT NULL,
    `doctor_id` INTEGER NULL,
    `status` ENUM('pending', 'in_progress', 'completed', 'cancelled') NULL DEFAULT 'pending',
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_hospital_status`(`hospital_id`, `status`),
    INDEX `idx_status`(`status`),
    INDEX `idx_patient_id`(`patient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lab_order_id` INTEGER NOT NULL,
    `lab_test_id` INTEGER NOT NULL,
    `status` ENUM('pending', 'completed') NULL DEFAULT 'pending',

    INDEX `idx_lab_order_id`(`lab_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_test_parameters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lab_test_id` INTEGER NOT NULL,
    `template_parameter_id` INTEGER NULL,
    `parameter_name` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NULL,
    `normal_range` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_lab_test_id`(`lab_test_id`),
    INDEX `idx_lab_test_parameters_template_parameter`(`template_parameter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_results` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lab_order_item_id` INTEGER NOT NULL,
    `lab_test_parameter_id` INTEGER NOT NULL,
    `result_value` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `is_abnormal` BOOLEAN NULL DEFAULT false,
    `tested_by` INTEGER NULL,
    `tested_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `radiology_exams` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `imaging_type` ENUM('xray', 'ultrasound', 'ct_scan', 'mri', 'mammography', 'fluoroscopy', 'ecg', 'doppler', 'other') NOT NULL DEFAULT 'xray',
    `exam_code` VARCHAR(191) NOT NULL,
    `exam_name` VARCHAR(191) NOT NULL,
    `body_part` VARCHAR(191) NOT NULL DEFAULT 'General',
    `category` VARCHAR(191) NULL,
    `modality` ENUM('X_Ray', 'Ultrasound', 'CT', 'MRI', 'Mammography', 'Fluoroscopy', 'ECG') NOT NULL,
    `price` DECIMAL(65, 30) NOT NULL,
    `duration_minutes` INTEGER NULL DEFAULT 30,
    `description` VARCHAR(191) NULL,
    `preparation_instructions` VARCHAR(191) NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_modality`(`modality`),
    UNIQUE INDEX `unique_exam_per_hospital`(`hospital_id`, `exam_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `radiology_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `queue_id` INTEGER NOT NULL,
    `patient_id` INTEGER NOT NULL,
    `doctor_id` INTEGER NULL,
    `exam_id` INTEGER NOT NULL,
    `clinical_indication` VARCHAR(191) NULL,
    `priority` ENUM('routine', 'urgent', 'stat') NULL DEFAULT 'routine',
    `status` ENUM('pending', 'scheduled', 'in_progress', 'completed', 'cancelled') NULL DEFAULT 'pending',
    `scheduled_at` DATETIME(3) NULL,
    `performed_by` INTEGER NULL,
    `performed_at` DATETIME(3) NULL,
    `findings` VARCHAR(191) NULL,
    `impression` VARCHAR(191) NULL,
    `recommendations` VARCHAR(191) NULL,
    `reported_by` INTEGER NULL,
    `reported_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_hospital_status`(`hospital_id`, `status`),
    INDEX `idx_status`(`status`),
    INDEX `idx_patient_id`(`patient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `radiology_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_name` VARCHAR(191) NOT NULL,
    `imaging_type` ENUM('xray', 'ultrasound', 'ct_scan', 'mri', 'mammography', 'fluoroscopy', 'ecg', 'doppler', 'other') NOT NULL,
    `body_part` VARCHAR(191) NULL,
    `template_content` VARCHAR(191) NOT NULL,
    `is_default` BOOLEAN NULL DEFAULT false,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bills` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `branch_id` INTEGER NULL,
    `patient_id` INTEGER NOT NULL,
    `queue_id` INTEGER NULL,
    `total_amount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `consultation_fee` DECIMAL(65, 30) NULL DEFAULT 0,
    `lab_fee` DECIMAL(65, 30) NULL DEFAULT 0,
    `pharmacy_fee` DECIMAL(65, 30) NULL DEFAULT 0,
    `discount` DECIMAL(65, 30) NULL DEFAULT 0,
    `final_amount` DECIMAL(65, 30) NOT NULL,
    `payment_status` ENUM('pending', 'partial', 'paid') NULL DEFAULT 'pending',
    `payment_method` ENUM('cash', 'card', 'insurance', 'mpesa') NULL DEFAULT 'cash',
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_hospital_status`(`hospital_id`, `payment_status`),
    INDEX `idx_patient_id`(`patient_id`),
    INDEX `idx_payment_status`(`payment_status`),
    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_bills_hospital_created_status`(`hospital_id`, `created_at`, `payment_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bill_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bill_id` INTEGER NOT NULL,
    `queue_id` INTEGER NULL,
    `medicine_id` INTEGER NULL,
    `custom_medicine_name` VARCHAR(191) NULL,
    `item_type` ENUM('consultation', 'lab_test', 'medicine', 'radiology') NOT NULL,
    `item_id` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NULL DEFAULT 1,
    `unit_price` DECIMAL(65, 30) NOT NULL,
    `amount` DECIMAL(65, 30) NULL DEFAULT 0,
    `subtotal` DECIMAL(65, 30) NOT NULL,

    INDEX `idx_bill_id`(`bill_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bill_id` INTEGER NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `payment_method` ENUM('cash', 'card', 'insurance', 'mpesa') NOT NULL,
    `reference_number` VARCHAR(191) NULL,
    `transaction_code` VARCHAR(191) NULL,
    `status` ENUM('pending', 'completed', 'failed', 'refunded') NULL DEFAULT 'completed',
    `received_by` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_bill_id`(`bill_id`),
    INDEX `idx_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mpesa_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `checkout_request_id` VARCHAR(191) NOT NULL,
    `merchant_request_id` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `bill_id` INTEGER NOT NULL,
    `status` ENUM('pending', 'completed', 'failed', 'cancelled') NULL DEFAULT 'pending',
    `mpesa_receipt` VARCHAR(191) NULL,
    `transaction_date` VARCHAR(191) NULL,
    `result_code` INTEGER NULL,
    `result_desc` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_checkout_request_id`(`checkout_request_id`),
    INDEX `idx_bill_id`(`bill_id`),
    INDEX `idx_hospital_id`(`hospital_id`),
    UNIQUE INDEX `uk_checkout_request`(`checkout_request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ambulances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `ambulance_number` VARCHAR(191) NOT NULL,
    `type` ENUM('Basic', 'Advanced', 'Mobile_ICU', 'Neonatal') NOT NULL,
    `status` ENUM('Available', 'On_Call', 'On_Trip', 'Maintenance') NULL DEFAULT 'Available',
    `driver_name` VARCHAR(191) NOT NULL,
    `driver_phone` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `equipment` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_status`(`status`),
    UNIQUE INDEX `unique_ambulance_per_hospital`(`hospital_id`, `ambulance_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ambulance_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `patient_id` INTEGER NOT NULL,
    `requested_by` INTEGER NOT NULL,
    `request_direction` ENUM('INCOMING', 'OUTGOING') NOT NULL DEFAULT 'OUTGOING',
    `requester_type` ENUM('INTERNAL', 'EXTERNAL') NULL DEFAULT 'INTERNAL',
    `approved_by` INTEGER NULL,
    `ambulance_id` INTEGER NULL,
    `request_type` ENUM('Referral', 'Emergency', 'Transfer', 'Pharmacy_Pickup') NOT NULL,
    `priority` ENUM('Low', 'Medium', 'High', 'Critical') NULL DEFAULT 'Medium',
    `pickup_location` VARCHAR(191) NOT NULL,
    `destination` VARCHAR(191) NOT NULL,
    `patient_name` VARCHAR(191) NULL,
    `patient_phone` VARCHAR(191) NULL,
    `status` ENUM('Pending', 'Approved', 'Assigned', 'Dispatched', 'On_Route', 'At_Pickup', 'On_Return', 'Completed', 'Cancelled') NULL DEFAULT 'Pending',
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_hospital_status`(`hospital_id`, `status`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referrals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `patient_id` INTEGER NOT NULL,
    `doctor_id` INTEGER NOT NULL,
    `queue_id` INTEGER NULL,
    `referring_hospital` VARCHAR(191) NOT NULL,
    `referred_to_hospital` VARCHAR(191) NOT NULL,
    `referred_to_department` VARCHAR(191) NULL,
    `referral_reason` VARCHAR(191) NOT NULL,
    `clinical_summary` VARCHAR(191) NOT NULL,
    `diagnosis` VARCHAR(191) NULL,
    `patient_condition` ENUM('Stable', 'Critical', 'Urgent', 'Emergency') NULL DEFAULT 'Stable',
    `status` ENUM('Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled') NULL DEFAULT 'Pending',
    `priority` ENUM('Routine', 'Urgent', 'Emergency') NULL DEFAULT 'Routine',
    `referral_date` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_hospital_status`(`hospital_id`, `status`),
    INDEX `idx_patient_id`(`patient_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clinics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `default_follow_up_days` INTEGER NULL DEFAULT 30,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    UNIQUE INDEX `unique_clinic_per_hospital`(`hospital_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chronic_enrollments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `patient_id` INTEGER NOT NULL,
    `clinic_id` INTEGER NOT NULL,
    `enrolled_by` INTEGER NULL,
    `enrollment_date` DATETIME(3) NOT NULL,
    `status` ENUM('active', 'discharged', 'transferred', 'deceased', 'lost_to_follow_up') NULL DEFAULT 'active',
    `baseline_notes` VARCHAR(191) NULL,
    `discharge_date` DATETIME(3) NULL,
    `discharge_reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_patient_id`(`patient_id`),
    INDEX `idx_clinic_id`(`clinic_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clinic_visits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `enrollment_id` INTEGER NOT NULL,
    `patient_id` INTEGER NOT NULL,
    `clinic_id` INTEGER NOT NULL,
    `visit_date` DATETIME(3) NOT NULL,
    `visit_type` ENUM('scheduled', 'walk_in', 'emergency') NULL DEFAULT 'scheduled',
    `recorded_by` INTEGER NULL,
    `blood_pressure_systolic` DECIMAL(65, 30) NULL,
    `blood_pressure_diastolic` DECIMAL(65, 30) NULL,
    `blood_sugar` DECIMAL(65, 30) NULL,
    `weight` DECIMAL(65, 30) NULL,
    `is_abnormal` BOOLEAN NULL DEFAULT false,
    `nurse_notes` VARCHAR(191) NULL,
    `doctor_notes` VARCHAR(191) NULL,
    `status` ENUM('recorded', 'reviewed', 'escalated', 'completed') NULL DEFAULT 'recorded',
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_visit_date`(`visit_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `follow_ups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `patient_id` INTEGER NOT NULL,
    `enrollment_id` INTEGER NULL,
    `clinic_id` INTEGER NULL,
    `scheduled_date` DATETIME(3) NOT NULL,
    `scheduled_time` VARCHAR(191) NULL,
    `purpose` VARCHAR(191) NOT NULL,
    `department` ENUM('nurse', 'doctor', 'lab') NOT NULL DEFAULT 'nurse',
    `scheduled_by` INTEGER NULL,
    `notes` VARCHAR(191) NULL,
    `status` ENUM('scheduled', 'completed', 'missed', 'cancelled', 'rescheduled') NULL DEFAULT 'scheduled',
    `completed_at` DATETIME(3) NULL,
    `reminder_sent` BOOLEAN NULL DEFAULT false,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_scheduled_date`(`scheduled_date`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `category` ENUM('doctor_salary', 'staff_payment', 'misc') NOT NULL,
    `paid_to` VARCHAR(191) NOT NULL,
    `related_user_id` INTEGER NULL,
    `expense_date` DATETIME(3) NOT NULL,
    `payment_method` ENUM('cash', 'bank', 'mpesa', 'cheque') NULL DEFAULT 'cash',
    `reference_number` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_category`(`category`),
    INDEX `idx_expense_date`(`expense_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `user_id` INTEGER NULL,
    `username` VARCHAR(191) NULL,
    `user_role` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(191) NOT NULL,
    `entity_id` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_user_id`(`user_id`),
    INDEX `idx_action`(`action`),
    INDEX `idx_entity`(`entity_type`, `entity_id`),
    INDEX `idx_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cashier_shifts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `user_id` INTEGER NOT NULL,
    `shift_date` DATETIME(3) NOT NULL,
    `opening_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closing_time` DATETIME(3) NULL,
    `opening_balance` DECIMAL(65, 30) NULL DEFAULT 0,
    `expected_cash` DECIMAL(65, 30) NULL DEFAULT 0,
    `expected_mpesa` DECIMAL(65, 30) NULL DEFAULT 0,
    `expected_card` DECIMAL(65, 30) NULL DEFAULT 0,
    `total_expected` DECIMAL(65, 30) NULL DEFAULT 0,
    `actual_cash` DECIMAL(65, 30) NULL,
    `actual_mpesa` DECIMAL(65, 30) NULL,
    `actual_card` DECIMAL(65, 30) NULL,
    `cash_variance` DECIMAL(65, 30) NULL,
    `total_transactions` INTEGER NULL DEFAULT 0,
    `status` ENUM('open', 'closed', 'verified', 'disputed') NULL DEFAULT 'open',
    `cashier_notes` VARCHAR(191) NULL,
    `verified_by` INTEGER NULL,
    `verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_user_date`(`user_id`, `shift_date`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shift_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shift_id` INTEGER NOT NULL,
    `transaction_type` ENUM('payment', 'refund', 'void', 'float_in', 'float_out') NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `payment_method` ENUM('cash', 'mpesa', 'card', 'insurance') NOT NULL,
    `reference_type` VARCHAR(191) NULL,
    `reference_id` INTEGER NULL,
    `patient_id` INTEGER NULL,
    `patient_name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `receipt_number` VARCHAR(191) NULL,
    `mpesa_code` VARCHAR(191) NULL,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_shift`(`shift_id`),
    INDEX `idx_payment_method`(`payment_method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `insurance_providers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('government', 'private', 'corporate') NOT NULL DEFAULT 'private',
    `contact_email` VARCHAR(191) NULL,
    `contact_phone` VARCHAR(191) NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `requires_preauth` BOOLEAN NULL DEFAULT false,
    `payment_terms_days` INTEGER NULL DEFAULT 30,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    UNIQUE INDEX `unique_provider_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient_insurance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `provider_id` INTEGER NOT NULL,
    `member_number` VARCHAR(191) NOT NULL,
    `member_name` VARCHAR(191) NULL,
    `relationship` ENUM('self', 'spouse', 'child', 'parent', 'dependent') NULL DEFAULT 'self',
    `national_id` VARCHAR(191) NULL,
    `scheme_name` VARCHAR(191) NULL,
    `coverage_start_date` DATETIME(3) NULL,
    `coverage_end_date` DATETIME(3) NULL,
    `annual_limit` DECIMAL(65, 30) NULL,
    `is_verified` BOOLEAN NULL DEFAULT false,
    `is_primary` BOOLEAN NULL DEFAULT true,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_patient`(`patient_id`),
    INDEX `idx_member_number`(`member_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `insurance_claims` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `claim_number` VARCHAR(191) NOT NULL,
    `patient_id` INTEGER NOT NULL,
    `patient_insurance_id` INTEGER NOT NULL,
    `provider_id` INTEGER NOT NULL,
    `claim_type` ENUM('outpatient', 'inpatient', 'maternity', 'dental', 'optical', 'pharmacy', 'lab', 'procedure') NOT NULL,
    `service_date` DATETIME(3) NOT NULL,
    `total_amount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `approved_amount` DECIMAL(65, 30) NULL DEFAULT 0,
    `copay_amount` DECIMAL(65, 30) NULL DEFAULT 0,
    `claimed_amount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `status` ENUM('draft', 'pending', 'submitted', 'processing', 'approved', 'partially_approved', 'rejected', 'paid', 'cancelled') NULL DEFAULT 'draft',
    `submitted_at` DATETIME(3) NULL,
    `submitted_by` INTEGER NULL,
    `rejection_reason` VARCHAR(191) NULL,
    `payment_date` DATETIME(3) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_hospital_status`(`hospital_id`, `status`),
    INDEX `idx_patient`(`patient_id`),
    INDEX `idx_status`(`status`),
    UNIQUE INDEX `uk_claim_number`(`claim_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `claim_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `claim_id` INTEGER NOT NULL,
    `service_description` VARCHAR(191) NOT NULL,
    `service_date` DATETIME(3) NOT NULL,
    `quantity` INTEGER NULL DEFAULT 1,
    `unit_cost` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `total_cost` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `approved_amount` DECIMAL(65, 30) NULL DEFAULT 0,
    `status` ENUM('pending', 'approved', 'rejected') NULL DEFAULT 'pending',
    `rejection_reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_claim_id`(`claim_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `preauthorizations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER NULL,
    `patient_id` INTEGER NOT NULL,
    `patient_insurance_id` INTEGER NOT NULL,
    `provider_id` INTEGER NOT NULL,
    `preauth_number` VARCHAR(191) NULL,
    `service_type` VARCHAR(191) NOT NULL,
    `diagnosis` VARCHAR(191) NULL,
    `estimated_cost` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `approved_amount` DECIMAL(65, 30) NULL DEFAULT 0,
    `status` ENUM('pending', 'approved', 'rejected', 'expired') NULL DEFAULT 'pending',
    `valid_from` DATETIME(3) NULL,
    `valid_until` DATETIME(3) NULL,
    `requested_by` INTEGER NULL,
    `approved_by_provider` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_hospital_id`(`hospital_id`),
    INDEX `idx_patient`(`patient_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diagnosis_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `is_common` BOOLEAN NULL DEFAULT false,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_code`(`code`),
    INDEX `idx_category`(`category`),
    UNIQUE INDEX `uk_diag_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescription_diagnoses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prescription_id` INTEGER NOT NULL,
    `diagnosis_code_id` INTEGER NULL,
    `custom_diagnosis` VARCHAR(191) NULL,
    `is_primary` BOOLEAN NULL DEFAULT false,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_prescription_id`(`prescription_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_queue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `operation_type` ENUM('create', 'update', 'delete') NOT NULL,
    `entity_type` VARCHAR(191) NOT NULL,
    `entity_id` INTEGER NOT NULL,
    `payload` JSON NULL,
    `status` ENUM('pending', 'syncing', 'synced', 'failed', 'conflict') NULL DEFAULT 'pending',
    `retry_count` INTEGER NULL DEFAULT 0,
    `max_retries` INTEGER NULL DEFAULT 3,
    `error_message` VARCHAR(191) NULL,
    `local_timestamp` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `synced_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_status`(`status`),
    INDEX `idx_entity`(`entity_type`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_metadata` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entity_type` VARCHAR(191) NOT NULL,
    `last_sync_timestamp` DATETIME(3) NULL,
    `last_server_cursor` VARCHAR(191) NULL,
    `sync_status` ENUM('idle', 'syncing', 'error') NULL DEFAULT 'idle',
    `records_synced` INTEGER NULL DEFAULT 0,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `uk_entity_type`(`entity_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_conflicts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entity_type` VARCHAR(191) NOT NULL,
    `entity_id` INTEGER NOT NULL,
    `local_data` JSON NULL,
    `server_data` JSON NULL,
    `conflict_type` ENUM('update_conflict', 'delete_conflict', 'create_conflict') NOT NULL,
    `resolution` ENUM('pending', 'local_wins', 'server_wins', 'merged', 'skipped') NULL DEFAULT 'pending',
    `resolved_by` INTEGER NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_entity`(`entity_type`, `entity_id`),
    INDEX `idx_resolution`(`resolution`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `module_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `module_code` VARCHAR(191) NOT NULL,
    `module_name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` ENUM('core', 'clinical', 'financial', 'operations') NULL DEFAULT 'clinical',
    `is_enabled` BOOLEAN NULL DEFAULT false,
    `is_required` BOOLEAN NULL DEFAULT false,
    `config_data` JSON NULL,
    `display_order` INTEGER NULL DEFAULT 0,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `uk_module_code`(`module_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hospital_config` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `hospital_name` VARCHAR(191) NOT NULL,
    `hospital_code` VARCHAR(191) NULL,
    `logo_path` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `county` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL DEFAULT 'Kenya',
    `phone` VARCHAR(191) NULL,
    `alternative_phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `tagline` VARCHAR(191) NULL,
    `license_number` VARCHAR(191) NULL,
    `tax_pin` VARCHAR(191) NULL,
    `consultation_fee` DECIMAL(65, 30) NULL DEFAULT 500,
    `primary_color` VARCHAR(191) NULL DEFAULT '#3B82F6',
    `secondary_color` VARCHAR(191) NULL DEFAULT '#1E40AF',
    `currency` VARCHAR(191) NULL DEFAULT 'KES',
    `timezone` VARCHAR(191) NULL DEFAULT 'Africa/Nairobi',
    `date_format` VARCHAR(191) NULL DEFAULT 'DD/MM/YYYY',
    `time_format` VARCHAR(191) NULL DEFAULT 'HH:mm',
    `fiscal_year_start` INTEGER NULL DEFAULT 1,
    `receipt_prefix` VARCHAR(191) NULL DEFAULT 'RCP',
    `invoice_prefix` VARCHAR(191) NULL DEFAULT 'INV',
    `patient_id_prefix` VARCHAR(191) NULL DEFAULT 'PAT',
    `smtp_host` VARCHAR(191) NULL,
    `smtp_port` INTEGER NULL,
    `smtp_user` VARCHAR(191) NULL,
    `smtp_pass` VARCHAR(191) NULL,
    `sms_provider` VARCHAR(191) NULL,
    `sms_api_key` VARCHAR(191) NULL,
    `sms_sender_id` VARCHAR(191) NULL,
    `setup_completed` BOOLEAN NULL DEFAULT false,
    `setup_step` INTEGER NULL DEFAULT 0,
    `cloud_sync_enabled` BOOLEAN NULL DEFAULT false,
    `last_sync_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `uk_hospital_code`(`hospital_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `check_in` VARCHAR(191) NULL,
    `check_out` VARCHAR(191) NULL,
    `status` ENUM('present', 'absent', 'late', 'half_day', 'on_leave') NULL DEFAULT 'present',
    `device_id` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `idx_user_id`(`user_id`),
    INDEX `idx_date`(`date`),
    UNIQUE INDEX `unique_user_date`(`user_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
