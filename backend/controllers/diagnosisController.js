const db = require('../config/dbconfig');

// Search diagnosis codes by code or description
exports.searchDiagnoses = async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;

        if (!q || q.length < 2) {
            return res.json({ success: true, diagnoses: [] });
        }

        const searchTerm = `%${q}%`;
        const limitNum = Math.min(parseInt(limit) || 20, 50);

        // Search using LIKE for partial matching
        const [results] = await db.query(
            `SELECT id, code, description, category, is_common 
       FROM diagnosis_codes 
       WHERE code LIKE ? OR description LIKE ?
       ORDER BY 
         CASE WHEN code LIKE ? THEN 0 ELSE 1 END,
         is_common DESC,
         code
       LIMIT ?`,
            [searchTerm, searchTerm, `${q}%`, limitNum]
        );

        res.json({
            success: true,
            diagnoses: results,
            total: results.length
        });
    } catch (error) {
        console.error('Error searching diagnoses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search diagnoses'
        });
    }
};

// Get common/frequently used diagnoses
exports.getCommonDiagnoses = async (req, res) => {
    try {
        const { category, limit = 50 } = req.query;
        const limitNum = Math.min(parseInt(limit) || 50, 100);

        let query = `SELECT id, code, description, category, is_common 
                 FROM diagnosis_codes 
                 WHERE is_common = TRUE`;
        const params = [];

        if (category) {
            query += ` AND category = ?`;
            params.push(category);
        }

        query += ` ORDER BY category, code LIMIT ?`;
        params.push(limitNum);

        const [results] = await db.query(query, params);

        res.json({
            success: true,
            diagnoses: results,
            total: results.length
        });
    } catch (error) {
        console.error('Error fetching common diagnoses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch common diagnoses'
        });
    }
};

// Get all diagnosis categories
exports.getCategories = async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT DISTINCT category, COUNT(*) as count 
       FROM diagnosis_codes 
       GROUP BY category 
       ORDER BY count DESC`
        );

        res.json({
            success: true,
            categories: results
        });
    } catch (error) {
        console.error('Error fetching diagnosis categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    }
};

// Get a single diagnosis by ID
exports.getDiagnosis = async (req, res) => {
    try {
        const { id } = req.params;

        const [results] = await db.query(
            `SELECT id, code, description, category, is_common 
       FROM diagnosis_codes 
       WHERE id = ?`,
            [id]
        );

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Diagnosis not found'
            });
        }

        res.json({
            success: true,
            diagnosis: results[0]
        });
    } catch (error) {
        console.error('Error fetching diagnosis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch diagnosis'
        });
    }
};

// Get diagnoses for a prescription
exports.getPrescriptionDiagnoses = async (req, res) => {
    try {
        const { prescriptionId } = req.params;

        const [results] = await db.query(
            `SELECT pd.id, pd.prescription_id, pd.diagnosis_code_id, 
              pd.custom_diagnosis, pd.is_primary,
              dc.code, dc.description, dc.category
       FROM prescription_diagnoses pd
       LEFT JOIN diagnosis_codes dc ON pd.diagnosis_code_id = dc.id
       WHERE pd.prescription_id = ?
       ORDER BY pd.is_primary DESC, pd.id`,
            [prescriptionId]
        );

        res.json({
            success: true,
            diagnoses: results
        });
    } catch (error) {
        console.error('Error fetching prescription diagnoses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch prescription diagnoses'
        });
    }
};

// Add diagnoses to a prescription
exports.addPrescriptionDiagnoses = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { prescriptionId } = req.params;
        const { diagnoses } = req.body;

        if (!diagnoses || !Array.isArray(diagnoses)) {
            return res.status(400).json({
                success: false,
                error: 'Diagnoses array is required'
            });
        }

        await connection.beginTransaction();

        // First, clear existing diagnoses for this prescription
        await connection.query(
            `DELETE FROM prescription_diagnoses WHERE prescription_id = ?`,
            [prescriptionId]
        );

        // Insert new diagnoses
        for (const diag of diagnoses) {
            await connection.query(
                `INSERT INTO prescription_diagnoses 
         (prescription_id, diagnosis_code_id, custom_diagnosis, is_primary)
         VALUES (?, ?, ?, ?)`,
                [
                    prescriptionId,
                    diag.diagnosis_code_id || null,
                    diag.custom_diagnosis || null,
                    diag.is_primary || false
                ]
            );
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Diagnoses updated successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error adding prescription diagnoses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add prescription diagnoses'
        });
    } finally {
        connection.release();
    }
};
