"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
<<<<<<< HEAD
import { adminApi } from "@/lib/apiClient";
import { getApiUrl } from "@/lib/getApiUrl";
import { createSocket } from "@/lib/socket";
import { useAdminStore } from "@/store/adminStore";
import type { Printer, Report } from "@/types/admin";
=======
import { io } from "socket.io-client";
import { SOCKET_URL } from "@/lib/constants";
import type { Printer, Report, Summary } from "@/types/admin";
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce

/**
 * useAdminActions
 *
 * Handles all side-effects and async operations for the Admin dashboard.
 * Call ONCE in the page-level component. State lives in `useAdminStore`.
 */
export const useAdminActions = () => {
  const router = useRouter();

  const {
    filterFrom,
    filterTo,
    setIsAuthorized,
    setAuthLoading,
    setPrinters,
    setReports,
    setSummary,
    setLoadingReports,
    setPriceBw,
    setPriceColor,
  } = useAdminStore();

<<<<<<< HEAD
  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchPrinters = useCallback(async () => {
    try {
      const { data } = await adminApi.get<Printer[]>(
        `${getApiUrl()}/api/admin/printers`,
      );
=======
  // Reports
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Settings
  const [priceBw, setPriceBw] = useState(1500);
  const [priceColor, setPriceColor] = useState(3000);
  const [loadingSettings, setLoadingSettings] = useState(false);

  const fetchPrinters = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/admin/printers");
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce
      setPrinters(data);
    } catch (e) {
      console.error("Failed to fetch printers:", e);
    }
  }, [setPrinters]);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const params = new URLSearchParams();
      if (filterFrom) params.append("from", filterFrom);
      if (filterTo) params.append("to", filterTo);

      const [repRes, sumRes] = await Promise.all([
<<<<<<< HEAD
        adminApi.get(`${getApiUrl()}/api/admin/reports?${params}`),
        adminApi.get(`${getApiUrl()}/api/admin/reports/summary`),
=======
        axios.get(`/api/admin/reports?${params}`),
        axios.get("/api/admin/reports/summary"),
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce
      ]);

      setReports(repRes.data);
      setSummary(sumRes.data);
    } catch (e) {
      console.error("Failed to fetch reports:", e);
    } finally {
      setLoadingReports(false);
    }
  }, [filterFrom, filterTo, setLoadingReports, setReports, setSummary]);

  const fetchSettings = useCallback(async () => {
    try {
<<<<<<< HEAD
      const { data } = await adminApi.get(`${getApiUrl()}/api/admin/settings`);
=======
      const { data } = await axios.get("/api/admin/settings");
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce
      if (data) {
        setPriceBw(data.pricePerPageBw ?? 1500);
        setPriceColor(data.pricePerPageColor ?? 3000);
      }
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  }, [setPriceBw, setPriceColor]);

  // ── Socket setup ───────────────────────────────────────────────────────────

  const setupSocket = useCallback(() => {
<<<<<<< HEAD
    const socket = createSocket();

    socket.on(
      "admin_job_update",
      (job: {
        printerName: string;
        id: string;
        fileName: string;
        pages: number;
      }) => {
        setPrinters((prev: Printer[]) =>
          prev.map((p) =>
            p.name === job.printerName ? { ...p, jobs: p.jobs + 1 } : p,
          ),
        );

        const newReport: Report = {
          id: job.id,
          date:
            new Date().toLocaleDateString("id-ID") +
            " " +
            new Date().toLocaleTimeString("id-ID"),
          filename: job.fileName,
          pages: job.pages,
          copies: 1,
          amount: job.pages * 1500,
          status: "Success",
        };

        setReports((prev: Report[]) => [newReport, ...prev]);
      },
    );
=======
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce


    socket.on("printer_update", () => {
      fetchPrinters();
    });

    return () => socket.disconnect();
  }, [fetchPrinters, setPrinters, setReports]);

  // ── Bootstrap on mount ─────────────────────────────────────────────────────

  useEffect(() => {
    const checkAuth = async () => {
      try {
<<<<<<< HEAD
        await adminApi.get(`${getApiUrl()}/api/auth/me`);
=======
        await axios.get("/api/auth/me");
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce
        setIsAuthorized(true);
        fetchPrinters();
        fetchReports();
        fetchSettings();
      } catch {
        router.push("/admin/login");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    const cleanupSocket = setupSocket();
    const syncInterval = setInterval(fetchPrinters, 30_000);

    return () => {
      clearInterval(syncInterval);
      cleanupSocket();
    };
<<<<<<< HEAD
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { fetchPrinters, fetchReports, fetchSettings };
=======
  }, [
    fetchPrinters,
    fetchReports,
    fetchSettings,
    fetchSettings,
    router,
    setupSocket,
  ]);

  return {
    isAuthorized,
    authLoading,
    printers,
    setPrinters,
    osPrinters,
    setOsPrinters,
    selectedOsPrinter,
    setSelectedOsPrinter,
    loadingPrinters,
    setLoadingPrinters,
    reports,
    setReports,
    summary,
    loadingReports,
    filterFrom,
    setFilterFrom,
    filterTo,
    setFilterTo,
    priceBw,
    setPriceBw,
    priceColor,
    setPriceColor,
    loadingSettings,
    setLoadingSettings,
    fetchPrinters,
    fetchReports,
    fetchSettings,
  };
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce
};
