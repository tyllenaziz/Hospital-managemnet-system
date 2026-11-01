const db = require("../config/dbconfig");

const LabTest = {
  create: async (testData) => {
    const { test_name, test_code, category, price, normal_range, unit, description } = testData;
    const sql = `
      INSERT INTO lab_tests (test_name, test_code, category, price, normal_range, unit, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(sql, [test_name, test_code, category, price, normal_range, unit, description]);
    return { id: result.insertId, ...testData };
  },

  getAll: async () => {
    const sql = "SELECT * FROM lab_tests ORDER BY category, test_name";
    const [results] = await db.query(sql, []);
    return results;
  },

  getById: async (id) => {
    const sql = "SELECT * FROM lab_tests WHERE id = ?";
    const [results] = await db.query(sql, [id]);
    return results[0];
  },

  getByCode: async (test_code) => {
    const sql = "SELECT * FROM lab_tests WHERE test_code = ?";
    const [results] = await db.query(sql, [test_code]);
    return results[0];
  },

  search: async (query) => {
    const sql = "SELECT * FROM lab_tests WHERE test_name LIKE ? OR test_code LIKE ? OR category LIKE ?";
    const searchTerm = `%${query}%`;
    const [results] = await db.query(sql, [searchTerm, searchTerm, searchTerm]);
    return results;
  },

  update: async (id, testData) => {
    const { test_name, test_code, category, price, normal_range, unit, description } = testData;
    const sql = `
      UPDATE lab_tests 
      SET test_name = ?, test_code = ?, category = ?, price = ?, normal_range = ?, unit = ?, description = ? 
      WHERE id = ?
    `;
    
    const [result] = await db.query(sql, [test_name, test_code, category, price, normal_range, unit, description, id]);
    return result.affectedRows;
  },

  delete: async (id) => {
    const sql = "DELETE FROM lab_tests WHERE id = ?";
    const [result] = await db.query(sql, [id]);
    return result.affectedRows;
  }
};

module.exports = LabTest;