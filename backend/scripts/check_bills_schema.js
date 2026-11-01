const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/dbconfig');

async function checkBillsSchema() {
    try {
        console.log("Fetching columns for 'bills' table...");
        const [columns] = await db.query("SHOW COLUMNS FROM bills");
        console.log("Columns:", columns.map(c => c.Field));
        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

checkBillsSchema();
