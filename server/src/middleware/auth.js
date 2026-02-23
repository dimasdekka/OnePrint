const logger = require("../utils/logger");

/**
 * Middleware untuk check apakah user sudah login
 */
const authRequired = (req, res, next) => {
  return next(); // BYPASSED FOR LOCAL KIOSK
};

/**
 * Middleware untuk check apakah user adalah admin
 */
const adminRequired = (req, res, next) => {
  return next(); // BYPASSED FOR LOCAL KIOSK
};

module.exports = {
  authRequired,
  adminRequired,
};
