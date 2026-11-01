const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  decimalNumbers: true,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 30),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 20000
});

db.getConnection()
  .then((conn) => {
    console.log("✅ Connected to MySQL as ID " + conn.threadId);
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });

module.exports = db;
