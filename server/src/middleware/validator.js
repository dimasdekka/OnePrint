/**
 * Request Validation Middleware
 * Validates request body, params, and query
 */

/**
 * Validate session ID format
 */
const validateSessionId = (req, res, next) => {
  const { sessionId } = req.params.sessionId ? req.params : req.body;

  if (!sessionId || typeof sessionId !== "string" || sessionId.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing session ID",
    });
  }

  next();
};

/**
 * Validate file upload request
 */
const validateFileUpload = (req, res, next) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: "Session ID is required",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  next();
};

/**
 * Validate payment token request
 */
const validatePaymentToken = (req, res, next) => {
  const { sessionId, amount, colorMode, copies, pageCount, pageRange } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: "Session ID is required",
    });
  }

  if (amount && (typeof amount !== "number" || amount <= 0)) {
    return res.status(400).json({
      success: false,
      message: "Invalid amount",
    });
  }

  if (colorMode && !["bw", "color"].includes(colorMode)) {
    return res.status(400).json({
      success: false,
      message: "Invalid color mode",
    });
  }

  if (
    copies !== undefined &&
    (!Number.isInteger(Number(copies)) || Number(copies) < 1)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid copies",
    });
  }

  if (
    pageCount !== undefined &&
    (!Number.isInteger(Number(pageCount)) || Number(pageCount) < 1)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid page count",
    });
  }

  if (
    pageRange &&
    pageRange.trim().toLowerCase() !== "all" &&
    !/^\s*\d+\s*(-\s*\d+\s*)?(,\s*\d+\s*(-\s*\d+\s*)?)*\s*$/.test(pageRange)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid page range",
    });
  }

  next();
};

/**
 * Validate printer data
 */
const validatePrinterData = (req, res, next) => {
  const { name, driver } = req.body;

  if (!name || !driver) {
    return res.status(400).json({
      success: false,
      message: "Printer name and driver are required",
    });
  }

  if (typeof name !== "string" || typeof driver !== "string") {
    return res.status(400).json({
      success: false,
      message: "Printer name and driver must be strings",
    });
  }

  next();
};

module.exports = {
  validateSessionId,
  validateFileUpload,
  validatePaymentToken,
  validatePrinterData,
};
