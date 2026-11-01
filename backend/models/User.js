const db = require("../config/dbconfig.js");

class User {
  static create(username, password, role, callback) {
    const sql = "INSERT INTO users (username, password, role, phone) VALUES (?, ?, ?)";
    db.query(sql, [username, password, role], function (err, result) {
      if (err) return callback(err);
      callback(null, { id: result.insertId, username, role });
    });``
  }

  static findByUsername(username, callback) {
    const sql = "SELECT * FROM users WHERE username = ?";
    db.query(sql, [username], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]); // MySQL returns array, get first result
    });
  }

  static updateLastLogin(id, callback) {
    const sql = "UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?";
    db.query(sql, [id], function (err, result) {
      if (err) return callback(err);
      callback(null, result.affectedRows);
    });
  }

  static getAll(callback) {
    const sql = "SELECT id, username, role, lastLogin, createdAt FROM users";
    db.query(sql, [], (err, results) => {
      callback(err, results);
    });
  }
}

module.exports = User;