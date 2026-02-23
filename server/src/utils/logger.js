/**
 * Logging Utility
 * Structured logging with different levels
 */

const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};

/**
 * Format log message with timestamp and level
 */
const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : "";
  return `[${timestamp}] [${level}] ${message} ${metaStr}`;
};

/**
 * Log error message
 */
const error = (message, meta = {}) => {
  console.error(formatLog(LOG_LEVELS.ERROR, message, meta));
};

/**
 * Log warning message
 */
const warn = (message, meta = {}) => {
  console.warn(formatLog(LOG_LEVELS.WARN, message, meta));
};

/**
 * Log info message
 */
const info = (message, meta = {}) => {
  console.log(formatLog(LOG_LEVELS.INFO, message, meta));
};

/**
 * Log debug message (only in development)
 */
const debug = (message, meta = {}) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(formatLog(LOG_LEVELS.DEBUG, message, meta));
  }
};

module.exports = {
  error,
  warn,
  info,
  debug,
};
