const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { requireHospitalScope } = require('../middlewares/hospitalScope');
const { requireModule } = require('../middleware/moduleAccess');

// Apply auth, hospital scope, and expenses module middleware to all routes
router.use(authMiddleware, requireHospitalScope, requireModule('expenses'));

// Public route to get expense categories (now protected as it relies on hospital_id)
router.get("/categories", expenseController.getCategories);

// expense summary
router.get("/summary", expenseController.getMonthlySummary);

// Create expense
router.post("/", expenseController.createExpense);
// Get all expenses
router.get("/", expenseController.getAllExpenses);
// Get expense by ID
router.get("/:id", expenseController.getExpenseById);
// Update expense
router.put("/:id", expenseController.updateExpense);
// router.put("/:id", roleMiddleware(["admin", "accountant"]), expenseController.updateExpense);

// Delete expense
// router.delete("/:id", roleMiddleware(["admin"]), expenseController.deleteExpense);
router.delete("/:id", expenseController.deleteExpense);



module.exports = router;
