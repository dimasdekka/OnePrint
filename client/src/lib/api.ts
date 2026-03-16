/**
 * Centralized API client using axios
 */

import axios from "axios";
import { API_BASE_URL } from "./constants";
import type {
  PaymentData,
  MidtransResponse,
  PaymentCompleteRequest,
} from "@/types/payment";
import type {
  Printer,
  PrinterAddRequest,
  DummyPrinterRequest,
} from "@/types/printer";

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed in the future
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

/**
 * Session API
 */
export const sessionAPI = {
  verify: (sessionId: string) =>
    api.get<{ valid: boolean; session?: any; reason?: string }>(
      `/api/verify-session/${sessionId}`,
    ),
};

/**
 * Payment API
 */
export const paymentAPI = {
  generateToken: (data: PaymentData) =>
    api.post<MidtransResponse>("/api/tx/token", data),

  complete: (data: PaymentCompleteRequest) =>
    api.post("/api/tx/complete", data),
};

/**
 * Printer API
 */
export const printerAPI = {
  getAll: () => api.get<Printer[]>("/api/admin/printers"),

  getSystem: () => api.get<Printer[]>("/api/system/printers"),

  add: (data: PrinterAddRequest) =>
    api.post<Printer>("/api/admin/printers", data),

  remove: (id: string) => api.delete(`/api/admin/printers/${id}`),

  toggleDummy: (data: DummyPrinterRequest) =>
    api.post("/api/admin/dummy-printer", data),
};

/**
 * Upload API
 */
export const uploadAPI = {
  uploadFile: (formData: FormData) =>
    api.post("/api/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

/**
 * Admin API
 */
export const adminAPI = {
  getReports: (limit?: number) =>
    api.get("/api/admin/reports", { params: { limit } }),
};
