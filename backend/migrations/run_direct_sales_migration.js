const db = require('../config/dbconfig');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'add_hospital_id_to_direct_sales.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon to run statements individually
        const statements = sql.split(';').filter(stmt => stmt.trim() !== '');

        for (const stmt of statements) {
            if (stmt.trim()) {
                try {
                    await db.query(stmt);
                    console.log(`Executed: ${stmt.substring(0, 50)}...`);
                } catch (err) {
                    if (err.code === 'ER_DUP_FIELDNAME') {
                        console.log('Column already exists, skipping.');
                    } else if (err.code === 'ER_DUP_KEYNAME') {
                        console.log('Key already exists, skipping.');
                    } else {
                        console.log(`Error executing statement: ${stmt.substring(0, 50)}...`);
                        console.log(err.message);
                    }
                }
            }
        }

        console.log('Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
