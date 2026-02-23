const logger = require("../utils/logger");

/**
 * Global Error Handler Middleware
 * Catches all errors and sends consistent error responses
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Multer file upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum size is 10MB.",
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // Prisma errors
  if (err.code && err.code.startsWith("P")) {
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Resource already exists",
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Database error occurred",
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = { errorHandler, notFoundHandler };
