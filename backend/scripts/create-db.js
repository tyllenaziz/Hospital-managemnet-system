const mysql = require("mysql2/promise");

async function main() {
  const connection = await mysql.createConnection({
    host: "database-1.c7c4csewsfmq.eu-north-1.rds.amazonaws.com",
    port: 3306,
    user: "admin",
    password: "Amnjeri2004",
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await connection.query("CREATE DATABASE IF NOT EXISTS vijomedix");
  console.log("Database created or already exists.");

  await connection.end();
}

main().catch((err) => {
  console.error("Failed to create database:", err);
  process.exit(1);
});