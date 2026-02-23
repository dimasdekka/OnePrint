/**
 * Session-related TypeScript types
 */

export type KioskState =
  | "waiting"
  | "scanning"
  | "uploaded"
  | "configured"
  | "payment"
  | "printing"
  | "completed";

export type SessionStatus =
  | "waiting"
  | "scanning"
  | "uploaded"
  | "payment"
  | "printing"
  | "completed"
  | "failed";

export type ColorMode = "bw" | "color";

export interface File {
  id: string;
  filename: string;
  filepath: string;
  totalPages: number;
  uploadedAt: string;
}

export interface Session {
  id: string;
  userId?: string | null;
  kioskId?: string | null;
  socketId?: string | null;
  fileId?: string | null;
  copies: number;
  colorMode: ColorMode;
  pageRange?: string | null;
  pageCount: number;
  status: SessionStatus;
  expiresAt: string;
  used: boolean;
  createdAt: string;
  updatedAt: string;
  file?: File | null;
}

export interface FileData {
  fileName: string;
  pageCount: number;
  filePath: string;
}

export interface PrintSettings {
  copies: number;
  pageRange: string;
  colorMode: ColorMode;
  estimatedPages?: number;
}

export interface SessionStorage {
  sessionId: string | null;
  fileData: FileData | null;
  settings: PrintSettings | null;
  amount: number | null;
}
