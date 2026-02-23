/**
 * Socket.IO event types for type-safe Socket communication
 */

export interface ServerToClientEvents {
  session_init: (data: { sessionId: string; expiresAt: string }) => void;
  "file-uploaded": (data: {
    fileName: string;
    pageCount: number;
    filePath: string;
  }) => void;
  print_started: () => void;
  print_complete: () => void;
  printer_update: () => void;
  user_connected: (data: { message: string }) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  register_kiosk: (kioskId: string) => void;
  join_session: (data: { sessionId: string }) => void;
}
