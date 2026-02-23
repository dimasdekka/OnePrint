const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

/**
 * Auth Routes
 */

// Public routes
router.post("/auth/login", authController.login);
router.post("/auth/logout", authController.logout);
router.get("/auth/me", authController.getCurrentUser);

// Admin only routes
router.post("/auth/users", authController.createAdminUser);
router.get("/auth/users", authController.listUsers);
router.post("/auth/password", authController.updatePassword);

module.exports = router;
