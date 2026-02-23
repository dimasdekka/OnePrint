/**
 * Printer-related TypeScript types
 */

export type PrinterStatus = "Online" | "Offline";

export interface PrinterSettings {
  id: string;
  printerId: string;
  pricePerPageBw: number;
  pricePerPageColor: number;
  updatedAt: string;
}

export interface Printer {
  id: string;
  name: string;
  printerId?: string | null;
  driver?: string | null;
  description?: string | null;
  status: PrinterStatus;
  isConnected: boolean;
  lastSync?: string | null;
  createdAt: string;
  updatedAt: string;
  settings?: PrinterSettings;
}

export interface PrinterAddRequest {
  name: string;
  driver?: string;
}

export interface DummyPrinterRequest {
  action: "add" | "remove";
}
