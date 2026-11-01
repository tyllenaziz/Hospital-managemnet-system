const db = require("../config/dbconfig");

const Prescription = {
  create: async (prescriptionData) => {
    const { queue_id, patient_id, doctor_id, notes, diagnosis, items } = prescriptionData;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const sql = `
        INSERT INTO prescriptions (queue_id, patient_id, doctor_id, notes, diagnosis, hospital_id) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await connection.query(sql, [queue_id, patient_id, doctor_id, notes, diagnosis, prescriptionData.hospital_id]);
      const prescriptionId = result.insertId;

      if (items && items.length > 0) {
        const itemSql = `
          INSERT INTO prescription_items 
          (prescription_id, medicine_id, custom_medicine_name, quantity, dosage, duration, instructions) 
          VALUES ?
        `;

        const itemValues = items.map(item => [
          prescriptionId,
          item.medicine_id || null,  // Convert empty string to null
          item.custom_medicine_name || null,  // Store custom name if provided
          item.quantity,
          item.dosage,
          item.duration,
          item.instructions
        ]);

        await connection.query(itemSql, [itemValues]);
      }

      await connection.commit();
      return { id: prescriptionId };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  getById: async (id, hospitalId = null) => {
    let sql = `
      SELECT p.*, 
             pat.name as patient_name, 
             u.username as doctor_name,
             pi.id as item_id,
             pi.quantity,
             pi.dosage,
             pi.duration,
             pi.instructions,
             pi.custom_medicine_name,
             m.id as medicine_id,
             m.name as medicine_name,
             m.barcode,
             m.price
      FROM prescriptions p
      JOIN patients pat ON p.patient_id = pat.id
      JOIN users u ON p.doctor_id = u.id
      LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
      LEFT JOIN medicines m ON pi.medicine_id = m.id
      WHERE p.id = ?`;
    const params = [id];
    if (hospitalId) {
      sql += " AND p.hospital_id = ?";
      params.push(hospitalId);
    }

    const [results] = await db.query(sql, params);
    if (results.length === 0) return null;

    const prescription = {
      id: results[0].id,
      queue_id: results[0].queue_id,
      patient_id: results[0].patient_id,
      patient_name: results[0].patient_name,
      doctor_id: results[0].doctor_id,
      doctor_name: results[0].doctor_name,
      notes: results[0].notes,
      diagnosis: results[0].diagnosis,
      status: results[0].status,
      created_at: results[0].created_at,
      items: []
    };

    results.forEach(row => {
      if (row.item_id) {
        prescription.items.push({
          id: row.item_id,
          medicine_id: row.medicine_id,
          medicine_name: row.medicine_name || row.custom_medicine_name,  // Use custom name if no inventory medicine
          custom_medicine_name: row.custom_medicine_name,
          barcode: row.barcode,
          quantity: row.quantity,
          dosage: row.dosage,
          duration: row.duration,
          instructions: row.instructions,
          price: row.price
        });
      }
    });

    return prescription;
  },

  getPending: async (hospitalId = null) => {
    let sql = `
      SELECT p.*, 
             pat.name as patient_name,
             u.username as doctor_name
      FROM prescriptions p
      JOIN patients pat ON p.patient_id = pat.id
      JOIN users u ON p.doctor_id = u.id
      WHERE p.status = 'pending'
    `;
    const params = [];

    if (hospitalId) {
      sql += " AND p.hospital_id = ?";
      params.push(hospitalId);
    }

    sql += " ORDER BY p.created_at ASC";

    const [results] = await db.query(sql, params);
    return results;
  },

  updateStatus: async (id, status, hospitalId = null) => {
    let sql = "UPDATE prescriptions SET status = ? WHERE id = ?";
    const params = [status, id];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [result] = await db.query(sql, params);
    return result.affectedRows;
  },

  getAll: async (filters = {}, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;

    let conditions = [];
    let queryParams = [];

    if (filters.status) {
      conditions.push('p.status = ?');
      queryParams.push(filters.status);
    }

    if (filters.patient_id) {
      conditions.push('p.patient_id = ?');
      queryParams.push(filters.patient_id);
    }

    if (filters.doctor_id) {
      conditions.push('p.doctor_id = ?');
      queryParams.push(filters.doctor_id);
    }

    if (filters.hospital_id) {
      conditions.push('p.hospital_id = ?');
      queryParams.push(filters.hospital_id);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countSql = `SELECT COUNT(*) as total FROM prescriptions p ${whereClause}`;
    const [[countResult]] = await db.query(countSql, queryParams);
    const total = countResult?.total || 0;

    const dataSql = `
      SELECT 
        p.*,
        pt.name as patient_name,
        pt.phone as patient_phone,
        u.username as doctor_name,
        u.role as doctor_role
      FROM prescriptions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN users u ON p.doctor_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [prescriptions] = await db.query(dataSql, [...queryParams, limit, offset]);

    return { prescriptions, total };
  },
  getByQueueId: async (queueId, hospitalId = null) => {
    let sql = `
      SELECT p.*, 
             u.username as doctor_name,
             pi.id as item_id,
             pi.medicine_id,
             pi.custom_medicine_name,
             m.name as medicine_name,
             pi.quantity,
             pi.dosage,
             pi.duration,
             pi.instructions,
             m.price
      FROM prescriptions p
      LEFT JOIN users u ON p.doctor_id = u.id
      LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
      LEFT JOIN medicines m ON pi.medicine_id = m.id
      WHERE p.queue_id = ?`;
    const params = [queueId];
    if (hospitalId) {
      sql += " AND p.hospital_id = ?";
      params.push(hospitalId);
    }

    const [results] = await db.query(sql, params);

    if (results.length === 0) {
      return null;
    }

    const prescription = {
      id: results[0].id,
      queue_id: results[0].queue_id,
      patient_id: results[0].patient_id,
      doctor_id: results[0].doctor_id,
      doctor_name: results[0].doctor_name,
      notes: results[0].notes,
      diagnosis: results[0].diagnosis,
      status: results[0].status,
      created_at: results[0].created_at,
      items: results.filter(r => r.item_id).map(r => ({
        id: r.item_id,
        medicine_id: r.medicine_id,
        medicine_name: r.medicine_name || r.custom_medicine_name,
        custom_medicine_name: r.custom_medicine_name,
        quantity: r.quantity,
        dosage: r.dosage,
        duration: r.duration,
        instructions: r.instructions,
        price: r.price
      }))
    };

    return prescription;
  },

  //Update existing prescription
  update: async (prescriptionId, prescriptionData, hospitalId = null) => {
    const { queue_id, patient_id, doctor_id, notes, diagnosis, items } = prescriptionData;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Update main prescription record - scoped to hospital
      let updateSql = `
        UPDATE prescriptions 
        SET notes = ?, diagnosis = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;
      const updateParams = [notes, diagnosis, prescriptionId];
      if (hospitalId) {
        updateSql += " AND hospital_id = ?";
        updateParams.push(hospitalId);
      }
      await connection.query(updateSql, updateParams);

      // Delete existing items
      const deleteSql = "DELETE FROM prescription_items WHERE prescription_id = ?";
      await connection.query(deleteSql, [prescriptionId]);

      // Insert new items
      if (items && items.length > 0) {
        const itemSql = `
          INSERT INTO prescription_items 
          (prescription_id, medicine_id, custom_medicine_name, quantity, dosage, duration, instructions) 
          VALUES ?
        `;
        const itemValues = items.map(item => [
          prescriptionId,
          item.medicine_id || null,
          item.custom_medicine_name || null,
          item.quantity,
          item.dosage || null,
          item.duration || null,
          item.instructions || null
        ]);
        await connection.query(itemSql, [itemValues]);
      }

      await connection.commit();
      return { id: prescriptionId };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = Prescription;