const db = require("../config/dbconfig");

const followUpController = {
    // ==================== SCHEDULING ====================

    // Schedule a follow-up appointment
    scheduleFollowUp: async (req, res) => {
        try {
            const {
                patient_id,
                enrollment_id,
                clinic_id,
                scheduled_date,
                scheduled_time,
                purpose,
                department,
                notes
            } = req.body;

            if (!patient_id || !scheduled_date || !purpose) {
                return res.status(400).json({
                    success: false,
                    error: "Patient ID, scheduled date, and purpose are required"
                });
            }

            // Validate date is in the future
            const schedDate = new Date(scheduled_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (schedDate < today) {
                return res.status(400).json({
                    success: false,
                    error: "Scheduled date must be in the future"
                });
            }

            const sql = `
        INSERT INTO follow_ups 
        (patient_id, enrollment_id, clinic_id, scheduled_date, scheduled_time, purpose, department, scheduled_by, notes, hospital_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

            const [result] = await db.query(sql, [
                patient_id,
                enrollment_id || null,
                clinic_id || null,
                scheduled_date,
                scheduled_time || null,
                purpose,
                department || 'nurse',
                req.user.id,
                notes || null,
                req.user.hospital_id
            ]);

            res.status(201).json({
                success: true,
                message: "Follow-up scheduled successfully",
                followUp: {
                    id: result.insertId,
                    scheduled_date,
                    purpose,
                    department: department || 'nurse'
                }
            });
        } catch (error) {
            console.error("Schedule follow-up error:", error);
            res.status(500).json({ success: false, error: "Failed to schedule follow-up" });
        }
    },

    // Get today's follow-ups
    getTodayFollowUps: async (req, res) => {
        try {
            const { clinic_id, department } = req.query;

            let sql = `
        SELECT f.*,
               p.name as patient_name,
               p.patient_number,
               p.phone,
               c.name as clinic_name,
               c.code as clinic_code,
               u.username as scheduled_by_name
        FROM follow_ups f
        JOIN patients p ON f.patient_id = p.id
        LEFT JOIN clinics c ON f.clinic_id = c.id
        LEFT JOIN users u ON f.scheduled_by = u.id
        WHERE f.scheduled_date = CURDATE()
          AND f.status = 'scheduled'
          AND f.hospital_id = ?
      `;

            const params = [req.user.hospital_id];

            if (clinic_id) {
                sql += ` AND f.clinic_id = ?`;
                params.push(clinic_id);
            }

            if (department) {
                sql += ` AND f.department = ?`;
                params.push(department);
            }

            sql += ` ORDER BY f.scheduled_time ASC, f.created_at ASC`;

            const [followUps] = await db.query(sql, params);

            res.json({
                success: true,
                date: new Date().toISOString().split('T')[0],
                count: followUps.length,
                followUps
            });
        } catch (error) {
            console.error("Get today follow-ups error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch today's follow-ups" });
        }
    },

    // Get upcoming follow-ups (next 7 days by default)
    getUpcoming: async (req, res) => {
        try {
            const { days, clinic_id, patient_id } = req.query;
            const lookAheadDays = parseInt(days) || 7;

            let sql = `
        SELECT f.*,
               p.name as patient_name,
               p.patient_number,
               p.phone,
               c.name as clinic_name,
               c.code as clinic_code
        FROM follow_ups f
        JOIN patients p ON f.patient_id = p.id
        LEFT JOIN clinics c ON f.clinic_id = c.id
        WHERE f.scheduled_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
          AND f.status = 'scheduled'
          AND f.hospital_id = ?
      `;

            const params = [lookAheadDays, req.user.hospital_id];

            if (clinic_id) {
                sql += ` AND f.clinic_id = ?`;
                params.push(clinic_id);
            }

            if (patient_id) {
                sql += ` AND f.patient_id = ?`;
                params.push(patient_id);
            }

            sql += ` ORDER BY f.scheduled_date ASC, f.scheduled_time ASC`;

            const [followUps] = await db.query(sql, params);

            res.json({
                success: true,
                count: followUps.length,
                followUps
            });
        } catch (error) {
            console.error("Get upcoming follow-ups error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch upcoming follow-ups" });
        }
    },

    // Get missed appointments
    getMissed: async (req, res) => {
        try {
            const { clinic_id, days_back } = req.query;
            const lookBackDays = parseInt(days_back) || 30;

            let sql = `
        SELECT f.*,
               p.name as patient_name,
               p.patient_number,
               p.phone,
               c.name as clinic_name
        FROM follow_ups f
        JOIN patients p ON f.patient_id = p.id
        LEFT JOIN clinics c ON f.clinic_id = c.id
        WHERE f.status = 'missed'
          AND f.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          AND f.hospital_id = ?
      `;

            const params = [lookBackDays, req.user.hospital_id];

            if (clinic_id) {
                sql += ` AND f.clinic_id = ?`;
                params.push(clinic_id);
            }

            sql += ` ORDER BY f.scheduled_date DESC`;

            const [missedAppointments] = await db.query(sql, params);

            res.json({
                success: true,
                count: missedAppointments.length,
                missed: missedAppointments
            });
        } catch (error) {
            console.error("Get missed appointments error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch missed appointments" });
        }
    },

    // Mark follow-up as completed
    markCompleted: async (req, res) => {
        try {
            const { id } = req.params;

            const sql = `
        UPDATE follow_ups 
        SET status = 'completed',
            completed_at = CURRENT_TIMESTAMP,
            completed_by = ?
        WHERE id = ? AND hospital_id = ?
      `;

            await db.query(sql, [req.user.id, id, req.user.hospital_id]);

            res.json({
                success: true,
                message: "Follow-up marked as completed"
            });
        } catch (error) {
            console.error("Mark completed error:", error);
            res.status(500).json({ success: false, error: "Failed to mark as completed" });
        }
    },

    // Mark follow-up as missed
    markMissed: async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const sql = `
        UPDATE follow_ups 
        SET status = 'missed',
            missed_reason = ?
        WHERE id = ? AND hospital_id = ?
      `;

            await db.query(sql, [reason || null, id, req.user.hospital_id]);

            res.json({
                success: true,
                message: "Follow-up marked as missed"
            });
        } catch (error) {
            console.error("Mark missed error:", error);
            res.status(500).json({ success: false, error: "Failed to mark as missed" });
        }
    },

    // Reschedule follow-up
    reschedule: async (req, res) => {
        try {
            const { id } = req.params;
            const { new_date, new_time, reason } = req.body;

            if (!new_date) {
                return res.status(400).json({
                    success: false,
                    error: "New date is required"
                });
            }

            const sql = `
        UPDATE follow_ups 
        SET scheduled_date = ?,
            scheduled_time = ?,
            status = 'rescheduled',
            reschedule_count = reschedule_count + 1,
            notes = CONCAT(IFNULL(notes, ''), '\n[Rescheduled: ', ?, ']')
        WHERE id = ? AND hospital_id = ?
      `;

            await db.query(sql, [new_date, new_time || null, reason || 'Rescheduled by staff', id, req.user.hospital_id]);

            // Create a new follow-up entry
            const [original] = await db.query("SELECT * FROM follow_ups WHERE id = ? AND hospital_id = ?", [id, req.user.hospital_id]);

            if (original.length > 0) {
                const orig = original[0];
                await db.query(
                    `INSERT INTO follow_ups 
           (patient_id, enrollment_id, clinic_id, scheduled_date, scheduled_time, purpose, department, scheduled_by, notes, hospital_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [orig.patient_id, orig.enrollment_id, orig.clinic_id, new_date, new_time, orig.purpose, orig.department, req.user.id, `Rescheduled from ${orig.scheduled_date}`, req.user.hospital_id]
                );
            }

            res.json({
                success: true,
                message: "Follow-up rescheduled successfully"
            });
        } catch (error) {
            console.error("Reschedule error:", error);
            res.status(500).json({ success: false, error: "Failed to reschedule" });
        }
    },

    // Get defaulters (patients who frequently miss appointments)
    getDefaulters: async (req, res) => {
        try {
            const { clinic_id, min_missed } = req.query;
            const minMissedCount = parseInt(min_missed) || 2;

            let sql = `
        SELECT p.id as patient_id,
               p.name as patient_name,
               p.patient_number,
               p.phone,
               COUNT(f.id) as missed_count,
               MAX(f.scheduled_date) as last_missed_date,
               GROUP_CONCAT(DISTINCT c.name) as clinics
        FROM follow_ups f
        JOIN patients p ON f.patient_id = p.id
        LEFT JOIN clinics c ON f.clinic_id = c.id
        WHERE f.status = 'missed'
          AND f.hospital_id = ?
      `;

            const params = [req.user.hospital_id];

            if (clinic_id) {
                sql += ` AND f.clinic_id = ?`;
                params.push(clinic_id);
            }

            sql += `
        GROUP BY p.id, p.name, p.patient_number, p.phone
        HAVING missed_count >= ?
        ORDER BY missed_count DESC
      `;
            params.push(minMissedCount);

            const [defaulters] = await db.query(sql, params);

            res.json({
                success: true,
                count: defaulters.length,
                defaulters
            });
        } catch (error) {
            console.error("Get defaulters error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch defaulters" });
        }
    },

    // Get calendar view (all scheduled for a date range)
    getCalendar: async (req, res) => {
        try {
            const { start_date, end_date, clinic_id } = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    error: "Start date and end date are required"
                });
            }

            let sql = `
        SELECT f.scheduled_date,
               f.department,
               f.status,
               COUNT(*) as appointment_count,
               SUM(CASE WHEN f.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
               SUM(CASE WHEN f.status = 'missed' THEN 1 ELSE 0 END) as missed_count
        FROM follow_ups f
        WHERE f.scheduled_date BETWEEN ? AND ?
          AND f.hospital_id = ?
      `;

            const params = [start_date, end_date, req.user.hospital_id];

            if (clinic_id) {
                sql += ` AND f.clinic_id = ?`;
                params.push(clinic_id);
            }

            sql += ` GROUP BY f.scheduled_date, f.department, f.status ORDER BY f.scheduled_date`;

            const [calendar] = await db.query(sql, params);

            // Also get daily totals
            const [dailyTotals] = await db.query(`
        SELECT scheduled_date, COUNT(*) as total
        FROM follow_ups
        WHERE scheduled_date BETWEEN ? AND ?
          AND hospital_id = ?
        ${clinic_id ? 'AND clinic_id = ?' : ''}
        GROUP BY scheduled_date
      `, clinic_id ? [start_date, end_date, req.user.hospital_id, clinic_id] : [start_date, end_date, req.user.hospital_id]);

            res.json({
                success: true,
                calendar,
                dailyTotals
            });
        } catch (error) {
            console.error("Get calendar error:", error);
            res.status(500).json({ success: false, error: "Failed to fetch calendar" });
        }
    },

    // Auto-mark past scheduled as missed
    autoMarkMissed: async (req, res) => {
        try {
            const sql = `
        UPDATE follow_ups 
        SET status = 'missed',
            missed_reason = 'Auto-marked: Patient did not show up'
        WHERE status = 'scheduled'
          AND scheduled_date < CURDATE()
          AND hospital_id = ?
      `;

            const [result] = await db.query(sql, [req.user.hospital_id]);

            res.json({
                success: true,
                message: `${result.affectedRows} appointments marked as missed`
            });
        } catch (error) {
            console.error("Auto mark missed error:", error);
            res.status(500).json({ success: false, error: "Failed to auto-mark missed" });
        }
    }
};

module.exports = followUpController;
