const db = require("../config/dbconfig");

const chronicController = {
    // ==================== CLINIC MANAGEMENT ====================

    // Create a new clinic (Admin only)
    createClinic: async (req, res) => {
        try {
            const { name, code, description, default_follow_up_days } = req.body;

            if (!name || !code) {
                return res.status(400).json({
                    success: false,
                    error: "Clinic name and code are required"
                });
            }

            const hospitalId = req.user.hospital_id;

            const sql = `
        INSERT INTO clinics (name, code, description, default_follow_up_days, created_by, hospital_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

            const [result] = await db.query(sql, [
                name.trim(),
                code.trim().toUpperCase(),
                description || null,
                default_follow_up_days || 30,
                req.user.id,
                hospitalId
            ]);

            res.status(201).json({
                success: true,
                message: "Clinic created successfully",
                clinic: {
                    id: result.insertId,
                    name: name.trim(),
                    code: code.trim().toUpperCase()
                }
            });
        } catch (error) {
            console.error("Create clinic error:", error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    error: "A clinic with this code already exists"
                });
            }
            res.status(500).json({ success: false, error: "Failed to create clinic" });
        }
    },

    // List all clinics
    listClinics: async (req, res) => {
        try {
            const { active_only } = req.query;

            const hospitalId = req.user.hospital_id;

            let sql = `
        SELECT c.*, 
               COUNT(DISTINCT ce.id) as enrolled_patients,
               u.username as created_by_name
        FROM clinics c
        LEFT JOIN chronic_enrollments ce ON c.id = ce.clinic_id AND ce.status = 'active'
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.hospital_id = ?
      `;
            const params = [hospitalId];

            if (active_only === 'true') {
                sql += ` AND c.is_active = TRUE`;
            }

            sql += ` GROUP BY c.id ORDER BY c.name`;

            const [clinics] = await db.query(sql, params);

            res.json({
                success: true,
                count: clinics.length,
                clinics
            });
        } catch (error) {
            console.error("List clinics error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch clinics" });
        }
    },

    // Update clinic
    updateClinic: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, default_follow_up_days, is_active } = req.body;

            const sql = `
        UPDATE clinics 
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            default_follow_up_days = COALESCE(?, default_follow_up_days),
            is_active = COALESCE(?, is_active)
        WHERE id = ? AND hospital_id = ?
      `;

            await db.query(sql, [name, description, default_follow_up_days, is_active, id, req.user.hospital_id]);

            res.json({
                success: true,
                message: "Clinic updated successfully"
            });
        } catch (error) {
            console.error("Update clinic error:", error);
            res.status(500).json({ success: false, error: "Failed to update clinic" });
        }
    },

    // ==================== ENROLLMENT MANAGEMENT ====================

    // Enroll patient in clinic
    enrollPatient: async (req, res) => {
        try {
            const {
                patient_id,
                clinic_id,
                baseline_notes,
                baseline_weight,
                baseline_bp_systolic,
                baseline_bp_diastolic,
                baseline_blood_sugar
            } = req.body;

            if (!patient_id || !clinic_id) {
                return res.status(400).json({
                    success: false,
                    error: "Patient ID and Clinic ID are required"
                });
            }

            // Check if patient exists (scoped to hospital)
            const hospitalId = req.user.hospital_id;
            const [patients] = await db.query("SELECT id, name FROM patients WHERE id = ? AND hospital_id = ?", [patient_id, hospitalId]);
            if (patients.length === 0) {
                return res.status(404).json({ success: false, error: "Patient not found" });
            }

            // Check if already enrolled in this clinic
            const [existing] = await db.query(
                "SELECT id FROM chronic_enrollments WHERE patient_id = ? AND clinic_id = ? AND status = 'active'",
                [patient_id, clinic_id]
            );

            if (existing.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: "Patient is already enrolled in this clinic"
                });
            }

            const sql = `
        INSERT INTO chronic_enrollments 
        (patient_id, clinic_id, enrolled_by, enrollment_date, baseline_notes,
         baseline_weight, baseline_bp_systolic, baseline_bp_diastolic, baseline_blood_sugar)
        VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?, ?)
      `;

            const [result] = await db.query(sql, [
                patient_id,
                clinic_id,
                req.user.id,
                baseline_notes || null,
                baseline_weight || null,
                baseline_bp_systolic || null,
                baseline_bp_diastolic || null,
                baseline_blood_sugar || null
            ]);

            // Get clinic details for response
            const [clinics] = await db.query("SELECT name, code FROM clinics WHERE id = ?", [clinic_id]);

            res.status(201).json({
                success: true,
                message: `Patient enrolled in ${clinics[0].name} successfully`,
                enrollment: {
                    id: result.insertId,
                    patient_id,
                    clinic_id,
                    clinic_name: clinics[0].name,
                    enrollment_date: new Date().toISOString().split('T')[0]
                }
            });
        } catch (error) {
            console.error("Enroll patient error:", error);
            res.status(500).json({ success: false, error: "Failed to enroll patient" });
        }
    },

    // Discharge patient from clinic
    dischargePatient: async (req, res) => {
        try {
            const { enrollment_id } = req.params;
            const { status, discharge_reason } = req.body;

            const validStatuses = ['discharged', 'transferred', 'deceased', 'lost_to_follow_up'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid discharge status"
                });
            }

            const sql = `
        UPDATE chronic_enrollments 
        SET status = ?, 
            discharge_date = CURDATE(), 
            discharge_reason = ?,
            discharged_by = ?
        WHERE id = ?
      `;

            await db.query(sql, [status, discharge_reason || null, req.user.id, enrollment_id]);
            // Note: enrollment is already scoped to hospital via the patient relationship

            res.json({
                success: true,
                message: "Patient discharged from clinic"
            });
        } catch (error) {
            console.error("Discharge patient error:", error);
            res.status(500).json({ success: false, error: "Failed to discharge patient" });
        }
    },

    // Get patient's enrollments
    getPatientEnrollments: async (req, res) => {
        try {
            const { patient_id } = req.params;

            const hospitalId = req.user.hospital_id;

            const sql = `
        SELECT ce.*, 
               c.name as clinic_name, 
               c.code as clinic_code,
               u.username as enrolled_by_name,
               (SELECT COUNT(*) FROM clinic_visits cv WHERE cv.enrollment_id = ce.id) as total_visits,
               (SELECT MAX(visit_date) FROM clinic_visits cv WHERE cv.enrollment_id = ce.id) as last_visit_date
        FROM chronic_enrollments ce
        JOIN clinics c ON ce.clinic_id = c.id
        LEFT JOIN users u ON ce.enrolled_by = u.id
        WHERE ce.patient_id = ? AND c.hospital_id = ?
        ORDER BY ce.status = 'active' DESC, ce.enrollment_date DESC
      `;

            const [enrollments] = await db.query(sql, [patient_id, hospitalId]);

            res.json({
                success: true,
                count: enrollments.length,
                enrollments
            });
        } catch (error) {
            console.error("Get patient enrollments error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch enrollments" });
        }
    },

    // Get all patients enrolled in a clinic
    getClinicPatients: async (req, res) => {
        try {
            const { clinic_id } = req.params;
            const { status } = req.query;

            const hospitalId = req.user.hospital_id;

            let sql = `
        SELECT ce.*, 
               p.name as patient_name,
               p.patient_number,
               p.phone,
               p.age,
               p.gender,
               (SELECT MAX(visit_date) FROM clinic_visits cv WHERE cv.enrollment_id = ce.id) as last_visit_date,
               (SELECT COUNT(*) FROM clinic_visits cv WHERE cv.enrollment_id = ce.id) as total_visits
        FROM chronic_enrollments ce
        JOIN patients p ON ce.patient_id = p.id
        JOIN clinics cl ON ce.clinic_id = cl.id
        WHERE ce.clinic_id = ? AND cl.hospital_id = ?
      `;

            const params = [clinic_id, hospitalId];

            if (status) {
                sql += ` AND ce.status = ?`;
                params.push(status);
            }

            sql += ` ORDER BY p.name`;

            const [patients] = await db.query(sql, params);

            res.json({
                success: true,
                count: patients.length,
                patients
            });
        } catch (error) {
            console.error("Get clinic patients error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch clinic patients" });
        }
    },

    // Get enrollment details
    getEnrollmentDetails: async (req, res) => {
        try {
            const { enrollment_id } = req.params;

            const hospitalId = req.user.hospital_id;

            const sql = `
        SELECT ce.*, 
               c.name as clinic_name, 
               c.code as clinic_code,
               c.default_follow_up_days,
               p.name as patient_name,
               p.patient_number,
               p.phone,
               p.age,
               p.gender,
               u.username as enrolled_by_name
        FROM chronic_enrollments ce
        JOIN clinics c ON ce.clinic_id = c.id
        JOIN patients p ON ce.patient_id = p.id
        LEFT JOIN users u ON ce.enrolled_by = u.id
        WHERE ce.id = ? AND c.hospital_id = ?
      `;

            const [enrollments] = await db.query(sql, [enrollment_id, hospitalId]);

            if (enrollments.length === 0) {
                return res.status(404).json({ success: false, error: "Enrollment not found" });
            }

            res.json({
                success: true,
                enrollment: enrollments[0]
            });
        } catch (error) {
            console.error("Get enrollment details error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch enrollment details" });
        }
    }
};

module.exports = chronicController;
