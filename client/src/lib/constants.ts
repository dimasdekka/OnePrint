/**
 * Client-side constants
 */

// API Configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001");

export const SOCKET_URL = API_BASE_URL;

// Pricing
export const PRICE_PER_PAGE = 1500;

// Timeouts
export const IDLE_TIMEOUT_SECONDS = 60;
export const PRINTER_CHECK_INTERVAL = 30000; // 30 seconds
export const SESSION_EXPIRY_CHECK_INTERVAL = 1000; // 1 second

// Storage Keys
export const STORAGE_KEYS = {
  SESSION: "oneprint_session",
  FILE: "oneprint_file",
  SETTINGS: "oneprint_settings",
  AMOUNT: "oneprint_amount",
} as const;

// Routes
export const ROUTES = {
  HOME: "/",
  KIOSK: "/kiosk",
  UPLOAD: "/upload",
  PAYMENT: "/payment",
  ADMIN: "/admin",
  ADMIN_LOGIN: "/admin/login",
} as const;
