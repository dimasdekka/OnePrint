/**
 * Payment-related TypeScript types
 */

export interface PaymentData {
  sessionId: string;
  filename?: string; // Optional since it's retrieved from session on server
  printerId?: string | null;
  colorMode?: "bw" | "color";
  amount?: number;
}

export interface MidtransResponse {
  token: string;
  redirect_url: string;
  orderId?: string;
}

export interface PaymentCompleteRequest {
  sessionId: string;
  orderId?: string;
}

export interface PaymentCompleteResponse {
  success: boolean;
  message: string;
}

export interface Transaction {
  id: string;
  sessionId: string;
  printerId?: string | null;
  midtransToken?: string | null;
  orderId: string;
  paymentStatus: "pending" | "paid" | "failed" | "expired";
  amount: number;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
