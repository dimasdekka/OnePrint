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
<<<<<<< HEAD
  print_started: (data: { sessionId: string }) => void;
  print_complete: (data: { sessionId: string }) => void;
=======
  print_started: () => void;
  print_progress: (data: { sessionId: string; percent: number }) => void;
  print_complete: () => void;
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce
  printer_update: () => void;
  user_connected: (data: { message: string }) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  register_kiosk: (kioskId: string, existingSessionId?: string | null) => void;
  join_session: (data: { sessionId: string }) => void;
}
