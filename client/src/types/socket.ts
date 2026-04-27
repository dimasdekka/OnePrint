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
  print_started: (data: { sessionId: string }) => void;
  print_progress: (data: { sessionId: string; percent: number }) => void;
  print_complete: (data: { sessionId: string }) => void;
  printer_update: () => void;
  user_connected: (data: { message: string }) => void;
  admin_job_update: (data: {
    printerName: string;
    id: string;
    fileName: string;
    pages: number;
  }) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  register_kiosk: (kioskId: string, existingSessionId?: string | null) => void;
  join_session: (data: { sessionId: string }) => void;
}
