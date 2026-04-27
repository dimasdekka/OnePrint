import { create } from "zustand";
import type { Printer, Report, Summary } from "@/types/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminState {
  // Auth
  isAuthorized: boolean;
  authLoading: boolean;

  // Printer list
  printers: Printer[];
  // OS-level printers (from server scan)
  osPrinters: OsPrinter[];
  selectedOsPrinter: string;
  loadingPrinters: boolean;
  showAddPrinter: boolean;

  // Reports
  reports: Report[];
  summary: Summary | null;
  loadingReports: boolean;
  filterFrom: string;
  filterTo: string;

  // Settings
  priceBw: number;
  priceColor: number;
  loadingSettings: boolean;
}

interface AdminActions {
  setIsAuthorized: (v: boolean) => void;
  setAuthLoading: (v: boolean) => void;

  setPrinters: (v: Printer[] | ((prev: Printer[]) => Printer[])) => void;
  setOsPrinters: (v: OsPrinter[]) => void;
  setSelectedOsPrinter: (v: string) => void;
  setLoadingPrinters: (v: boolean) => void;
  setShowAddPrinter: (v: boolean) => void;

  setReports: (v: Report[] | ((prev: Report[]) => Report[])) => void;
  setSummary: (v: Summary | null) => void;
  setLoadingReports: (v: boolean) => void;
  setFilterFrom: (v: string) => void;
  setFilterTo: (v: string) => void;

  setPriceBw: (v: number) => void;
  setPriceColor: (v: number) => void;
  setLoadingSettings: (v: boolean) => void;
}

// ─── Supporting types ─────────────────────────────────────────────────────────

export interface OsPrinter {
  Name: string;
  DriverName: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAdminStore = create<AdminState & AdminActions>((set) => ({
  // Auth defaults
  isAuthorized: false,
  authLoading: true,

  // Printer defaults
  printers: [],
  osPrinters: [],
  selectedOsPrinter: "",
  loadingPrinters: false,
  showAddPrinter: false,

  // Report defaults
  reports: [],
  summary: null,
  loadingReports: false,
  filterFrom: "",
  filterTo: "",

  // Settings defaults
  priceBw: 1500,
  priceColor: 3000,
  loadingSettings: false,

  // Auth actions
  setIsAuthorized: (v) => set({ isAuthorized: v }),
  setAuthLoading: (v) => set({ authLoading: v }),

  // Printer actions
  setPrinters: (v) =>
    set((state) => ({
      printers: typeof v === "function" ? v(state.printers) : v,
    })),
  setOsPrinters: (v) => set({ osPrinters: v }),
  setSelectedOsPrinter: (v) => set({ selectedOsPrinter: v }),
  setLoadingPrinters: (v) => set({ loadingPrinters: v }),
  setShowAddPrinter: (v) => set({ showAddPrinter: v }),

  // Report actions
  setReports: (v) =>
    set((state) => ({
      reports: typeof v === "function" ? v(state.reports) : v,
    })),
  setSummary: (v) => set({ summary: v }),
  setLoadingReports: (v) => set({ loadingReports: v }),
  setFilterFrom: (v) => set({ filterFrom: v }),
  setFilterTo: (v) => set({ filterTo: v }),

  // Settings actions
  setPriceBw: (v) => set({ priceBw: v }),
  setPriceColor: (v) => set({ priceColor: v }),
  setLoadingSettings: (v) => set({ loadingSettings: v }),
}));
