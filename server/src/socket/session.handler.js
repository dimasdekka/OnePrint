const sessionService = require("../services/session.service");
const { SOCKET_EVENTS, SESSION_STATUS } = require("../utils/constants");
const logger = require("../utils/logger");

/**
 * Session Socket.IO Event Handlers
 */

/**
 * Handle user joining session
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 */
const handleJoinSession = (socket, io) => {
  socket.on(SOCKET_EVENTS.JOIN_SESSION, async ({ sessionId }) => {
    try {
      const session = await sessionService.getSessionById(sessionId);

      if (!session) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "Invalid Session ID",
        });
        return;
      }

      // Join session room
      socket.join(sessionId);
      logger.info("User joined session", { sessionId, socketId: socket.id });

      // Notify all clients in the room
      io.to(sessionId).emit(SOCKET_EVENTS.USER_CONNECTED, {
        message: "User connected to kiosk",
      });

      // Update session status
      await sessionService.updateSessionStatus(
        sessionId,
        SESSION_STATUS.SCANNING,
      );
    } catch (error) {
      logger.error("Failed to join session", {
        error: error.message,
        sessionId,
      });
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: "Server Error",
      });
    }
  });
};

module.exports = {
  handleJoinSession,
};
