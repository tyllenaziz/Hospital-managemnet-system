const db = require("../config/dbconfig.js");

const Referral = {
  create: async (referralData, hospitalId = null) => {
    const {
      patient_id, doctor_id, queue_id, referring_hospital, referred_to_hospital,
      referred_to_department, referral_reason, clinical_summary, diagnosis,
      patient_condition, vital_signs, services_needed, investigations_done,
      current_medications, referring_doctor_name, referring_doctor_phone,
      referring_doctor_email, priority, expected_visit_date, follow_up_required
    } = referralData;

    const sql = `INSERT INTO referrals (
      patient_id, doctor_id, queue_id, referring_hospital, referred_to_hospital,
      referred_to_department, referral_reason, clinical_summary, diagnosis,
      patient_condition, vital_signs, services_needed, investigations_done,
      current_medications, referring_doctor_name, referring_doctor_phone,
      referring_doctor_email, priority, expected_visit_date, follow_up_required, hospital_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await db.query(sql, [
      patient_id, doctor_id, queue_id || null, referring_hospital, referred_to_hospital,
      referred_to_department || null, referral_reason, clinical_summary, diagnosis || null,
      patient_condition || 'Stable', vital_signs || null,
      JSON.stringify(services_needed), investigations_done || null,
      current_medications || null, referring_doctor_name, referring_doctor_phone,
      referring_doctor_email || null, priority || 'Routine',
      expected_visit_date || null, follow_up_required || false,
      hospitalId
    ]);

    return { id: result.insertId, hospital_id: hospitalId, ...referralData };
  },

  findById: async (id, hospitalId = null) => {
    let sql = `
      SELECT r.*, 
        p.name as patient_name, p.age, p.gender, p.phone as patient_phone, p.id_number,
        u.username as doctor_name
      FROM referrals r
      JOIN patients p ON r.patient_id = p.id
      JOIN users u ON r.doctor_id = u.id
      WHERE r.id = ?`;
    const params = [id];
    if (hospitalId) {
      sql += " AND r.hospital_id = ?";
      params.push(hospitalId);
    }

    const [results] = await db.query(sql, params);

    if (results[0] && results[0].services_needed) {
      results[0].services_needed = JSON.parse(results[0].services_needed);
    }

    return results[0];
  },

  findByPatientId: async (patientId, hospitalId = null) => {
    let sql = `
      SELECT r.*, 
        p.name as patient_name, p.age, p.gender,
        u.username as doctor_name
      FROM referrals r
      JOIN patients p ON r.patient_id = p.id
      JOIN users u ON r.doctor_id = u.id
      WHERE r.patient_id = ?`;
    const params = [patientId];
    if (hospitalId) {
      sql += " AND r.hospital_id = ?";
      params.push(hospitalId);
    }
    sql += " ORDER BY r.referral_date DESC";

    const [results] = await db.query(sql, params);

    return results.map(ref => ({
      ...ref,
      services_needed: ref.services_needed ? JSON.parse(ref.services_needed) : []
    }));
  },

  findByDoctorId: async (doctorId, hospitalId = null) => {
    let sql = `
      SELECT r.*, 
        p.name as patient_name, p.age, p.gender, p.phone as patient_phone,
        u.username as doctor_name
      FROM referrals r
      JOIN patients p ON r.patient_id = p.id
      JOIN users u ON r.doctor_id = u.id
      WHERE r.doctor_id = ?`;
    const params = [doctorId];
    if (hospitalId) {
      sql += " AND r.hospital_id = ?";
      params.push(hospitalId);
    }
    sql += " ORDER BY r.referral_date DESC";

    const [results] = await db.query(sql, params);

    return results.map(ref => ({
      ...ref,
      services_needed: ref.services_needed ? JSON.parse(ref.services_needed) : []
    }));
  },

  getAll: async (hospitalId = null) => {
    let sql = `
      SELECT r.*, 
        p.name as patient_name, p.age, p.gender, p.phone as patient_phone,
        u.username as doctor_name
      FROM referrals r
      JOIN patients p ON r.patient_id = p.id
      JOIN users u ON r.doctor_id = u.id`;
    const params = [];
    if (hospitalId) {
      sql += " WHERE r.hospital_id = ?";
      params.push(hospitalId);
    }
    sql += " ORDER BY r.referral_date DESC";

    const [results] = await db.query(sql, params);

    return results.map(ref => ({
      ...ref,
      services_needed: ref.services_needed ? JSON.parse(ref.services_needed) : []
    }));
  },

  updateStatus: async (id, status, feedback = null, hospitalId = null) => {
    let sql = `
      UPDATE referrals 
      SET status = ?, 
          feedback_from_referred_hospital = ?,
          completed_date = CASE WHEN ? IN ('Completed', 'Rejected') THEN CURRENT_TIMESTAMP ELSE completed_date END,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`;
    const params = [status, feedback, status, id];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  },

  update: async (id, referralData, hospitalId = null) => {
    const {
      referred_to_hospital, referred_to_department, referral_reason,
      clinical_summary, diagnosis, patient_condition, vital_signs,
      services_needed, investigations_done, current_medications,
      priority, expected_visit_date, follow_up_required
    } = referralData;

    let sql = `
      UPDATE referrals SET
        referred_to_hospital = ?, referred_to_department = ?, 
        referral_reason = ?, clinical_summary = ?, diagnosis = ?,
        patient_condition = ?, vital_signs = ?, services_needed = ?,
        investigations_done = ?, current_medications = ?, priority = ?,
        expected_visit_date = ?, follow_up_required = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`;

    const params = [
      referred_to_hospital, referred_to_department, referral_reason,
      clinical_summary, diagnosis, patient_condition, vital_signs,
      JSON.stringify(services_needed), investigations_done, current_medications,
      priority, expected_visit_date, follow_up_required, id
    ];

    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }

    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  },

  delete: async (id, hospitalId = null) => {
    let sql = "DELETE FROM referrals WHERE id = ?";
    const params = [id];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  },

  getStatistics: async (doctorId = null, hospitalId = null) => {
    let sql = `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN priority = 'Emergency' THEN 1 ELSE 0 END) as emergency
      FROM referrals WHERE 1=1`;
    const params = [];

    if (doctorId) {
      sql += " AND doctor_id = ?";
      params.push(doctorId);
    }
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }

    const [results] = await db.query(sql, params);
    return results[0];
  }
};

module.exports = Referral;