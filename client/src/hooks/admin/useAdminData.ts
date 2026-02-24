import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import type { Printer, Report, Summary } from "@/types/admin";

export const useAdminData = () => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Printers
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [osPrinters, setOsPrinters] = useState<any[]>([]);
  const [selectedOsPrinter, setSelectedOsPrinter] = useState("");
  const [loadingPrinters, setLoadingPrinters] = useState(false);

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

  const getApiUrl = useCallback(() => {
    const proto = window.location.protocol;
    const host = window.location.hostname;
    return `${proto}//${host}:3001`;
  }, []);

  const fetchPrinters = useCallback(async () => {
    try {
      const { data } = await axios.get(`${getApiUrl()}/api/admin/printers`);
      setPrinters(data);
    } catch (e) {
      console.error("Failed to fetch printers", e);
    }
  }, [getApiUrl]);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const params = new URLSearchParams();
      if (filterFrom) params.append("from", filterFrom);
      if (filterTo) params.append("to", filterTo);

      const [repRes, sumRes] = await Promise.all([
        axios.get(`${getApiUrl()}/api/admin/reports?${params}`),
        axios.get(`${getApiUrl()}/api/admin/reports/summary`),
      ]);

      setReports(repRes.data);
      setSummary(sumRes.data);
    } catch (e) {
      console.error("Failed to fetch reports", e);
    } finally {
      setLoadingReports(false);
    }
  }, [getApiUrl, filterFrom, filterTo]);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await axios.get(`${getApiUrl()}/api/admin/settings`);
      if (data) {
        setPriceBw(data.pricePerPageBw || 1500);
        setPriceColor(data.pricePerPageColor || 3000);
      }
    } catch (e) {
      console.error("Failed to fetch settings", e);
    }
  }, [getApiUrl]);

  const setupSocket = useCallback(() => {
    const socket = io(`${getApiUrl()}`);

    socket.on("admin_job_update", (job: any) => {
      setPrinters((prev) =>
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
        amount: job.pages * 1500, // naive fallback if no job amount
        status: "Success",
      };
      setReports((prev) => [newReport, ...prev]);
    });

    socket.on("printer_update", () => {
      fetchPrinters();
    });

    return () => socket.disconnect();
  }, [fetchPrinters, getApiUrl]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${getApiUrl()}/api/auth/me`);
        setIsAuthorized(true);
        fetchPrinters();
        fetchReports();
        fetchSettings();
      } catch (err) {
        router.push("/admin/login");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    const cleanup = setupSocket();
    const syncInterval = setInterval(fetchPrinters, 30000);

    return () => {
      clearInterval(syncInterval);
      cleanup();
    };
  }, [
    fetchPrinters,
    fetchReports,
    fetchSettings,
    getApiUrl,
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
    getApiUrl,
  };
};
