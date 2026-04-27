"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/apiClient";
import { getApiUrl } from "@/lib/getApiUrl";
import { createSocket } from "@/lib/socket";
import { useAdminStore } from "@/store/adminStore";
import type { Printer, Report } from "@/types/admin";

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

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchPrinters = useCallback(async () => {
    try {
      const { data } = await adminApi.get<Printer[]>(
        `${getApiUrl()}/api/admin/printers`,
      );
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
        adminApi.get(`${getApiUrl()}/api/admin/reports?${params}`),
        adminApi.get(`${getApiUrl()}/api/admin/reports/summary`),
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
      const { data } = await adminApi.get(`${getApiUrl()}/api/admin/settings`);
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

    socket.on("printer_update", () => {
      fetchPrinters();
    });

    return () => socket.disconnect();
  }, [fetchPrinters, setPrinters, setReports]);

  // ── Bootstrap on mount ─────────────────────────────────────────────────────

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await adminApi.get(`${getApiUrl()}/api/auth/me`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { fetchPrinters, fetchReports, fetchSettings };
};
