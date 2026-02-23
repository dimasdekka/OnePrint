const asyncHandler = require("../middleware/asyncHandler");
const sessionService = require("../services/session.service");
const pdfService = require("../services/pdf.service");
const { SOCKET_EVENTS } = require("../utils/constants");
const logger = require("../utils/logger");

/**
 * Upload Controller
 * Handles file upload requests
 */

/**
 * Handle file upload
 * POST /api/upload
 */
const uploadFile = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  // Get page count
  const pageCount = await pdfService.getPageCount(file);

  // Update session with file data
  await sessionService.markSessionUsed(sessionId, {
    filePath: file.path,
    fileName: file.filename,
    pageCount,
  });

  logger.info("File uploaded successfully", {
    sessionId,
    fileName: file.filename,
    pageCount,
  });

  // Notify kiosk via Socket.IO (io instance will be passed from app)
  const io = req.app.get("io");
  if (io) {
    io.to(sessionId).emit(SOCKET_EVENTS.FILE_UPLOADED, {
      fileName: file.filename,
      pageCount,
      filePath: `/uploads/${file.filename}`,
    });
  }

  res.json({
    success: true,
    filename: file.filename,
    pageCount,
  });
});

module.exports = {
  uploadFile,
};
