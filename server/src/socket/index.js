const { handleRegisterKiosk } = require("./kiosk.handler");
const { handleJoinSession } = require("./session.handler");
const logger = require("../utils/logger");

/**
 * Initialize Socket.IO event handlers
 * @param {Server} io - Socket.IO server instance
 */
const initializeSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    logger.info("Client connected", { socketId: socket.id });

    // Register event handlers
    handleRegisterKiosk(socket, io);
    handleJoinSession(socket, io);

    // Handle disconnection
    socket.on("disconnect", () => {
      logger.info("Client disconnected", { socketId: socket.id });
      // TODO: Cleanup logic if needed
    });
  });

  logger.info("Socket.IO handlers initialized");
};

module.exports = { initializeSocketHandlers };
