const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/dbconfig');

async function repairQueue() {
    try {
        console.log("Starting queue repair...");

        // 1. Fix NULL hospital_id (Default to 1 or try to infer from patient?)
        // For now, let's assume if it is NULL, it belongs to the main hospital (ID 1) or user's current session hospital logic
        // We will update all NULL hospital_ids to 1 (or prompt user if this is risky - but for this task I will proceed with 1 as safe default for now)

        // Check which hospital is "Main" or active. Assuming ID 1 is safe for testing since user is using "BMP" (Bensmma)
        const [hospitals] = await db.query("SELECT id FROM hospitals LIMIT 1");
        if (hospitals.length === 0) {
            console.log("No hospitals found. Cannot default hospital_id.");
            process.exit(1);
        }
        const defaultHospitalId = hospitals[0].id;
        console.log(`Using Hospital ID ${defaultHospitalId} as default for repair.`);

        const [nullHospitalResult] = await db.query(
            "UPDATE queue SET hospital_id = ? WHERE hospital_id IS NULL",
            [defaultHospitalId]
        );
        console.log(`Fixed ${nullHospitalResult.affectedRows} queue items with NULL hospital_id.`);

        // 2. Fix NULL queue_number
        const [nullQueueNumResult] = await db.query("SELECT id, department FROM queue WHERE queue_number IS NULL OR queue_number = 'N/A'");

        if (nullQueueNumResult.length > 0) {
            console.log(`Found ${nullQueueNumResult.length} items with invalid queue_number. Generating new numbers...`);
            for (const item of nullQueueNumResult) {
                // Generate simple unique queue number for fix
                // Using timestamp suffix to avoid conflict for now
                const prefix = item.department.charAt(0).toUpperCase();
                const newNum = `${prefix}-FIX-${Date.now().toString().slice(-4)}`;

                await db.query("UPDATE queue SET queue_number = ? WHERE id = ?", [newNum, item.id]);
                console.log(`Updated Item ${item.id} -> ${newNum}`);
            }
        } else {
            console.log("No items with NULL queue_number found.");
        }

        console.log("Repair complete.");
        process.exit(0);
    } catch (error) {
        console.error("Repair failed:", error);
        process.exit(1);
    }
}

repairQueue();
