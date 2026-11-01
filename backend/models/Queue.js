const db = require("../config/dbconfig.js");

const Queue = {
  // Generate queue number (e.g., D-001, L-045, P-023)
  generateQueueNumber: async (department, hospitalId) => {
    const prefix = department.charAt(0).toUpperCase();
    let sql = "SELECT COUNT(*) as count FROM queue WHERE department = ? AND DATE(created_at) = CURDATE()";
    const params = [department];

    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }

    const [results] = await db.query(sql, params);
    const count = results[0].count + 1;
    const queueNumber = `${prefix}-${String(count).padStart(3, '0')}`;
    return queueNumber;
  },

  addToQueue: async (patientId, department, hospitalId) => {
    const queueNumber = await Queue.generateQueueNumber(department, hospitalId);

    const sql = "INSERT INTO queue (patient_id, department, queue_number, status, hospital_id) VALUES (?, ?, ?, 'waiting', ?)";
    const [result] = await db.query(sql, [patientId, department, queueNumber, hospitalId]);

    return {
      id: result.insertId,
      queueNumber,
      department,
      status: 'waiting',
      hospital_id: hospitalId
    };
  },

  getByDepartment: async (department, status = null, hospitalId = null) => {
    let sql = `
      SELECT q.*, p.name, p.phone, p.age, p.gender, p.id_number
      FROM queue q 
      JOIN patients p ON q.patient_id = p.id 
      WHERE q.department = ?
        AND q.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;

    const params = [department];

    if (hospitalId) {
      sql += " AND q.hospital_id = ?";
      params.push(hospitalId);
    }

    // If status is provided, filter by it
    // If no status provided, show waiting, in_progress, and done (not cancelled)
    if (status) {
      sql += ' AND q.status = ?';
      params.push(status);
    } else {
      sql += " AND q.status IN ('waiting', 'in_progress', 'done')";
    }

    // Sort: waiting first, then in_progress, then done (completed) at the bottom
    sql += ' ORDER BY FIELD(q.status, "waiting", "in_progress", "done"), q.created_at ASC';

    const [results] = await db.query(sql, params);

    // Keep only the latest queue entry per patient for the selected department/status view.
    // This prevents the same patient from appearing multiple times after round-trips like doctor -> lab -> doctor.
    const latestByPatient = new Map();

    results.forEach((row) => {
      const existing = latestByPatient.get(row.patient_id);

      if (!existing) {
        latestByPatient.set(row.patient_id, row);
        return;
      }

      const existingCreatedAt = new Date(existing.created_at).getTime();
      const currentCreatedAt = new Date(row.created_at).getTime();

      if (currentCreatedAt > existingCreatedAt || (currentCreatedAt === existingCreatedAt && row.id > existing.id)) {
        latestByPatient.set(row.patient_id, row);
      }
    });

    const statusOrder = {
      waiting: 1,
      in_progress: 2,
      done: 3,
      cancelled: 4
    };

    return Array.from(latestByPatient.values()).sort((a, b) => {
      const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.created_at) - new Date(b.created_at);
    });
  },

  getById: async (id, hospitalId = null) => {
    let sql = `
      SELECT 
        q.id,
        q.patient_id,
        q.department,
        q.assigned_to,
        q.status,
        q.queue_number,
        q.notes,
        q.diagnosis,
        q.created_at,
        q.updated_at,
        p.id as patient_id,
        p.name,
        p.phone,
        p.age,
        p.gender,
        p.id_number
      FROM queue q 
      JOIN patients p ON q.patient_id = p.id 
      WHERE q.id = ?
        AND q.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`;

    const params = [id];
    if (hospitalId) {
      sql += " AND q.hospital_id = ?";
      params.push(hospitalId);
    }

    const [results] = await db.query(sql, params);

    if (!results || results.length === 0) {
      return null;
    }

    return results[0];
  },

  updateStatus: async (id, status, assignedTo = null, hospitalId = null) => {
    let sql = "UPDATE queue SET status = ?, assigned_to = ? WHERE id = ?";
    const params = [status, assignedTo, id];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [result] = await db.query(sql, params);
    return result.affectedRows;
  },

  addConsultation: async (id, data, hospitalId = null) => {
    const { notes, diagnosis, prescription } = data;
    let sql = "UPDATE queue SET notes = ?, diagnosis = ?, prescription = ?, status = 'done' WHERE id = ?";
    const params = [notes, diagnosis, prescription, id];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [result] = await db.query(sql, params);
    return result.affectedRows;
  },

  moveToDepartment: async (queueId, nextDepartment, hospitalId = null, options = {}) => {
    const {
      status = 'waiting',
      assignedTo = null,
      regenerateQueueNumber = true
    } = options;

    const queueNumber = regenerateQueueNumber
      ? await Queue.generateQueueNumber(nextDepartment, hospitalId)
      : null;

    let sql = `
      UPDATE queue
      SET department = ?,
          status = ?,
          assigned_to = ?,
          updated_at = CURRENT_TIMESTAMP
    `;

    const params = [nextDepartment, status, assignedTo];

    if (queueNumber) {
      sql += ", queue_number = ?";
      params.push(queueNumber);
    }

    sql += " WHERE id = ?";
    params.push(queueId);

    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }

    await db.query(sql, params);

    const updatedQueue = await Queue.getById(queueId, hospitalId);
    if (!updatedQueue) {
      return null;
    }

    return {
      id: updatedQueue.id,
      queueNumber: updatedQueue.queue_number,
      department: updatedQueue.department,
      status: updatedQueue.status,
      hospital_id: hospitalId
    };
  },

  transferToNextDepartment: async (queueId, patientId, nextDepartment, hospitalId) => {
    return await Queue.moveToDepartment(queueId, nextDepartment, hospitalId, {
      status: 'waiting',
      assignedTo: null,
      regenerateQueueNumber: true
    });
  },

  findLatestByPatientAndDepartment: async (patientId, department, hospitalId = null, excludeQueueId = null) => {
    let sql = `
      SELECT *
      FROM queue
      WHERE patient_id = ?
        AND department = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        AND status IN ('waiting', 'in_progress', 'done')
    `;

    const params = [patientId, department];

    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }

    if (excludeQueueId) {
      sql += " AND id <> ?";
      params.push(excludeQueueId);
    }

    sql += " ORDER BY created_at DESC, id DESC LIMIT 1";

    const [results] = await db.query(sql, params);
    return results[0] || null;
  },

  returnPatientToDepartment: async (queueId, patientId, department, hospitalId = null) => {
    const movedQueue = await Queue.moveToDepartment(queueId, department, hospitalId, {
      status: 'waiting',
      assignedTo: null,
      regenerateQueueNumber: true
    });

    return {
      ...movedQueue,
      reused: true
    };
  },

  // Reopen a completed consultation for modifications
  reopenConsultation: async (id, userId, hospitalId = null) => {
    let sql = "UPDATE queue SET status = 'in_progress', assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'done'";
    const params = [userId, id];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [result] = await db.query(sql, params);
    return result.affectedRows;
  },

  // Auto-expire old queue items (run this periodically or before queries)
  autoExpireOldQueue: async (hospitalId = null) => {
    let sql = `
      UPDATE queue 
      SET status = 'cancelled', 
          notes = CONCAT(IFNULL(notes, ''), '\n[AUTO-EXPIRED: Queue item older than 24 hours]')
      WHERE status IN ('waiting', 'in_progress', 'done')
        AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`;
    const params = [];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }

    const [result] = await db.query(sql, params);
    return result.affectedRows;
  },

  // Get queue items that are about to expire (within 2 hours)
  getExpiringQueue: async (hospitalId = null) => {
    let sql = `
      SELECT q.*, p.name, p.phone 
      FROM queue q 
      JOIN patients p ON q.patient_id = p.id 
      WHERE q.status IN ('waiting', 'in_progress', 'done')
        AND q.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 24 HOUR) AND DATE_SUB(NOW(), INTERVAL 22 HOUR)
    `;
    const params = [];

    if (hospitalId) {
      sql += " AND q.hospital_id = ?";
      params.push(hospitalId);
    }

    sql += " ORDER BY q.created_at ASC";

    const [results] = await db.query(sql, params);
    return results;
  }
};

module.exports = Queue;
