const asyncHandler = require("../middleware/asyncHandler");
const printerService = require("../services/printer.service");
const { SOCKET_EVENTS } = require("../utils/constants");
const logger = require("../utils/logger");

/**
 * Admin Controller
 * Handles admin-related HTTP requests
 */

/**
 * Get system printers from OS
 * GET /api/system/printers
 */
const getSystemPrinters = asyncHandler(async (req, res) => {
  const printers = await printerService.getSystemPrinters();
  res.json(printers);
});

/**
 * Get managed printers from database
 * GET /api/admin/printers
 */
const getManagedPrinters = asyncHandler(async (req, res) => {
  const printers = await printerService.getManagedPrinters();
  res.json(printers);
});

/**
 * Add printer to management
 * POST /api/admin/printers
 */
const addPrinter = asyncHandler(async (req, res) => {
  const { name, driver, description } = req.body;

  const printer = await printerService.addPrinter(name, driver, description);

  // Notify clients about printer change
  const io = req.app.get("io");
  if (io) {
    io.emit(SOCKET_EVENTS.PRINTER_UPDATE);
  }

  res.json(printer);
});

/**
 * Remove printer from management
 * DELETE /api/admin/printers/:id
 */
const removePrinter = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await printerService.removePrinter(id);

  // Notify clients about printer change
  const io = req.app.get("io");
  if (io) {
    io.emit(SOCKET_EVENTS.PRINTER_UPDATE);
  }

  res.json({ success: true });
});

/**
 * Toggle dummy printer for testing
 * POST /api/admin/dummy-printer
 */
const toggleDummyPrinter = asyncHandler(async (req, res) => {
  const { action } = req.body;

  if (!["add", "remove"].includes(action)) {
    return res.status(400).json({
      success: false,
      message: "Invalid action. Use 'add' or 'remove'",
    });
  }

  await printerService.toggleDummyPrinter(action);

  // Notify clients about printer change
  const io = req.app.get("io");
  if (io) {
    io.emit(SOCKET_EVENTS.PRINTER_UPDATE);
  }

  res.json({ success: true });
});

/**
 * Test print on specific printer
 * POST /api/admin/printers/:id/test-print
 */
const testPrint = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const path = require("path");
    const fs = require("fs");

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create a test document path
    const testDocPath = path.join(uploadsDir, "test-print.txt");

    // Create test document if it doesn't exist
    if (!fs.existsSync(testDocPath)) {
      fs.writeFileSync(
        testDocPath,
        "OnePrint Test Print\n" +
          "==================\n\n" +
          "This is a test print from OnePrint Admin Panel.\n" +
          "If you see this, your printer is working correctly!\n\n" +
          "Generated: " +
          new Date().toLocaleString() +
          "\n\n" +
          "---End of Test---",
      );
      logger.info("Test document created", { testDocPath });
    }

    // Send to printer
    await printerService.sendToPrinter(id, testDocPath, 1);

    logger.info("Test print sent successfully", { printerId: id });
    res.json({ success: true, message: "Test print sent to printer" });
  } catch (error) {
    logger.error("Test print failed", { printerId: id, error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send test print",
    });
  }
});

/**
 * Sync single printer status with OS
 * POST /api/admin/printers/:id/sync-status
 */
const syncPrinterStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await printerService.syncPrinterStatus(id);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Printer not found or offline",
      });
    }

    // Notify clients about status change
    const io = req.app.get("io");
    if (io) {
      io.emit(SOCKET_EVENTS.PRINTER_UPDATE);
    }

    logger.info("Printer status synced", {
      printerId: id,
      status: updated.status,
    });
    res.json(updated);
  } catch (error) {
    logger.error("Sync printer status failed", {
      printerId: id,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to sync printer status",
    });
  }
});

/**
 * Get revenue reports
 * GET /api/admin/reports
 */
const getReports = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to + "T23:59:59") : null;
  const reports = await printerService.getReports(limit, from, to);
  res.json(reports);
});

/**
 * Get revenue summary (stats + daily chart data)
 * GET /api/admin/reports/summary
 */
const getReportsSummary = asyncHandler(async (req, res) => {
  const summary = await printerService.getReportsSummary();
  res.json(summary);
});

/**
 * Delete a report (session + its transactions)
 * DELETE /api/admin/reports/:id
 */
const deleteReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await printerService.deleteReport(id);
  res.json({ success: true });
});

/**
 * Get generic printer settings (usually the first managed printer)
 * GET /api/admin/settings
 */
const getSettings = asyncHandler(async (req, res) => {
  const { prisma } = require("../config/database");

  // Get the first settings found
  let settings = await prisma.printerSettings.findFirst({
    include: { printer: true },
  });

  if (!settings) {
    // Return default mock if none exists
    return res.json({
      pricePerPageBw: 1500,
      pricePerPageColor: 3000,
    });
  }

  res.json({
    pricePerPageBw: Number(settings.pricePerPageBw),
    pricePerPageColor: Number(settings.pricePerPageColor),
  });
});

/**
 * Update printer settings
 * POST /api/admin/settings
 */
const updateSettings = asyncHandler(async (req, res) => {
  const { pricePerPageBw, pricePerPageColor } = req.body;
  const { prisma } = require("../config/database");

  let settings = await prisma.printerSettings.findFirst();

  if (!settings) {
    return res.status(404).json({
      success: false,
      message: "No printer settings found. Please add a printer first.",
    });
  }

  // Update existing
  settings = await prisma.printerSettings.update({
    where: { id: settings.id },
    data: {
      pricePerPageBw: Number(pricePerPageBw) || undefined,
      pricePerPageColor: Number(pricePerPageColor) || undefined,
    },
  });

  res.json({
    success: true,
    pricePerPageBw: Number(settings.pricePerPageBw),
    pricePerPageColor: Number(settings.pricePerPageColor),
  });
});

module.exports = {
  getSystemPrinters,
  getManagedPrinters,
  addPrinter,
  removePrinter,
  toggleDummyPrinter,
  testPrint,
  syncPrinterStatus,
  getReports,
  getReportsSummary,
  deleteReport,
  getSettings,
  updateSettings,
};
