const asyncHandler = require("../middleware/asyncHandler");
const authService = require("../services/auth.service");
const logger = require("../utils/logger");

/**
 * Admin Auth Controller
 * Handles authentication requests
 */

/**
 * Login with username and password
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  // Verify credentials
  const user = await authService.verifyCredentials(username, password);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  // Set session/cookie
  req.session.userId = user.id;
  req.session.user = user;

  logger.info("User logged in", { username, userId: user.id });

  res.json({
    success: true,
    message: "Login successful",
    user: {
      id: user.id,
      username: user.username,
    },
  });
});

/**
 * Get current session
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const user = await authService.getUserById(req.session.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.json({
    success: true,
    user,
  });
});

/**
 * Logout
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const userId = req.session.userId;

  req.session.destroy((err) => {
    if (err) {
      logger.error("Session destruction failed", { error: err.message });
      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }

    logger.info("User logged out", { userId });

    res.json({
      success: true,
      message: "Logout successful",
    });
  });
});

/**
 * Create new admin user (admin only)
 * POST /api/auth/users
 */
const createAdminUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Check authorization
  const user = await authService.getUserById(req.session.userId);
  if (!user) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized",
    });
  }

  // Validate input
  if (!username || !password || username.length < 3 || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Username (min 3 chars) and password (min 6 chars) required",
    });
  }

  const newUser = await authService.createUser(username, password);

  res.json({
    success: true,
    message: "User created successfully",
    user: newUser,
  });
});

/**
 * Update user password
 * POST /api/auth/password
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  // Validate new password
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters",
    });
  }

  // Verify current password
  const user = await authService.getUserById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Get user with password for verification
  const userWithPassword =
    await require("../config/database").prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, username: true },
    });

  const bcrypt = require("bcrypt");
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    userWithPassword.password,
  );

  if (!isCurrentPasswordValid) {
    return res.status(401).json({
      success: false,
      message: "Current password is incorrect",
    });
  }

  // Update password
  await authService.updatePassword(userId, newPassword);

  res.json({
    success: true,
    message: "Password updated successfully",
  });
});

/**
 * List all users (admin only)
 * GET /api/auth/users
 */
const listUsers = asyncHandler(async (req, res) => {
  // Check authorization
  const user = await authService.getUserById(req.session.userId);
  if (!user) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const users = await authService.getAllUsers();

  res.json({
    success: true,
    users,
  });
});

module.exports = {
  login,
  logout,
  getCurrentUser,
  createAdminUser,
  updatePassword,
  listUsers,
};
