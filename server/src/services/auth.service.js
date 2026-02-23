const bcrypt = require("bcrypt");
const { prisma } = require("../config/database");
const logger = require("../utils/logger");

/**
 * Auth Service
 * Handles authentication business logic
 */

/**
 * Verify user credentials
 * @param {string} username - Username
 * @param {string} password - Plain text password
 * @returns {Promise<Object|null>} User object if valid, null otherwise
 */
const verifyCredentials = async (username, password) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, password: true },
    });

    if (!user) {
      logger.warn("Login attempt with non-existent user", { username });
      return null;
    }

    // Compare password with hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logger.warn("Login attempt with invalid password", { username });
      return null;
    }

    logger.info("User credentials verified", { username });

    // Return user without password
    return {
      id: user.id,
      username: user.username,
    };
  } catch (error) {
    logger.error("Credential verification failed", { error: error.message });
    return null;
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
const getUserById = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, createdAt: true },
  });
};

/**
 * Create new user (admin only)
 * @param {string} username - Username
 * @param {string} password - Plain text password
 * @param {string} role - User role
 * @returns {Promise<Object>} Created user
 */
const createUser = async (username, password) => {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
      select: { id: true, username: true },
    });

    logger.info("User created", { username });
    return user;
  } catch (error) {
    if (error.code === "P2002") {
      // Unique constraint violation
      logger.warn("Username already exists", { username });
      throw new Error("Username already exists");
    }
    logger.error("User creation failed", { error: error.message });
    throw error;
  }
};

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} newPassword - New plain text password
 * @returns {Promise<Object>} Updated user
 */
const updatePassword = async (userId, newPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { id: true, username: true },
    });

    logger.info("User password updated", { userId });
    return user;
  } catch (error) {
    logger.error("Password update failed", { error: error.message });
    throw error;
  }
};

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const deleteUser = async (userId) => {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info("User deleted", { userId });
  } catch (error) {
    logger.error("User deletion failed", { error: error.message });
    throw error;
  }
};

/**
 * Get all users
 * @returns {Promise<Array>} List of users
 */
const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: { id: true, username: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
};

module.exports = {
  verifyCredentials,
  getUserById,
  createUser,
  updatePassword,
  deleteUser,
  getAllUsers,
};
