const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/session.controller");

/**
 * Session Routes
 */

// Verify session validity
router.get("/verify-session/:sessionId", sessionController.verifySession);

// Read current kiosk session state, including uploaded file if available
router.get("/sessions/:sessionId/state", sessionController.getSessionState);

// Reset/cancel a kiosk session
router.post("/sessions/:sessionId/reset", sessionController.resetSession);

module.exports = router;
