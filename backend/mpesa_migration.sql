-- M-Pesa Transactions Table for tracking STK Push payments
-- Run this migration to add M-Pesa support

CREATE TABLE IF NOT EXISTS mpesa_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checkout_request_id VARCHAR(100) UNIQUE NOT NULL,
    merchant_request_id VARCHAR(100),
    phone VARCHAR(15) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    bill_id INT NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    mpesa_receipt VARCHAR(50),
    transaction_date VARCHAR(20),
    result_code INT,
    result_desc VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_checkout_request_id (checkout_request_id),
    INDEX idx_bill_id (bill_id),
    INDEX idx_status (status),
    INDEX idx_phone (phone),
    
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

-- Add comment for documentation
ALTER TABLE mpesa_transactions COMMENT = 'Tracks M-Pesa STK Push transactions for bill payments';
