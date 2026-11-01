/**
 * Fix radiology_exams table to match the Sequelize model
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixRadiologyTable() {
    console.log('🔧 Fixing radiology_exams table...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: 'vijomedix'
    });

    try {
        // Check if imaging_type column exists
        const [columns] = await connection.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'vijomedix' 
      AND TABLE_NAME = 'radiology_exams' 
      AND COLUMN_NAME = 'imaging_type'
    `);

        if (columns.length === 0) {
            console.log('Adding imaging_type column...');
            await connection.query(`
        ALTER TABLE radiology_exams 
        ADD COLUMN imaging_type ENUM('xray', 'ultrasound', 'ct_scan', 'mri', 'mammography', 'fluoroscopy', 'ecg', 'doppler', 'other') 
        NOT NULL DEFAULT 'xray' AFTER hospital_id
      `);
            console.log('   ✅ imaging_type added');
        } else {
            console.log('   imaging_type already exists');
        }

        // Check if body_part column exists  
        const [bodyPartCol] = await connection.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'vijomedix' 
      AND TABLE_NAME = 'radiology_exams' 
      AND COLUMN_NAME = 'body_part'
    `);

        if (bodyPartCol.length === 0) {
            console.log('Adding body_part column...');
            await connection.query(`
        ALTER TABLE radiology_exams 
        ADD COLUMN body_part VARCHAR(100) NOT NULL DEFAULT 'General' AFTER exam_name
      `);
            console.log('   ✅ body_part added');
        } else {
            console.log('   body_part already exists');
        }

        // Check if duration_minutes column exists
        const [durationCol] = await connection.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'vijomedix' 
      AND TABLE_NAME = 'radiology_exams' 
      AND COLUMN_NAME = 'duration_minutes'
    `);

        if (durationCol.length === 0) {
            console.log('Adding duration_minutes column...');
            await connection.query(`
        ALTER TABLE radiology_exams 
        ADD COLUMN duration_minutes INT DEFAULT 30 AFTER price
      `);
            console.log('   ✅ duration_minutes added');
        } else {
            console.log('   duration_minutes already exists');
        }

        console.log('\n✅ radiology_exams table fixed!\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

fixRadiologyTable();
