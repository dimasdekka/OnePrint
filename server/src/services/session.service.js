const { prisma } = require("../config/database");
const {
  SESSION_EXPIRY_MS,
  SESSION_STATUS,
  DEFAULT_COPIES,
  DEFAULT_PAGE_RANGE,
} = require("../utils/constants");
const { isSessionExpired } = require("../utils/helpers");
const logger = require("../utils/logger");

/**
 * Session Service
 * Handles session-related business logic
 */

/**
 * Create a new kiosk session
 * @param {string} kioskId - Kiosk identifier
 * @param {string} socketId - Socket connection ID
 * @returns {Promise<Object>} Created session
 */
const createSession = async (kioskId, socketId) => {
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

  const session = await prisma.session.create({
    data: {
      kioskId,
      socketId,
      status: SESSION_STATUS.WAITING,
      expiresAt,
    },
  });

  logger.info("Session created", {
    sessionId: session.id,
    kioskId,
    expiresAt: expiresAt.toISOString(),
  });

  return session;
};

/**
 * Validate session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Validation result
 */
const validateSession = async (sessionId) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return {
      valid: false,
      reason: "Session not found",
    };
  }

  if (isSessionExpired(session.expiresAt)) {
    return {
      valid: false,
      reason: "QR code expired. Please scan new QR.",
    };
  }

  if (session.used) {
    return {
      valid: false,
      reason: "QR code already used. Please scan new QR.",
    };
  }

  return {
    valid: true,
    session,
  };
};

/**
 * Update session status
 * @param {string} sessionId - Session ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated session
 */
const updateSessionStatus = async (sessionId, status) => {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: { status },
  });

  logger.info("Session status updated", { sessionId, status });
  return session;
};

/**
 * Mark session as used with file data and print settings
 * @param {string} sessionId - Session ID
 * @param {Object} fileData - File information
 * @param {Object} printSettings - Print settings (colorMode, copies, pageRange)
 * @param {string} userId - User ID (optional)
 * @returns {Promise<Object>} Updated session
 */
const markSessionUsed = async (
  sessionId,
  fileData,
  printSettings = {},
  userId = null,
) => {
  const { filePath, fileName, pageCount } = fileData;
  const {
    colorMode = "color",
    copies = DEFAULT_COPIES,
    pageRange = DEFAULT_PAGE_RANGE,
  } = printSettings;

  // Create the File record first
  const fileRecord = await prisma.file.create({
    data: {
      filename: fileName,
      filepath: filePath,
      totalPages: pageCount,
    },
  });

  const session = await prisma.session.update({
    where: { id: sessionId },
    data: {
      fileId: fileRecord.id, // Link to the newly created File record
      pageCount,
      copies,
      pageRange,
      colorMode,
      userId,
      status: SESSION_STATUS.UPLOADED,
      used: true,
    },
  });

  logger.info("Session marked as used", {
    sessionId,
    fileId: fileRecord.id,
    fileName,
    pageCount,
    colorMode,
  });

  return session;
};

/**
 * Update print settings in session
 * @param {string} sessionId - Session ID
 * @param {Object} settings - Settings to update (colorMode, copies, pageRange)
 * @returns {Promise<Object>} Updated session
 */
const updateSessionSettings = async (sessionId, settings) => {
  const updateData = {};
  if (settings.colorMode !== undefined)
    updateData.colorMode = settings.colorMode;
  if (settings.copies !== undefined) updateData.copies = settings.copies;
  if (settings.pageRange !== undefined)
    updateData.pageRange = settings.pageRange;

  const session = await prisma.session.update({
    where: { id: sessionId },
    data: updateData,
  });

  logger.info("Session settings updated", { sessionId, ...updateData });
  return session;
};

/**
 * Get sessions by user ID
 * @param {string} userId - User ID
 * @param {number} limit - Max results
 * @returns {Promise<Array>} User's sessions
 */
const getSessionsByUser = async (userId, limit = 50) => {
  return await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { transactions: true },
  });
};

/**
 * Get session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} Session or null
 */
const getSessionById = async (sessionId) => {
  return await prisma.session.findUnique({
    where: { id: sessionId },
    include: { transactions: true, user: true, file: true },
  });
};

/**
 * Update session socket ID
 * @param {string} sessionId - Session ID
 * @param {string} socketId - New socket ID
 * @returns {Promise<Object>} Updated session
 */
const updateSessionSocket = async (sessionId, socketId) => {
  return await prisma.session.update({
    where: { id: sessionId },
    data: { socketId },
  });
};

module.exports = {
  createSession,
  validateSession,
  updateSessionStatus,
  markSessionUsed,
  updateSessionSettings,
  getSessionsByUser,
  getSessionById,
  updateSessionSocket,
};
