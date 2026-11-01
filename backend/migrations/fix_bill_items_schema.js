const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/dbconfig');

async function fixSchema() {
    console.log("Fixing bill_items schema...");
    const queries = [
        "ALTER TABLE bill_items ADD COLUMN amount DECIMAL(10, 2) DEFAULT 0",
        "ALTER TABLE bill_items ADD COLUMN subtotal DECIMAL(10, 2) DEFAULT 0",
        "ALTER TABLE bill_items ADD COLUMN item_type VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE bill_items ADD COLUMN description VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE bill_items ADD COLUMN queue_id INT DEFAULT NULL"
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

    console.log("Schema fix complete.");
    process.exit(0);
}

fixSchema();
