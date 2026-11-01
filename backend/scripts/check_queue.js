const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/dbconfig');

async function checkQueue() {
    try {
        console.log("Fetching last 5 queue entries...");
        const [rows] = await db.query("SELECT id, patient_id, queue_number, status, hospital_id, created_at FROM queue ORDER BY id DESC LIMIT 5");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Check failed:", error);
        process.exit(1);
    }
}

checkQueue();
