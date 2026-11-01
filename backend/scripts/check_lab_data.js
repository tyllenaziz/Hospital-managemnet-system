const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/dbconfig');

async function checkData() {
    try {
        const [testCount] = await db.query("SELECT COUNT(*) as count FROM lab_tests");
        const [paramCount] = await db.query("SELECT COUNT(*) as count FROM lab_test_parameters");

        console.log(`Lab Tests: ${testCount[0].count}`);
        console.log(`Lab Parameters: ${paramCount[0].count}`);

        if (testCount[0].count > 0 && paramCount[0].count === 0) {
            console.log("ISSUE CONFIRMED: Tests exist but parameters are missing.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Check failed:", error);
        process.exit(1);
    }
}

checkData();
