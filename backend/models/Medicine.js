const db = require("../config/dbconfig");

const Medicine = {
  create: async (medicineData) => {
    const { name, barcode, stock, price, expiry_date, hospital_id } = medicineData;
    const sql = "INSERT INTO medicines (name, barcode, stock, price, expiry_date, hospital_id) VALUES (?, ?, ?, ?, ?, ?)";

    const [result] = await db.query(sql, [name, barcode, stock, price, expiry_date, hospital_id]);
    return { id: result.insertId, ...medicineData };
  },

  getAll: async (hospitalId = null) => {
    let sql = "SELECT * FROM medicines";
    const params = [];

    if (hospitalId) {
      sql += " WHERE hospital_id = ?";
      params.push(hospitalId);
    }

    sql += " ORDER BY name ASC";
    const [results] = await db.query(sql, params);
    return results;
  },

  getById: async (id, hospitalId = null) => {
    let sql = "SELECT * FROM medicines WHERE id = ?";
    const params = [id];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [results] = await db.query(sql, params);
    return results[0];
  },

  getByBarcode: async (barcode, hospitalId = null) => {
    let sql = "SELECT * FROM medicines WHERE barcode = ?";
    const params = [barcode];

    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }

    const [results] = await db.query(sql, params);
    return results[0];
  },

  search: async (query, hospitalId = null) => {
    let sql = "SELECT * FROM medicines WHERE (name LIKE ? OR barcode LIKE ?)";
    const searchTerm = `%${query}%`;
    const params = [searchTerm, searchTerm];

    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }

    const [results] = await db.query(sql, params);
    return results;
  },

  update: async (id, medicineData, hospitalId = null) => {
    const { name, barcode, stock, price, expiry_date } = medicineData;
    let sql = "UPDATE medicines SET name = ?, barcode = ?, stock = ?, price = ?, expiry_date = ? WHERE id = ?";
    const params = [name, barcode, stock, price, expiry_date, id];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [result] = await db.query(sql, params);
    return result.affectedRows;
  },

  updateStock: async (id, quantity, operation = 'subtract', connection = null) => {
    const dbConnection = connection || db;

    let sql, params;

    if (operation === 'add') {
      sql = "UPDATE medicines SET stock = stock + ? WHERE id = ?";
      params = [quantity, id];
    } else {
      sql = "UPDATE medicines SET stock = stock - ? WHERE id = ? AND stock >= ?";
      params = [quantity, id, quantity];
    }

    const [result] = await dbConnection.query(sql, params);

    if (operation === 'subtract' && result.affectedRows === 0) {
      throw new Error("Insufficient stock");
    }

    return result.affectedRows;
  },

  delete: async (id, hospitalId = null) => {
    let sql = "DELETE FROM medicines WHERE id = ?";
    const params = [id];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [result] = await db.query(sql, params);
    return result.affectedRows;
  },

  getLowStock: async (threshold = 10, hospitalId = null) => {
    let sql = "SELECT * FROM medicines WHERE stock <= ?";
    const params = [threshold];

    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }

    sql += " ORDER BY stock ASC";
    const [results] = await db.query(sql, params);
    return results;
  },

  getExpiringSoon: async (days = 30, hospitalId = null) => {
    let sql = `
      SELECT * FROM medicines 
      WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY) 
        AND expiry_date >= CURDATE() 
    `;
    const params = [days];

    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }

    sql += " ORDER BY expiry_date ASC";
    const [results] = await db.query(sql, params);
    return results;
  }
};

module.exports = Medicine;