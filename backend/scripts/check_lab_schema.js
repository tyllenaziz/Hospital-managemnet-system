const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/dbconfig');

async function checkSchema() {
    try {
        console.log("Checking lab_tests columns...");
        const [columns] = await db.query("SHOW COLUMNS FROM lab_tests");
        const fields = columns.map(c => c.Field);
        console.log("Columns:", fields);

        if (!fields.includes('hospital_id')) {
            console.log("Adding hospital_id to lab_tests...");
            await db.query("ALTER TABLE lab_tests ADD COLUMN hospital_id INT DEFAULT NULL");
            console.log("Added hospital_id column.");
        } else {
            console.log("hospital_id already exists.");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkSchema();
