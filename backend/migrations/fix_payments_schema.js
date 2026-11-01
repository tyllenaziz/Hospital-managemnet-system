const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/dbconfig');

async function fixPaymentsSchema() {
    console.log("Fixing payments schema...");
    const queries = [
        "ALTER TABLE payments ADD COLUMN status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed'",
        "ALTER TABLE payments ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash'",
        "ALTER TABLE payments ADD COLUMN reference_number VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE payments ADD COLUMN received_by INT DEFAULT NULL",
        "ALTER TABLE payments ADD COLUMN transaction_code VARCHAR(100) DEFAULT NULL"
    ];

    for (const query of queries) {
        try {
            await db.query(query);
            console.log(`Executed: ${query}`);
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log(`Column already exists (skipped): ${query}`);
            } else {
                console.error(`Failed to execute: ${query}`, error.message);
            }
        }
    }

    console.log("Payments schema fix complete.");
    process.exit(0);
}

fixPaymentsSchema();
