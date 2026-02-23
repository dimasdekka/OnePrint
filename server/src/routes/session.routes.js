const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/session.controller");

/**
 * Session Routes
 */

// Verify session validity
router.get("/verify-session/:sessionId", sessionController.verifySession);

module.exports = router;
