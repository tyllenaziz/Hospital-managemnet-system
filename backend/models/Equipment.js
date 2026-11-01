const db = require("../config/dbconfig");

const Equipment = {
  // Get all equipment
  getAll: async (hospitalId = null) => {
    try {
      let sql = `SELECT *, (purchase_price * quantity) as total_value FROM equipment`;
      const params = [];
      if (hospitalId) {
        sql += ` WHERE hospital_id = ?`;
        params.push(hospitalId);
      }
      sql += ` ORDER BY created_at DESC`;
      const [rows] = await db.query(sql, params);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get equipment by ID
  getById: async (id, hospitalId = null) => {
    try {
      let sql = `SELECT *, (purchase_price * quantity) as total_value FROM equipment WHERE id = ?`;
      const params = [id];
      if (hospitalId) {
        sql += ` AND hospital_id = ?`;
        params.push(hospitalId);
      }
      const [rows] = await db.query(sql, params);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get equipment by serial number
  getBySerialNumber: async (serialNumber, hospitalId = null) => {
    try {
      let sql = `SELECT *, (purchase_price * quantity) as total_value FROM equipment WHERE serial_number = ?`;
      const params = [serialNumber];
      if (hospitalId) {
        sql += ` AND hospital_id = ?`;
        params.push(hospitalId);
      }
      const [rows] = await db.query(sql, params);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Create new equipment
  create: async (equipmentData, hospitalId = null) => {
    try {
      const {
        name,
        serial_number,
        purchase_date,
        purchase_price,
        quantity,
        warranty_expiry,
        status,
        location,
        description
      } = equipmentData;

      const [result] = await db.query(
        `INSERT INTO equipment (
          name, serial_number, purchase_date, purchase_price, quantity,
          warranty_expiry, status, location, description, hospital_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          serial_number,
          purchase_date,
          purchase_price || 0,
          quantity || 1,
          warranty_expiry,
          status || 'active',
          location,
          description,
          hospitalId
        ]
      );

      return {
        id: result.insertId,
        ...equipmentData,
        hospital_id: hospitalId,
        total_value: (purchase_price || 0) * (quantity || 1)
      };
    } catch (error) {
      throw error;
    }
  },

  // Update equipment
  update: async (id, equipmentData, hospitalId = null) => {
    try {
      const {
        name,
        serial_number,
        purchase_date,
        purchase_price,
        quantity,
        warranty_expiry,
        status,
        location,
        description
      } = equipmentData;

      let sql = `UPDATE equipment SET 
          name = ?, serial_number = ?, purchase_date = ?, purchase_price = ?, quantity = ?,
          warranty_expiry = ?, status = ?, location = ?, description = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;
      const params = [
        name,
        serial_number,
        purchase_date,
        purchase_price || 0,
        quantity || 1,
        warranty_expiry,
        status || 'active',
        location,
        description,
        id
      ];

      if (hospitalId) {
        sql += ` AND hospital_id = ?`;
        params.push(hospitalId);
      }

      const [result] = await db.query(sql, params);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  },

  // Delete equipment
  delete: async (id, hospitalId = null) => {
    try {
      let sql = "DELETE FROM equipment WHERE id = ?";
      const params = [id];
      if (hospitalId) {
        sql += ` AND hospital_id = ?`;
        params.push(hospitalId);
      }
      const [result] = await db.query(sql, params);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  },

  // Search equipment
  search: async (query, hospitalId = null) => {
    try {
      const searchTerm = `%${query}%`;
      let sql = `SELECT *, (purchase_price * quantity) as total_value
         FROM equipment 
         WHERE (name LIKE ? OR serial_number LIKE ? OR location LIKE ?)`;
      const params = [searchTerm, searchTerm, searchTerm];

      if (hospitalId) {
        sql += ` AND hospital_id = ?`;
        params.push(hospitalId);
      }
      sql += ` ORDER BY created_at DESC`;
      const [rows] = await db.query(sql, params);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get equipment by status
  getByStatus: async (status, hospitalId = null) => {
    try {
      let sql = `SELECT *, (purchase_price * quantity) as total_value
         FROM equipment WHERE status = ?`;
      const params = [status];
      if (hospitalId) {
        sql += ` AND hospital_id = ?`;
        params.push(hospitalId);
      }
      sql += ` ORDER BY created_at DESC`;
      const [rows] = await db.query(sql, params);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get equipment needing maintenance (warranty expiring soon or status maintenance)
  getMaintenanceNeeded: async (days = 30, hospitalId = null) => {
    try {
      let sql = `SELECT *, (purchase_price * quantity) as total_value
         FROM equipment 
         WHERE (warranty_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY) 
            OR status = 'maintenance')`;
      const params = [days];
      if (hospitalId) {
        sql += ` AND hospital_id = ?`;
        params.push(hospitalId);
      }
      sql += ` ORDER BY warranty_expiry ASC`;
      const [rows] = await db.query(sql, params);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get equipment statistics
  getStats: async (hospitalId = null) => {
    try {
      let sql = `SELECT 
          COUNT(*) as total_count,
          SUM(purchase_price * quantity) as total_value,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_count,
          SUM(CASE WHEN status = 'broken' THEN 1 ELSE 0 END) as broken_count,
          SUM(CASE WHEN status = 'retired' THEN 1 ELSE 0 END) as retired_count,
          SUM(quantity) as total_quantity
        FROM equipment`;
      const params = [];
      if (hospitalId) {
        sql += ` WHERE hospital_id = ?`;
        params.push(hospitalId);
      }
      const [stats] = await db.query(sql, params);
      return stats[0];
    } catch (error) {
      throw error;
    }
  },

  // Get low stock equipment
  getLowQuantity: async (threshold = 5, hospitalId = null) => {
    try {
      let sql = `SELECT *, (purchase_price * quantity) as total_value
         FROM equipment 
         WHERE quantity <= ?`;
      const params = [threshold];
      if (hospitalId) {
        sql += ` AND hospital_id = ?`;
        params.push(hospitalId);
      }
      sql += ` ORDER BY quantity ASC`;
      const [rows] = await db.query(sql, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Equipment;