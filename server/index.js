require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const { initializeSocket } = require("./src/config/socket");
const { initializeSocketHandlers } = require("./src/socket");
const { disconnectDatabase } = require("./src/config/database");
const { initializeAdminUser } = require("./src/config/init");
const printerService = require("./src/services/printer.service");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 3001;

/**
 * Create HTTP server
 */
const server = http.createServer(app);

/**
 * Initialize Socket.IO
 */
const io = initializeSocket(server);
initializeSocketHandlers(io);

// Make io accessible to routes
app.set("io", io);

/**
 * Start printer status monitor
 */
const printerMonitor = printerService.startPrinterMonitor(30000, io); // Check every 30 seconds, emit socket on change
logger.info("Printer status monitor started");

/**
 * Start server
 */
server.listen(PORT, async () => {
  await initializeAdminUser();
  logger.info(`Server is running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

/**
 * Graceful shutdown
 */
const gracefulShutdown = async () => {
  logger.info("Shutting down gracefully...");

  // Stop printer monitor
  clearInterval(printerMonitor);
  logger.info("Printer status monitor stopped");

  server.close(async () => {
    logger.info("HTTP server closed");

    await disconnectDatabase();

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM signal");
  gracefulShutdown();
});
process.on("SIGINT", () => {
  logger.info("Received SIGINT signal");
  gracefulShutdown();
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception directly:", error);
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });
  gracefulShutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection directly:", reason);
  logger.error("Unhandled Rejection", { reason, promise });
  gracefulShutdown();
});
