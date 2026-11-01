const { Sequelize } = require("sequelize");
const Expense = require("../models/expenseModel");

exports.createExpense = async (req, res) => {
  try {
    const { hospital_id } = req.user;
    const newExpense = { ...req.body, hospital_id };
    const expense = await Expense.create(newExpense);
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getAllExpenses = async (req, res) => {
  try {
    const { hospital_id } = req.user;
    const expenses = await Expense.findAll({
      where: hospital_id ? { hospital_id } : {}
    });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getExpenseById = async (req, res) => {
  try {
    const { hospital_id } = req.user;
    const whereClause = hospital_id ? { id: req.params.id, hospital_id } : { id: req.params.id };
    const expense = await Expense.findOne({ where: whereClause });
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateExpense = async (req, res) => {
  try {
    const { hospital_id } = req.user;
    const whereClause = hospital_id ? { id: req.params.id, hospital_id } : { id: req.params.id };

    const [updatedRows] = await Expense.update(
      req.body,
      { where: whereClause }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const updatedExpense = await Expense.findByPk(req.params.id);
    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { hospital_id } = req.user;
    const whereClause = hospital_id ? { id: req.params.id, hospital_id } : { id: req.params.id };
    const deleted = await Expense.destroy({ where: whereClause });
    if (!deleted) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getCategories = async (req, res) => {
  try {
    const { hospital_id } = req.user;
    const categories = await Expense.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("category")), "category"]
      ],
      where: hospital_id ? { hospital_id } : {}
    });

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.query; // Expecting e.g., ?month=01&year=2026

    const { hospital_id } = req.user;
    const whereCondition = {
      [Sequelize.Op.and]: [
        Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('expense_date')), month),
        Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('expense_date')), year)
      ]
    };

    if (hospital_id) {
      whereCondition.hospital_id = hospital_id;
    }

    const summary = await Expense.findAll({
      attributes: [
        'category',
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total_amount']
      ],
      where: whereCondition,
      group: ['category']
    });

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};