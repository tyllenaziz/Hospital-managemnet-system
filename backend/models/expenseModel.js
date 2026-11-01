const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const Expense = sequelize.define("Expense", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM("doctor_salary", "staff_payment", "utilities", "medical_supplies", "equipment", "rent", "fuel", "internet", "misc"),
    allowNull: false,
  },
  paid_to: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expense_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  hospital_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: "expenses",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

module.exports = Expense;