const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/dbconfig');

async function verifySchema() {
    try {
        console.log("Fetching columns for 'expenses' table...");
        const [columns] = await db.query("SHOW COLUMNS FROM expenses");
        console.log("Columns:", columns.map(c => c.Field));

        const hasHospitalId = columns.some(c => c.Field === 'hospital_id');
        console.log("Has hospital_id:", hasHospitalId);

        if (!hasHospitalId) {
            console.log("Attempting to add hospital_id column directly...");
            await db.query("ALTER TABLE expenses ADD COLUMN hospital_id INT DEFAULT NULL");
            console.log("Column added.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verifySchema();
