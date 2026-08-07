const asyncHandler = require("../middleware/asyncHandler");
const paymentService = require("../services/payment.service");
const sessionService = require("../services/session.service");
const printerService = require("../services/printer.service");
const {
  SESSION_STATUS,
  SOCKET_EVENTS,
  PRINTER_STATUS,
} = require("../utils/constants");
const logger = require("../utils/logger");

/**
 * Payment Controller
 * Handles payment-related HTTP requests
 */

/**
 * Generate Midtrans payment token
 * POST /api/payment/token
 */
const generateToken = asyncHandler(async (req, res) => {
  const { sessionId, printerId, colorMode, amount, copies, pageCount, pageRange } = req.body;
  const normalizedPageRange =
    typeof pageRange === "string" && pageRange.trim() !== ""
      ? pageRange.trim().toLowerCase() === "all"
        ? "all"
        : pageRange.replace(/\s+/g, "")
      : undefined;

  // Get session to retrieve filename and print details
  const session = await sessionService.getSessionById(sessionId);
  if (!session || !session.file) {
    return res.status(400).json({
      success: false,
      message: "Session not found or no file uploaded",
    });
  }

  if (
    session.status === SESSION_STATUS.EXPIRED ||
    session.status === SESSION_STATUS.FAILED ||
    session.status === SESSION_STATUS.PRINTING ||
    session.status === SESSION_STATUS.COMPLETED
  ) {
    return res.status(400).json({
      success: false,
      message: "Session is no longer available. Please scan a new QR code.",
    });
  }

  // Prepare print job data with printer settings
  const printJobData = {
    printerId: printerId || null,
    pageCount: pageCount || session.file?.totalPages || session.pageCount || 1,
    copies: copies || session.copies || 1,
    colorMode: colorMode || session.colorMode || "color",
    amount: amount || null,
  };

  const result = await paymentService.createMidtransToken(
    sessionId,
    session.file.filename,
    printJobData,
  );

  // Update session with the selected settings
  const updateData = {};
  if (colorMode) updateData.colorMode = colorMode;
  if (copies) updateData.copies = copies;
  if (normalizedPageRange) updateData.pageRange = normalizedPageRange;
  if (pageCount) updateData.pageCount = pageCount;
  
  if (Object.keys(updateData).length > 0) {
    await sessionService.updateSessionSettings(sessionId, updateData);
  }

  res.json({
    token: result.token,
    redirect_url: result.redirect_url,
    orderId: result.orderId,
  });
});

/**
 * Handle Midtrans payment notification webhook
 * POST /api/payment/notification
 */
const handleNotification = asyncHandler(async (req, res) => {
  const notification = req.body;
  const signature = req.headers["x-callback-signature"];

  // Verify signature if provided (Midtrans sometimes sends it in header)
  // Or verify manually inside service if needed

  const result = await paymentService.handleMidtransNotification(notification);

  if (result && result.paymentStatus === "paid") {
    const sessionId = result.sessionId;

    // Check if session is already printing or completed to avoid double printing
    const session = await sessionService.getSessionById(sessionId);
    if (
      session &&
      session.status !== SESSION_STATUS.PRINTING &&
      session.status !== SESSION_STATUS.COMPLETED
    ) {
      logger.info("Triggering print from notification", { sessionId });

      // We can't easily call completePayment logic here without refactoring it into a service
      // For now, we'll just log it. The client usually calls /complete anyway.
      // But ideally, we'd have a printerService.startPrintJob(sessionId)
    }
  }

  res.status(200).send("OK");
});

/**
 * Complete payment and start printing
 * POST /api/payment/complete
 */
const completePayment = asyncHandler(async (req, res) => {
  const { sessionId, orderId } = req.body;

  try {
    // Get session details for file path and prevent stale/double print jobs.
    const session = await sessionService.getSessionById(sessionId);
    if (!session || !session.file?.filepath) {
      throw new Error("Session or file path not found");
    }

    if (
      session.status === SESSION_STATUS.EXPIRED ||
      session.status === SESSION_STATUS.FAILED ||
      session.status === SESSION_STATUS.PRINTING ||
      session.status === SESSION_STATUS.COMPLETED
    ) {
      throw new Error("Session is no longer available for printing");
    }

    const result = await paymentService.processPayment(sessionId);

    if (orderId) {
      // Mark transaction as paid
      await paymentService.markTransactionAsPaid(orderId);
    }

    logger.info("Payment completed, starting print job", {
      sessionId,
      fileName: result.fileName,
    });

    // Get available printers
    const printers = await printerService.getManagedPrinters();
    const availablePrinters = printers.filter(
      (p) => p.status === PRINTER_STATUS.ONLINE && p.isConnected,
    );

    if (availablePrinters.length === 0) {
      throw new Error("No printers available");
    }

    // Use first available printer
    const printer = availablePrinters[0];

    const io = req.app.get("io");
    if (io) {
      // Notify only clients in this session room.
      io.to(sessionId).emit(SOCKET_EVENTS.PRINT_STARTED, { sessionId });

      // Notify admin dashboard
      io.emit(SOCKET_EVENTS.ADMIN_JOB_UPDATE, {
        id: sessionId,
        printerName: printer.name,
        fileName: result.fileName,
        pages: result.pageCount,
        status: "Printing",
      });
    }

    // Update session status
    await sessionService.updateSessionStatus(
      sessionId,
      SESSION_STATUS.PRINTING,
    );

    // Send to printer asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        const totalPages = (result.pageCount || 1) * (session.copies || 1);

        // Estimate print duration: ~4 seconds per page, min 8s, max 120s
        const estimatedMs = Math.min(Math.max(totalPages * 4000, 8000), 120000);
        const startTime = Date.now();

        // Emit progress every second until print job resolves
        let progressInterval = null;
        if (io) {
          progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            // Progress goes 0 → 95% during estimated time (never reach 100% until actually done)
            const rawPct = Math.min((elapsed / estimatedMs) * 95, 95);
            const pct = Math.round(rawPct);
            io.to(sessionId).emit(SOCKET_EVENTS.PRINT_PROGRESS, {
              sessionId,
              percent: pct,
              totalPages,
            });
          }, 1000);
        }

        await printerService.sendToPrinter(
          printer.id,
          session.file.filepath,
          session.copies || 1,
          session.colorMode || "color",
          session.pageRange || "all",
        );

        // Clear progress ticker
        if (progressInterval) clearInterval(progressInterval);

        logger.info("Print job completed successfully", { sessionId });

        // Emit 100% then complete
        if (io) {
          io.to(sessionId).emit(SOCKET_EVENTS.PRINT_PROGRESS, {
            sessionId,
            percent: 100,
            totalPages,
          });
        }

        await sessionService.updateSessionStatus(
          sessionId,
          SESSION_STATUS.COMPLETED,
        );

        if (io) {
          io.to(sessionId).emit(SOCKET_EVENTS.PRINT_COMPLETE, { sessionId });
        }
      } catch (printError) {
        logger.error("Print job failed", {
          sessionId,
          error: printError.message,
        });

        await sessionService.updateSessionStatus(
          sessionId,
          SESSION_STATUS.FAILED,
        );

        if (io) {
          io.to(sessionId).emit(SOCKET_EVENTS.ERROR, {
            sessionId,
            message: "Print failed: " + printError.message,
          });
        }
      }
    });

    res.json({
      success: true,
      message: "Payment processed, sending to printer...",
      printerId: printer.id,
      printerName: printer.name,
    });
  } catch (error) {
    logger.error("Payment completion failed", {
      sessionId,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: error.message || "Failed to process payment",
    });
  }
});

module.exports = {
  generateToken,
  handleNotification,
  completePayment,
};
