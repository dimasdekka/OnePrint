const sessionService = require("../services/session.service");
const { SOCKET_EVENTS, SESSION_STATUS } = require("../utils/constants");
const logger = require("../utils/logger");

/**
 * Kiosk Socket.IO Event Handlers
 */

/**
 * Handle kiosk registration
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 */
const handleRegisterKiosk = (socket, io) => {
  socket.on(
    SOCKET_EVENTS.REGISTER_KIOSK,
    async (kioskId, existingSessionId) => {
      try {
        logger.info("Kiosk registration attempt", {
          kioskId,
          existingSessionId,
          socketId: socket.id,
        });

        let session = null;

        // Try to reuse existing session if provided
        if (existingSessionId) {
          const existingSession =
            await sessionService.getSessionById(existingSessionId);
          // Check if session exists and is not expired
          if (
            existingSession &&
            new Date(existingSession.expiresAt) > new Date()
          ) {
            logger.info("Resuming existing session for kiosk", {
              sessionId: existingSessionId,
              kioskId,
            });
            session = await sessionService.updateSessionSocket(
              existingSessionId,
              socket.id,
            );
          } else {
            logger.info(
              "Existing session expired or invalid, creating new one",
              { kioskId },
            );
          }
        }

        // Create new session if none reused
        if (!session) {
          session = await sessionService.createSession(kioskId, socket.id);
        }

        // Send session info back to kiosk
        socket.emit(SOCKET_EVENTS.SESSION_INIT, {
          sessionId: session.id,
          expiresAt: session.expiresAt.toISOString(),
        });

        // Join room for this session
        socket.join(session.id);

        logger.info("Session initialized for kiosk", {
          sessionId: session.id,
          kioskId,
          resumed: !!existingSessionId && session.id === existingSessionId,
        });
      } catch (error) {
        logger.error("Failed to register kiosk", {
          error: error.message,
          kioskId,
        });
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "Failed to handle session",
        });
      }
    },
  );
};

module.exports = {
  handleRegisterKiosk,
};
