const db = require("../config/dbconfig.js");

const Patient = {
  generatePatientNumber: async (hospitalCode = 'BMP') => {
    try {
      // Use the hospital code prefix for searching existing numbers
      const prefix = `${hospitalCode}-`;

      // Get the latest patient number matching the hospital prefix
      const sql = "SELECT patient_number FROM patients WHERE patient_number LIKE ? ORDER BY id DESC LIMIT 1";
      const [results] = await db.query(sql, [`${prefix}%`]);

      if (results.length === 0) {
        // No patients for this hospital yet, start with 001
        return `${prefix}001`;
      }

      const lastPatientNumber = results[0].patient_number;

      // Extract the numeric part and increment
      // Matches Prefix-Number (e.g., BMP-001 or KNH-005)
      const regex = new RegExp(`${prefix}(\\d+)`);
      const match = lastPatientNumber.match(regex);

      if (match && match[1]) {
        const lastNumber = parseInt(match[1]);
        const nextNumber = lastNumber + 1;
        // Format with leading zeros (001, 002, etc.)
        return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
      }

      // Fallback: if format doesn't match, look for any number at end
      const fallbackMatch = lastPatientNumber.match(/(\d+)$/);
      if (fallbackMatch) {
        const lastNumber = parseInt(fallbackMatch[1]);
        return `${prefix}${(lastNumber + 1).toString().padStart(3, '0')}`;
      }

      return `${prefix}${Date.now().toString().slice(-4)}`;

    } catch (error) {
      console.error("Error generating patient number:", error);
      // Fallback: use timestamp-based number with code
      const timestamp = Date.now().toString().slice(-6);
      return `${hospitalCode}-${timestamp}`;
    }
  },

  create: async (patientData, hospitalId = null, hospitalCode = 'BMP') => {
    const {
      name, phone, alternative_phone, email, age, gender, id_number,
      next_of_kin_name, next_of_kin_phone, next_of_kin_relationship,
      county, town, address, house_number
    } = patientData;

    // Generate unique patient number with hospital code
    const patient_number = await Patient.generatePatientNumber(hospitalCode);

    const sql = `INSERT INTO patients (
      patient_number, hospital_id, name, phone, alternative_phone, email, age, gender, id_number,
      next_of_kin_name, next_of_kin_phone, next_of_kin_relationship,
      county, town, address, house_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await db.query(sql, [
      patient_number,
      hospitalId,
      name, phone, alternative_phone || null, email || null, age, gender, id_number,
      next_of_kin_name || null, next_of_kin_phone || null, next_of_kin_relationship || null,
      county || null, town || null, address || null, house_number || null
    ]);

    return {
      id: result.insertId,
      patient_number,
      hospital_id: hospitalId,
      ...patientData
    };
  },

  findById: async (id, hospitalId = null) => {
    let sql = "SELECT * FROM patients WHERE id = ?";
    const params = [id];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [results] = await db.query(sql, params);
    return results[0];
  },

  findByPatientNumber: async (patient_number, hospitalId = null) => {
    let sql = "SELECT * FROM patients WHERE patient_number = ?";
    const params = [patient_number];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [results] = await db.query(sql, params);
    return results[0];
  },

  findByIdNumber: async (id_number, hospitalId = null) => {
    let sql = "SELECT * FROM patients WHERE id_number = ?";
    const params = [id_number];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [results] = await db.query(sql, params);
    return results[0];
  },

  findByPhone: async (phone, hospitalId = null) => {
    let sql = "SELECT * FROM patients WHERE (phone = ? OR alternative_phone = ?)";
    const params = [phone, phone];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [results] = await db.query(sql, params);
    return results[0];
  },

  findByEmail: async (email, hospitalId = null) => {
    let sql = "SELECT * FROM patients WHERE email = ?";
    const params = [email];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [results] = await db.query(sql, params);
    return results[0];
  },

  getAll: async (hospitalId = null) => {
    let sql = "SELECT * FROM patients";
    const params = [];
    if (hospitalId) {
      sql += " WHERE hospital_id = ?";
      params.push(hospitalId);
    }
    sql += " ORDER BY created_at DESC";
    const [results] = await db.query(sql, params);
    return results;
  },

  search: async (query, hospitalId = null) => {
    let sql = `SELECT * FROM patients WHERE (
    name LIKE ? 
    OR phone LIKE ? 
    OR alternative_phone LIKE ?
    OR email LIKE ?
    OR id_number LIKE ? 
    OR patient_number LIKE ?
    OR county LIKE ?
    OR town LIKE ?)`;
    const searchTerm = `%${query}%`;
    const params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    sql += " ORDER BY created_at DESC";
    const [results] = await db.query(sql, params);
    return results;
  },

  update: async (id, patientData, hospitalId = null) => {
    const {
      name, phone, alternative_phone, email, age, gender, id_number,
      next_of_kin_name, next_of_kin_phone, next_of_kin_relationship,
      county, town, address, house_number
    } = patientData;

    let sql = `UPDATE patients SET 
      name = ?, phone = ?, alternative_phone = ?, email = ?, age = ?, gender = ?, id_number = ?,
      next_of_kin_name = ?, next_of_kin_phone = ?, next_of_kin_relationship = ?,
      county = ?, town = ?, address = ?, house_number = ?,
      updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`;

    const params = [
      name, phone, alternative_phone || null, email || null, age, gender, id_number,
      next_of_kin_name || null, next_of_kin_phone || null, next_of_kin_relationship || null,
      county || null, town || null, address || null, house_number || null,
      id
    ];

    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }

    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  },

  delete: async (id, hospitalId = null) => {
    let sql = "DELETE FROM patients WHERE id = ?";
    const params = [id];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  },
  /**
   * Get patient visit history with non-sensitive data only
   * Excludes diagnosis, prescriptions, and other medical details
   */
  getVisitHistory: async (patientId, hospitalId = null) => {
    let sql = `
      SELECT 
        q.id,
        q.queue_number,
        q.department,
        q.status,
        q.created_at as visit_date,
        q.updated_at,
        u.username as attended_by,
        CASE 
          WHEN lo.id IS NOT NULL THEN TRUE 
          ELSE FALSE 
        END as has_lab_tests,
        CASE 
          WHEN p.id IS NOT NULL THEN TRUE 
          ELSE FALSE 
        END as has_prescription,
        v.blood_pressure_systolic,
        v.blood_pressure_diastolic,
        v.temperature,
        v.pulse_rate,
        v.weight,
        v.height
      FROM queue q
      LEFT JOIN users u ON q.assigned_to = u.id
      LEFT JOIN lab_orders lo ON q.id = lo.queue_id
      LEFT JOIN prescriptions p ON q.id = p.queue_id
      LEFT JOIN vitals v ON q.id = v.queue_id
      WHERE q.patient_id = ?`;

    const params = [patientId];
    if (hospitalId) {
      sql += " AND q.hospital_id = ?";
      params.push(hospitalId);
    }
    sql += " ORDER BY q.created_at DESC";

    const [results] = await db.query(sql, params);
    return results;
  },

  /**
   * Get visit statistics for a patient
   */
  getVisitStats: async (patientId, hospitalId = null) => {
    let sql = `
      SELECT 
        COUNT(*) as total_visits,
        SUM(CASE WHEN department = 'doctor' THEN 1 ELSE 0 END) as doctor_visits,
        SUM(CASE WHEN department = 'nurse' THEN 1 ELSE 0 END) as nurse_visits,
        SUM(CASE WHEN department = 'lab' THEN 1 ELSE 0 END) as lab_visits,
        SUM(CASE WHEN department = 'pharmacy' THEN 1 ELSE 0 END) as pharmacy_visits,
        MAX(created_at) as last_visit_date,
        MIN(created_at) as first_visit_date
      FROM queue
      WHERE patient_id = ? AND status IN ('done', 'in_progress')`;

    const params = [patientId];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }

    const [results] = await db.query(sql, params);
    return results[0];
  }
};

module.exports = Patient;