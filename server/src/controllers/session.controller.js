const asyncHandler = require("../middleware/asyncHandler");
const sessionService = require("../services/session.service");

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

/**
 * Get current kiosk session state.
 * GET /api/sessions/:sessionId/state
 */
const getSessionState = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await sessionService.getSessionById(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session not found",
    });
  }

  res.json({
    success: true,
    session: {
      id: session.id,
      status: session.status,
      expiresAt: session.expiresAt,
      expired: new Date(session.expiresAt) <= new Date(),
      used: session.used,
      copies: session.copies,
      colorMode: session.colorMode,
      pageRange: session.pageRange,
      pageCount: session.pageCount,
      file: session.file
        ? {
            fileName: session.file.filename,
            pageCount: session.file.totalPages,
            filePath: `/uploads/${session.file.filename}`,
          }
        : null,
    },
  });
});

/**
 * Reset/cancel session from kiosk.
 * POST /api/sessions/:sessionId/reset
 */
const resetSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const reset = await sessionService.resetSession(sessionId);

  res.json({
    success: true,
    reset,
  });
});

module.exports = {
  verifySession,
  getSessionState,
  resetSession,
};
