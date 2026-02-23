/**
 * Application Constants
 * Centralized configuration values
 */

// Session Configuration
const SESSION_EXPIRY_MINUTES = 10;
const SESSION_EXPIRY_MS = SESSION_EXPIRY_MINUTES * 60 * 1000;

// Pricing Configuration
const PRICE_PER_PAGE = 1500; // IDR per page
const TAX_RATE_QRIS = 0.007; // 0.7% for QRIS payments

// Print Configuration
const DEFAULT_COPIES = 1;
const DEFAULT_PAGE_RANGE = "all";

// Session Status
const SESSION_STATUS = {
  WAITING: "waiting",
  SCANNING: "scanning",
  UPLOADED: "uploaded",
  PRINTING: "printing",
  COMPLETED: "completed",
  EXPIRED: "expired",
  FAILED: "failed",
};

// Transaction Status
const TRANSACTION_STATUS = {
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
  EXPIRED: "expired",
};

// Printer Status
const PRINTER_STATUS = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  BUSY: "Busy",
  ERROR: "Error",
};

// Socket Events
const SOCKET_EVENTS = {
  // Client to Server
  REGISTER_KIOSK: "register_kiosk",
  JOIN_SESSION: "join_session",

  // Server to Client
  SESSION_INIT: "session_init",
  USER_CONNECTED: "user_connected",
  FILE_UPLOADED: "file-uploaded",
  PRINT_STARTED: "print_started",
  PRINT_PROGRESS: "print_progress",
  PRINT_COMPLETE: "print_complete",
  ADMIN_JOB_UPDATE: "admin_job_update",
  PRINTER_UPDATE: "printer_update",
  ERROR: "error",
};

// File Upload Configuration
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Dummy Printer Configuration
const DUMMY_PRINTER = {
  NAME: "Dummy Printer",
  DRIVER: "Virtual Driver",
};

module.exports = {
  SESSION_EXPIRY_MINUTES,
  SESSION_EXPIRY_MS,
  PRICE_PER_PAGE,
  TAX_RATE_QRIS,
  DEFAULT_COPIES,
  DEFAULT_PAGE_RANGE,
  SESSION_STATUS,
  TRANSACTION_STATUS,
  PRINTER_STATUS,
  SOCKET_EVENTS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  DUMMY_PRINTER,
};
