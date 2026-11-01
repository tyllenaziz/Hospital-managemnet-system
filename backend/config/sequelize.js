const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
    dialectOptions: {
      decimalNumbers: true,
    },
    logging: false, // Set to console.log to see SQL queries in terminal
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Sequelize connection has been established successfully.");
    // Don't use alter:true as it can cause constraint conflicts with manually created tables
    // Tables are already created by setupDatabase.js script
    // await sequelize.sync({ alter: true }); 
    console.log("✅ Database connection ready.");
  } catch (error) {
    console.error("❌ Unable to connect to the database with Sequelize:", error);
  }
};

testConnection();

module.exports = { sequelize, Sequelize };
