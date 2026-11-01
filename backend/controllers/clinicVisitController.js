const db = require("../config/dbconfig");

const clinicVisitController = {
    // ==================== NURSE FUNCTIONS ====================

    // Record a clinic visit (Nurse)
    recordVisit: async (req, res) => {
        try {
            const {
                enrollment_id,
                visit_type,
                blood_pressure_systolic,
                blood_pressure_diastolic,
                blood_sugar,
                weight,
                pulse_rate,
                temperature,
                oxygen_saturation,
                nurse_notes,
                current_medications
            } = req.body;

            if (!enrollment_id) {
                return res.status(400).json({
                    success: false,
                    error: "Enrollment ID is required"
                });
            }

            // Get enrollment details
            const [enrollments] = await db.query(
                `SELECT ce.*, c.name as clinic_name 
         FROM chronic_enrollments ce 
         JOIN clinics c ON ce.clinic_id = c.id 
         WHERE ce.id = ? AND ce.status = 'active' AND ce.hospital_id = ?`,
                [enrollment_id, req.user.hospital_id]
            );

            if (enrollments.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Active enrollment not found"
                });
            }

            const enrollment = enrollments[0];

            // Get last visit for comparison
            const [lastVisits] = await db.query(
                `SELECT * FROM clinic_visits WHERE enrollment_id = ? ORDER BY visit_date DESC LIMIT 1`,
                [enrollment_id]
            );

            const lastVisit = lastVisits.length > 0 ? lastVisits[0] : null;

            // Calculate changes from last visit
            let bp_change_from_last = null;
            let weight_change_from_last = null;
            let sugar_change_from_last = null;

            if (lastVisit) {
                if (blood_pressure_systolic && lastVisit.blood_pressure_systolic) {
                    const sysDiff = blood_pressure_systolic - lastVisit.blood_pressure_systolic;
                    const diaDiff = blood_pressure_diastolic - lastVisit.blood_pressure_diastolic;
                    bp_change_from_last = `${sysDiff >= 0 ? '+' : ''}${sysDiff}/${diaDiff >= 0 ? '+' : ''}${diaDiff}`;
                }
                if (weight && lastVisit.weight) {
                    weight_change_from_last = (weight - lastVisit.weight).toFixed(2);
                }
                if (blood_sugar && lastVisit.blood_sugar) {
                    sugar_change_from_last = (blood_sugar - lastVisit.blood_sugar).toFixed(2);
                }
            }

            // Calculate changes from baseline
            let bp_change_from_baseline = null;
            if (blood_pressure_systolic && enrollment.baseline_bp_systolic) {
                const sysDiff = blood_pressure_systolic - enrollment.baseline_bp_systolic;
                const diaDiff = blood_pressure_diastolic - enrollment.baseline_bp_diastolic;
                bp_change_from_baseline = `${sysDiff >= 0 ? '+' : ''}${sysDiff}/${diaDiff >= 0 ? '+' : ''}${diaDiff}`;
            }

            // Check for abnormal values
            const abnormalFlags = [];
            let is_abnormal = false;

            // BP thresholds
            if (blood_pressure_systolic) {
                if (blood_pressure_systolic >= 180 || blood_pressure_diastolic >= 120) {
                    abnormalFlags.push({ type: 'bp_crisis', message: 'Hypertensive crisis', severity: 'critical' });
                    is_abnormal = true;
                } else if (blood_pressure_systolic >= 140 || blood_pressure_diastolic >= 90) {
                    abnormalFlags.push({ type: 'bp_high', message: 'High blood pressure', severity: 'warning' });
                    is_abnormal = true;
                } else if (blood_pressure_systolic < 90 || blood_pressure_diastolic < 60) {
                    abnormalFlags.push({ type: 'bp_low', message: 'Low blood pressure', severity: 'warning' });
                    is_abnormal = true;
                }
            }

            // Blood sugar thresholds (mg/dL)
            if (blood_sugar) {
                if (blood_sugar > 250) {
                    abnormalFlags.push({ type: 'sugar_high', message: 'Very high blood sugar', severity: 'critical' });
                    is_abnormal = true;
                } else if (blood_sugar > 180) {
                    abnormalFlags.push({ type: 'sugar_elevated', message: 'Elevated blood sugar', severity: 'warning' });
                    is_abnormal = true;
                } else if (blood_sugar < 70) {
                    abnormalFlags.push({ type: 'sugar_low', message: 'Low blood sugar (hypoglycemia)', severity: 'critical' });
                    is_abnormal = true;
                }
            }

            // Temperature thresholds
            if (temperature) {
                if (temperature >= 39) {
                    abnormalFlags.push({ type: 'fever_high', message: 'High fever', severity: 'critical' });
                    is_abnormal = true;
                } else if (temperature >= 37.5) {
                    abnormalFlags.push({ type: 'fever', message: 'Fever', severity: 'warning' });
                    is_abnormal = true;
                }
            }

            // Oxygen saturation
            if (oxygen_saturation) {
                if (oxygen_saturation < 90) {
                    abnormalFlags.push({ type: 'spo2_low', message: 'Low oxygen saturation', severity: 'critical' });
                    is_abnormal = true;
                } else if (oxygen_saturation < 95) {
                    abnormalFlags.push({ type: 'spo2_reduced', message: 'Reduced oxygen saturation', severity: 'warning' });
                    is_abnormal = true;
                }
            }

            const sql = `
        INSERT INTO clinic_visits 
        (enrollment_id, patient_id, clinic_id, visit_date, visit_type, recorded_by,
         blood_pressure_systolic, blood_pressure_diastolic, blood_sugar, weight,
         pulse_rate, temperature, oxygen_saturation,
         bp_change_from_last, bp_change_from_baseline, weight_change_from_last, sugar_change_from_last,
         is_abnormal, abnormal_flags, nurse_notes, current_medications, status, hospital_id)
        VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recorded', ?)
      `;

            const [result] = await db.query(sql, [
                enrollment_id,
                enrollment.patient_id,
                enrollment.clinic_id,
                visit_type || 'scheduled',
                req.user.id,
                blood_pressure_systolic || null,
                blood_pressure_diastolic || null,
                blood_sugar || null,
                weight || null,
                pulse_rate || null,
                temperature || null,
                oxygen_saturation || null,
                bp_change_from_last,
                bp_change_from_baseline,
                weight_change_from_last,
                sugar_change_from_last,
                is_abnormal,
                abnormalFlags.length > 0 ? JSON.stringify(abnormalFlags) : null,
                nurse_notes || null,
                current_medications || null,
                req.user.hospital_id
            ]);

            res.status(201).json({
                success: true,
                message: "Clinic visit recorded successfully",
                visit: {
                    id: result.insertId,
                    enrollment_id,
                    clinic_name: enrollment.clinic_name,
                    is_abnormal,
                    abnormal_flags: abnormalFlags,
                    comparison: {
                        bp_change_from_last,
                        bp_change_from_baseline,
                        weight_change_from_last,
                        sugar_change_from_last
                    }
                }
            });
        } catch (error) {
            console.error("Record visit error:", error);
            res.status(500).json({ success: false, error: "Failed to record visit" });
        }
    },

    // Get visit history for an enrollment
    getVisitHistory: async (req, res) => {
        try {
            const { enrollment_id } = req.params;
            const { limit } = req.query;

            let sql = `
        SELECT cv.*,
               u_nurse.username as recorded_by_name,
               u_doctor.username as reviewed_by_name
        FROM clinic_visits cv
        LEFT JOIN users u_nurse ON cv.recorded_by = u_nurse.id
        LEFT JOIN users u_doctor ON cv.reviewed_by = u_doctor.id
        WHERE cv.enrollment_id = ?
        ORDER BY cv.visit_date DESC, cv.created_at DESC
      `;

            if (limit) {
                sql += ` LIMIT ${parseInt(limit)}`;
            }

            const [visits] = await db.query(sql, [enrollment_id]);

            res.json({
                success: true,
                count: visits.length,
                visits
            });
        } catch (error) {
            console.error("Get visit history error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch visit history" });
        }
    },

    // Get vitals trend data for graphs
    getVitalsTrend: async (req, res) => {
        try {
            const { enrollment_id } = req.params;
            const { vital_type, limit } = req.query;

            const sql = `
        SELECT visit_date, 
               blood_pressure_systolic, blood_pressure_diastolic,
               blood_sugar, weight, pulse_rate, temperature, oxygen_saturation
        FROM clinic_visits 
        WHERE enrollment_id = ?
        ORDER BY visit_date ASC
        LIMIT ?
      `;

            const [visits] = await db.query(sql, [enrollment_id, parseInt(limit) || 10]);

            // Get baseline for comparison line
            const [enrollments] = await db.query(
                `SELECT baseline_weight, baseline_bp_systolic, baseline_bp_diastolic, baseline_blood_sugar
         FROM chronic_enrollments WHERE id = ?`,
                [enrollment_id]
            );

            res.json({
                success: true,
                baseline: enrollments[0] || null,
                data: visits
            });
        } catch (error) {
            console.error("Get vitals trend error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch vitals trend" });
        }
    },

    // ==================== DOCTOR FUNCTIONS ====================

    // Get pending reviews (visits awaiting doctor review)
    getPendingReviews: async (req, res) => {
        try {
            const { clinic_id } = req.query;

            let sql = `
        SELECT cv.*,
               p.name as patient_name,
               p.patient_number,
               p.age,
               p.gender,
               c.name as clinic_name,
               c.code as clinic_code,
               u.username as recorded_by_name
        FROM clinic_visits cv
        JOIN chronic_enrollments ce ON cv.enrollment_id = ce.id
        JOIN patients p ON cv.patient_id = p.id
        JOIN clinics c ON cv.clinic_id = c.id
        LEFT JOIN users u ON cv.recorded_by = u.id
        WHERE cv.status = 'recorded' AND cv.hospital_id = ?
      `;

            const params = [req.user.hospital_id];

            if (clinic_id) {
                sql += ` AND cv.clinic_id = ?`;
                params.push(clinic_id);
            }

            sql += ` ORDER BY cv.is_abnormal DESC, cv.visit_date DESC`;

            const [visits] = await db.query(sql, params);

            res.json({
                success: true,
                count: visits.length,
                visits
            });
        } catch (error) {
            console.error("Get pending reviews error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch pending reviews" });
        }
    },

    // Doctor reviews a clinic visit
    reviewVisit: async (req, res) => {
        try {
            const { visit_id } = req.params;
            const { doctor_notes, medication_changes } = req.body;

            const sql = `
        UPDATE clinic_visits 
        SET reviewed_by = ?,
            review_date = CURRENT_TIMESTAMP,
            doctor_notes = ?,
            medication_changes = ?,
            status = 'reviewed'
        WHERE id = ? AND hospital_id = ?
      `;

            await db.query(sql, [req.user.id, doctor_notes || null, medication_changes || null, visit_id, req.user.hospital_id]);

            res.json({
                success: true,
                message: "Visit reviewed successfully"
            });
        } catch (error) {
            console.error("Review visit error:", error);
            res.status(500).json({ success: false, error: "Failed to review visit" });
        }
    },

    // Escalate to full consultation
    escalateToConsultation: async (req, res) => {
        try {
            const { visit_id } = req.params;
            const { reason } = req.body;

            // Get visit details
            const [visits] = await db.query(
                `SELECT cv.*, ce.patient_id FROM clinic_visits cv
         JOIN chronic_enrollments ce ON cv.enrollment_id = ce.id
         WHERE cv.id = ? AND cv.hospital_id = ?`,
                [visit_id, req.user.hospital_id]
            );

            if (visits.length === 0) {
                return res.status(404).json({ success: false, error: "Visit not found" });
            }

            const visit = visits[0];

            // Add to doctor queue
            const Queue = require("../models/Queue");
            const queueData = await Queue.addToQueue(visit.patient_id, 'doctor');

            // Update visit
            await db.query(
                `UPDATE clinic_visits 
         SET status = 'escalated', 
             escalated_to_consultation = TRUE,
             queue_id = ?,
             doctor_notes = CONCAT(IFNULL(doctor_notes, ''), '\n[ESCALATED: ', ?, ']')
         WHERE id = ? AND hospital_id = ?`,
                [queueData.id, reason || 'Doctor review required', visit_id, req.user.hospital_id]
            );

            res.json({
                success: true,
                message: "Patient escalated to full consultation",
                queue: queueData
            });
        } catch (error) {
            console.error("Escalate to consultation error:", error);
            res.status(500).json({ success: false, error: "Failed to escalate" });
        }
    },

    // Get today's clinic visits
    getTodayVisits: async (req, res) => {
        try {
            const { clinic_id } = req.query;

            let sql = `
        SELECT cv.*,
               p.name as patient_name,
               p.patient_number,
               c.name as clinic_name,
               u.username as recorded_by_name
        FROM clinic_visits cv
        JOIN patients p ON cv.patient_id = p.id
        JOIN clinics c ON cv.clinic_id = c.id
        LEFT JOIN users u ON cv.recorded_by = u.id
        WHERE DATE(cv.visit_date) = CURDATE() AND cv.hospital_id = ?
      `;

            const params = [req.user.hospital_id];

            if (clinic_id) {
                sql += ` AND cv.clinic_id = ?`;
                params.push(clinic_id);
            }

            sql += ` ORDER BY cv.created_at DESC`;

            const [visits] = await db.query(sql, params);

            res.json({
                success: true,
                count: visits.length,
                visits
            });
        } catch (error) {
            console.error("Get today visits error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch today's visits" });
        }
    },

    // Get abnormal visits (for alerts)
    getAbnormalVisits: async (req, res) => {
        try {
            const sql = `
        SELECT cv.*,
               p.name as patient_name,
               p.patient_number,
               p.phone,
               c.name as clinic_name
        FROM clinic_visits cv
        JOIN patients p ON cv.patient_id = p.id
        JOIN clinics c ON cv.clinic_id = c.id
        WHERE cv.is_abnormal = TRUE 
          AND cv.status IN ('recorded', 'reviewed')
          AND cv.visit_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          AND cv.hospital_id = ?
        ORDER BY cv.visit_date DESC
      `;

            const [visits] = await db.query(sql, [req.user.hospital_id]);

            res.json({
                success: true,
                count: visits.length,
                visits
            });
        } catch (error) {
            console.error("Get abnormal visits error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch abnormal visits" });
        }
    }
};

module.exports = clinicVisitController;
