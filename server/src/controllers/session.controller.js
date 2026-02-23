const asyncHandler = require("../middleware/asyncHandler");
const sessionService = require("../services/session.service");
const logger = require("../utils/logger");

/**
 * Session Controller
 * Handles session-related HTTP requests
 */

/**
 * Verify session validity
 * GET /api/verify-session/:sessionId
 */
const verifySession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const result = await sessionService.validateSession(sessionId);

  if (!result.valid) {
    return res.json({
      valid: false,
      reason: result.reason,
    });
  }

  // Return session with file information
  const session = result.session;
  const response = {
    valid: true,
    session: {
      id: session.id,
      status: session.status,
      expiresAt: session.expiresAt,
      used: session.used,
      fileId: session.fileId,
      copies: session.copies,
      colorMode: session.colorMode,
      pageRange: session.pageRange,
      pageCount: session.pageCount,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
  };

  res.json(response);
});

module.exports = {
  verifySession,
};
