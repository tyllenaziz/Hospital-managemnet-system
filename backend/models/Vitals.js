const db = require("../config/dbconfig.js");

const Vitals = {
  // Create or update vitals for a queue item
  createOrUpdate: async (vitalsData) => {
    const {
      queue_id,
      patient_id,
      recorded_by,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      temperature,
      pulse_rate,
      respiratory_rate,
      weight,
      height,
      blood_sugar,
      oxygen_saturation,
      bmi,
      notes,
      drug_allergies
    } = vitalsData;

    // Check if vitals already exist for this queue item
    const checkSql = "SELECT id FROM vitals WHERE queue_id = ?";
    const [existing] = await db.query(checkSql, [queue_id]);

    if (existing.length > 0) {
      // Update existing vitals
      const updateSql = `
        UPDATE vitals SET
          blood_pressure_systolic = ?,
          blood_pressure_diastolic = ?,
          temperature = ?,
          pulse_rate = ?,
          respiratory_rate = ?,
          weight = ?,
          height = ?,
          blood_sugar = ?,
          oxygen_saturation = ?,
          bmi = ?,
          notes = ?,
          drug_allergies = ?,
          updated_by = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE queue_id = ?
      `;
      
      await db.query(updateSql, [
        blood_pressure_systolic,
        blood_pressure_diastolic,
        temperature,
        pulse_rate,
        respiratory_rate,
        weight,
        height,
        blood_sugar,
        oxygen_saturation,
        bmi,
        notes,
        drug_allergies,
        recorded_by,
        queue_id
      ]);

      return await Vitals.getByQueueId(queue_id);
    } else {
      // Create new vitals
      const insertSql = `
        INSERT INTO vitals (
          queue_id,
          patient_id,
          recorded_by,
          blood_pressure_systolic,
          blood_pressure_diastolic,
          temperature,
          pulse_rate,
          respiratory_rate,
          weight,
          height,
          blood_sugar,
          oxygen_saturation,
          bmi,
          notes,
          drug_allergies
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(insertSql, [
        queue_id,
        patient_id,
        recorded_by,
        blood_pressure_systolic,
        blood_pressure_diastolic,
        temperature,
        pulse_rate,
        respiratory_rate,
        weight,
        height,
        blood_sugar,
        oxygen_saturation,
        bmi,
        notes,
        drug_allergies
      ]);

      return await Vitals.getById(result.insertId);
    }
  },

   getLatestByPatientId: async (patientId) => {
    const sql = `
      SELECT 
        v.*,
        u.username as recorded_by_name,
        u.role as recorded_by_role,
        p.name as patient_name,
        q.queue_number,
        q.department
      FROM vitals v
      LEFT JOIN users u ON v.recorded_by = u.id
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN queue q ON v.queue_id = q.id
      WHERE v.patient_id = ?
      ORDER BY v.created_at DESC
      LIMIT 1
    `;
    
    const [results] = await db.query(sql, [patientId]);
    return results.length > 0 ? results[0] : null;
  },

  // Get vitals by ID
  getById: async (id) => {
    const sql = `
      SELECT 
        v.*,
        u.username as recorded_by_name,
        u.role as recorded_by_role,
        p.name as patient_name
      FROM vitals v
      LEFT JOIN users u ON v.recorded_by = u.id
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.id = ?
    `;
    
    const [results] = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  },

  // Get vitals by queue ID
  getByQueueId: async (queueId) => {
    const sql = `
      SELECT 
        v.*,
        u.username as recorded_by_name,
        u.role as recorded_by_role,
        p.name as patient_name
      FROM vitals v
      LEFT JOIN users u ON v.recorded_by = u.id
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.queue_id = ?
      ORDER BY v.created_at DESC
      LIMIT 1
    `;
    
    const [results] = await db.query(sql, [queueId]);
    return results.length > 0 ? results[0] : null;
  },

  // Get patient's vitals history
  getPatientHistory: async (patientId, limit = 10) => {
    const sql = `
      SELECT 
        v.*,
        u.username as recorded_by_name,
        u.role as recorded_by_role,
        q.queue_number,
        q.department
      FROM vitals v
      LEFT JOIN users u ON v.recorded_by = u.id
      LEFT JOIN queue q ON v.queue_id = q.id
      WHERE v.patient_id = ?
      ORDER BY v.created_at DESC
      LIMIT ?
    `;
    
    const [results] = await db.query(sql, [patientId, limit]);
    return results;
  },

  // Get all vitals with filters
  getAll: async (filters = {}) => {
    let sql = `
      SELECT 
        v.*,
        u.username as recorded_by_name,
        u.role as recorded_by_role,
        p.name as patient_name,
        p.phone as patient_phone,
        q.queue_number
      FROM vitals v
      LEFT JOIN users u ON v.recorded_by = u.id
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN queue q ON v.queue_id = q.id
      WHERE 1=1
    `;
    
    const params = [];

    if (filters.patient_id) {
      sql += ' AND v.patient_id = ?';
      params.push(filters.patient_id);
    }

    if (filters.recorded_by) {
      sql += ' AND v.recorded_by = ?';
      params.push(filters.recorded_by);
    }

    if (filters.date_from) {
      sql += ' AND DATE(v.created_at) >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      sql += ' AND DATE(v.created_at) <= ?';
      params.push(filters.date_to);
    }

    sql += ' ORDER BY v.created_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const [results] = await db.query(sql, params);
    return results;
  },

  // Delete vitals (soft delete or hard delete based on requirement)
  delete: async (id) => {
    const sql = "DELETE FROM vitals WHERE id = ?";
    const [result] = await db.query(sql, [id]);
    return result.affectedRows;
  }
};

module.exports = Vitals;