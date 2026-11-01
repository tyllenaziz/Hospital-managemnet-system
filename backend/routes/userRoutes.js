const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middlewares/authMiddleware"); 
const roleMiddleware = require("../middlewares/roleMiddleware");

// Public routes
router.post("/login", userController.login);
router.post('/refresh-token', userController.refreshToken);

// Protected routes
router.post("/logout", authMiddleware, userController.logout);
router.post("/register", authMiddleware, roleMiddleware(["admin", "supervisor"]), userController.register);
router.get("/", authMiddleware, roleMiddleware(["admin", "supervisor"]), userController.listUsers);
router.put("/:id", authMiddleware, roleMiddleware(["admin", "supervisor"]), userController.updateUser);
router.delete("/:id", authMiddleware, roleMiddleware(["admin", "supervisor"]), userController.deleteUser);

module.exports = router;