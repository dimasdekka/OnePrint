import { create } from "zustand";
import type { KioskState } from "@/types/kiosk";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KioskStoreState {
  sessionId: string | null;
  expiresAt: string | null;
  kioskState: KioskState;

  // Printer availability - printerLoading prevents flash of "offline" overlay
  printersAvailable: boolean;
  printerLoading: boolean;

  // Pricing
  priceBw: number;
  priceColor: number;

  // Uploaded file
  fileName: string | null;
  pageCount: number;
  filePath: string | null;

  // Print settings
  copies: number;
  colorMode: "bw" | "color";
  pageRange: string;
  estimatedPages: number;

  // UI state
  showResetModal: boolean;
  printProgress: number;
  loadingPayment: boolean;
}

interface KioskActions {
  setSessionId: (v: string | null) => void;
  setExpiresAt: (v: string | null) => void;
  setKioskState: (v: KioskState) => void;

  setPrintersAvailable: (v: boolean) => void;
  setPrinterLoading: (v: boolean) => void;

  setPriceBw: (v: number) => void;
  setPriceColor: (v: number) => void;

  setFileName: (v: string | null) => void;
  setPageCount: (v: number) => void;
  setFilePath: (v: string | null) => void;

  setCopies: (v: number) => void;
  setColorMode: (v: "bw" | "color") => void;
  setPageRange: (v: string) => void;
  setEstimatedPages: (v: number) => void;

  setShowResetModal: (v: boolean) => void;
  setPrintProgress: (v: number) => void;
  setLoadingPayment: (v: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useKioskStore = create<KioskStoreState & KioskActions>((set) => ({
  sessionId: null,
  expiresAt: null,
  kioskState: "waiting",

  // Start with printerLoading = true so overlay is NOT shown while fetching
  printersAvailable: true,
  printerLoading: true,

  priceBw: 1500,
  priceColor: 3000,

  fileName: null,
  pageCount: 1,
  filePath: null,

  copies: 1,
  colorMode: "color",
  pageRange: "all",
  estimatedPages: 1,

  showResetModal: false,
  printProgress: 0,
  loadingPayment: false,

  setSessionId: (v) => set({ sessionId: v }),
  setExpiresAt: (v) => set({ expiresAt: v }),
  setKioskState: (v) => set({ kioskState: v }),

  setPrintersAvailable: (v) => set({ printersAvailable: v }),
  setPrinterLoading: (v) => set({ printerLoading: v }),

  setPriceBw: (v) => set({ priceBw: v }),
  setPriceColor: (v) => set({ priceColor: v }),

  setFileName: (v) => set({ fileName: v }),
  setPageCount: (v) => set({ pageCount: v }),
  setFilePath: (v) => set({ filePath: v }),

  setCopies: (v) => set({ copies: v }),
  setColorMode: (v) => set({ colorMode: v }),
  setPageRange: (v) => set({ pageRange: v }),
  setEstimatedPages: (v) => set({ estimatedPages: v }),

  setShowResetModal: (v) => set({ showResetModal: v }),
  setPrintProgress: (v) => set({ printProgress: v }),
  setLoadingPayment: (v) => set({ loadingPayment: v }),
}));
