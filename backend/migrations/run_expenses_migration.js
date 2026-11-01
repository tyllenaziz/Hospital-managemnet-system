const db = require('../config/dbconfig');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'fix_expenses_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split statements by semicolon, but handle the complex prepared statement logic carefully
        // Since the SQL file uses variables and PREPARE/EXECUTE, it's best to run as one block if the driver supports it, 
        // or we can just simplify the JS to do the check.

        // Let's rely on JS to check for column existence first, it's safer/simpler than complex SQL parsing in node
        console.log("Checking expenses table schema...");
        const [columns] = await db.query("SHOW COLUMNS FROM expenses LIKE 'hospital_id'");

        if (columns.length === 0) {
            console.log("Adding hospital_id to expenses table...");
            await db.query(`
        ALTER TABLE expenses 
        ADD COLUMN hospital_id INT DEFAULT NULL,
        ADD INDEX idx_expenses_hospital (hospital_id),
        ADD CONSTRAINT fk_expenses_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL
      `);
            console.log("Successfully added hospital_id to expenses table.");
        } else {
            console.log("hospital_id column already exists in expenses table. Skipping.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
