const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/dbconfig');

async function verifySchema() {
    try {
        console.log("Fetching columns for 'bill_items' table...");
        const [columns] = await db.query("SHOW COLUMNS FROM bill_items");
        console.log("Columns:", columns.map(c => c.Field));

        const hasQueueId = columns.some(c => c.Field === 'queue_id');
        console.log("Has queue_id:", hasQueueId);

        if (!hasQueueId) {
            console.log("Attempting to add queue_id column directly...");
            await db.query("ALTER TABLE bill_items ADD COLUMN queue_id INT DEFAULT NULL");
            console.log("Column added.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verifySchema();
