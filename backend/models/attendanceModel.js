const db = require("../config/dbconfig");

const AttendanceModel = {
  getAllRecords: async (filterDate) => {
    const query = `
      SELECT 
        a.id,
        a.user_id,
        u.username as name,
        u.phone as staff_id,
        u.role,
        a.check_in_time,
        a.check_out_time,
        a.date,
        a.status,
        a.notes,
        a.created_at,
        a.updated_at
      FROM attendance a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.date = ?
      ORDER BY a.check_in_time DESC
    `;
    
    const [results] = await db.query(query, [filterDate]);
    return results;
  },

  getPresentStaff: async (filterDate) => {
    const query = `
      SELECT 
        a.id,
        a.user_id,
        u.username as name,
        u.phone as staff_id,
        u.role,
        a.check_in_time,
        a.check_out_time,
        a.date,
        a.status,
        a.notes
      FROM attendance a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.date = ? 
        AND a.check_in_time IS NOT NULL
        AND a.status != 'absent'
      ORDER BY a.check_in_time ASC
    `;
    
    const [results] = await db.query(query, [filterDate]);
    return results;
  },

  getAbsentStaff: async (filterDate) => {
    const query = `
      SELECT 
        u.id as user_id,
        u.username as name,
        u.phone as staff_id,
        u.role
      FROM users u
      LEFT JOIN attendance a ON u.id = a.user_id AND a.date = ?
      WHERE u.role != 'patient' 
        AND (a.id IS NULL OR a.status = 'absent')
      ORDER BY u.username ASC
    `;
    
    const [results] = await db.query(query, [filterDate]);
    return results;
  },

  getLateArrivals: async (filterDate) => {
    const query = `
      SELECT 
        a.id,
        a.user_id,
        u.username as name,
        u.phone as staff_id,
        u.role,
        a.check_in_time,
        a.check_out_time,
        a.status,
        a.date,
        TIMEDIFF(a.check_in_time, '09:00:00') as late_by
      FROM attendance a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.date = ? 
        AND a.check_in_time > '09:00:00'
        AND a.status != 'absent'
      ORDER BY a.check_in_time ASC
    `;
    
    const [results] = await db.query(query, [filterDate]);
    return results;
  },

  checkExistingCheckIn: async (userId, date) => {
    const query = `
      SELECT id, status, check_in_time, check_out_time 
      FROM attendance 
      WHERE user_id = ? AND date = ?
    `;
    
    const [results] = await db.query(query, [userId, date]);
    return results;
  },

  createCheckIn: async (userId, checkInTime, date, status) => {
    const query = `
      INSERT INTO attendance (user_id, check_in_time, date, status)
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await db.query(query, [userId, checkInTime, date, status]);
    return result;
  },

  updateCheckOut: async (userId, checkOutTime, date) => {
    const query = `
      UPDATE attendance 
      SET check_out_time = ?, 
          status = 'checked_out',
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? 
        AND date = ? 
        AND check_out_time IS NULL
    `;
    
    const [result] = await db.query(query, [checkOutTime, userId, date]);
    return result;
  }
};

module.exports = AttendanceModel;