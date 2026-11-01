const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/dbconfig');

async function verifyAndFixSchema() {
    try {
        console.log("Fetching columns for 'bill_items' table...");
        const [columns] = await db.query("SHOW COLUMNS FROM bill_items");
        const existingColumns = columns.map(c => c.Field);
        console.log("Existing columns:", existingColumns);

        const requiredColumns = [
            { name: 'amount', definition: 'DECIMAL(10, 2) DEFAULT 0' },
            { name: 'subtotal', definition: 'DECIMAL(10, 2) DEFAULT 0' },
            { name: 'item_type', definition: 'VARCHAR(50) DEFAULT NULL' },
            { name: 'description', definition: 'VARCHAR(255) DEFAULT NULL' }
        ];

        for (const col of requiredColumns) {
            if (!existingColumns.includes(col.name)) {
                console.log(`Missing column: ${col.name}. Adding it...`);
                try {
                    await db.query(`ALTER TABLE bill_items ADD COLUMN ${col.name} ${col.definition}`);
                    console.log(`Successfully added ${col.name}`);
                } catch (alterError) {
                    console.error(`Failed to add ${col.name}:`, alterError.message);
                }
            } else {
                console.log(`Column ${col.name} exists.`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verifyAndFixSchema();
