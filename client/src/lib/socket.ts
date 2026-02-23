/**
 * Socket.IO client setup with type safety
 */

import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./constants";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/types/socket";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Create a type-safe Socket.IO client instance
 */
export const createSocket = (): TypedSocket => {
  const socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  }) as TypedSocket;

  return socket;
};

/**
 * Socket event names for consistency
 */
export const SOCKET_EVENTS = {
  // Server to Client
  SESSION_INIT: "session_init",
  FILE_UPLOADED: "file-uploaded",
  PRINT_STARTED: "print_started",
  PRINT_COMPLETE: "print_complete",
  PRINTER_UPDATE: "printer_update",
  USER_CONNECTED: "user_connected",
  ERROR: "error",

  // Client to Server
  REGISTER_KIOSK: "register_kiosk",
  JOIN_SESSION: "join_session",
} as const;
