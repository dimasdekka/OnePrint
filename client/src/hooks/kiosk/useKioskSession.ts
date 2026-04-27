<<<<<<< HEAD
"use client";
=======
import { useState, useEffect, useRef } from "react";
import { createSocket } from "@/lib/socket";
import axios from "axios";
import type { KioskState } from "@/types/kiosk";
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce

import { useEffect, useCallback } from "react";
import { kioskApi } from "@/lib/apiClient";
import { getApiUrl } from "@/lib/getApiUrl";
import { createSocket } from "@/lib/socket";
import { useKioskStore } from "@/store/kioskStore";



/**
 * useKioskSession
 *
 * Manages all kiosk socket connections and side-effects.
 * State lives in `useKioskStore` (Zustand). Components subscribe individually.
 *
 * Bug fixed: printerLoading prevents the "Service Offline" overlay from
 * flashing before the first API response arrives.
 */
export const useKioskSession = () => {
<<<<<<< HEAD
  const {
    sessionId,
    pageCount,
    pageRange,
    copies,
    colorMode,
    estimatedPages,
    priceBw,
    priceColor,
    setSessionId,
    setExpiresAt,
    setKioskState,
    setPrintersAvailable,
    setPrinterLoading,
    setPriceBw,
    setPriceColor,
    setFileName,
    setPageCount,
    setFilePath,
    setCopies,
    setColorMode,
    setPageRange,
    setEstimatedPages,
    setShowResetModal,
    setPrintProgress,
    setLoadingPayment,
  } = useKioskStore();
=======
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [state, setState] = useState<KioskState>("waiting");
  const kioskIdRef = useRef<string>("kiosk_" + Math.floor(Math.random() * 1000));
  const [printersAvailable, setPrintersAvailable] = useState(true);
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce

  // ── Printer availability check ─────────────────────────────────────────────

  const checkPrinters = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const { data } = await kioskApi.get(`${apiUrl}/api/admin/printers`);
      // Relax printer availability check to prevent random "Service Offline" issues
      // caused by flaky OS WMI queries. As long as a printer is registered, allow kiosk usage.
      const available = data.length > 0;
      setPrintersAvailable(available);

      try {
        const settingsRes = await kioskApi.get(`${apiUrl}/api/admin/settings`);
        if (settingsRes.data) {
          setPriceBw(settingsRes.data.pricePerPageBw ?? 1500);
          setPriceColor(settingsRes.data.pricePerPageColor ?? 3000);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    } catch (err) {
      console.error("Failed to check printers:", err);
      setPrintersAvailable(false);
    } finally {
      // Always clear loading so the overlay renders correctly after first check
      setPrinterLoading(false);
    }
  }, [setPrinterLoading, setPriceBw, setPriceColor, setPrintersAvailable]);

  // ── Boot: printer check ────────────────────────────────────────────────────

  useEffect(() => {
<<<<<<< HEAD
=======
    const checkPrinters = async () => {
      try {
        const { data } = await axios.get("/api/admin/printers");
        const available =
          data.length > 0 && data.some((p: any) => p.status === "Online");
        setPrintersAvailable(available);

        try {
          const settingsObj = await axios.get("/api/admin/settings");
          if (settingsObj.data) {
            setPriceBw(settingsObj.data.pricePerPageBw || 1500);
            setPriceColor(settingsObj.data.pricePerPageColor || 3000);
          }
        } catch (settingsError) {
          console.error("Failed to fetch settings", settingsError);
        }
      } catch (e) {
        console.error("Failed to check printers", e);
        setPrintersAvailable(false);
      }
    };

>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce
    checkPrinters();
    const interval = setInterval(checkPrinters, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Boot: socket + restore saved session ───────────────────────────────────

  useEffect(() => {
    const existingSessionId = localStorage.getItem("oneprint_session");
    const savedFile = localStorage.getItem("oneprint_file");

    // Restore file state from localStorage
    if (savedFile) {
      try {
        const fileData = JSON.parse(savedFile);
        const savedSettings = localStorage.getItem("oneprint_settings");

        setFileName(fileData.fileName);
        setPageCount(fileData.pageCount);
        setFilePath(fileData.filePath.replace(/\\/g, "/"));

        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setCopies(settings.copies ?? 1);
          setPageRange(settings.pageRange ?? "all");
          setEstimatedPages(settings.estimatedPages ?? fileData.pageCount);
          setColorMode(settings.colorMode ?? "color");
        } else {
          setEstimatedPages(fileData.pageCount);
        }

        setKioskState("uploaded");
      } catch {
        console.error("Failed to restore file state");
        localStorage.removeItem("oneprint_file");
      }
    }

<<<<<<< HEAD
    // Handle URL params (payment redirect)
=======
    const newSocket = createSocket();
    
    newSocket.on("connect", () => {
      newSocket.emit(
        "register_kiosk",
        kioskIdRef.current,
        savedFile ? existingSessionId : null,
      );
    });

    newSocket.on(
      "session_init",
      (data: { sessionId: string; expiresAt: string }) => {
        const currentFile = localStorage.getItem("oneprint_file");
        if (!currentFile) {
          setSessionId(data.sessionId);
          setExpiresAt(data.expiresAt);
          setState("waiting");
        }
        localStorage.setItem("oneprint_session", data.sessionId);
        setSessionId(data.sessionId);
        setExpiresAt(data.expiresAt);
      },
    );

    newSocket.on(
      "file-uploaded",
      (data: { fileName: string; pageCount: number; filePath: string }) => {
        setFileName(data.fileName);
        setPageCount(data.pageCount);
        setEstimatedPages(data.pageCount);
        const normalizedPath = data.filePath.replace(/\\/g, "/");
        setFilePath(normalizedPath);
        setState("uploaded");

        const fileData = { ...data, filePath: normalizedPath };
        localStorage.setItem("oneprint_file", JSON.stringify(fileData));
        const activeSession = localStorage.getItem("oneprint_session");
        if (activeSession) localStorage.setItem("oneprint_session", activeSession);
      },
    );

    newSocket.on("print_started", () => {
      setState("printing");
      setPrintProgress(0);
      localStorage.removeItem("oneprint_file");
      localStorage.removeItem("oneprint_settings");
    });

    newSocket.on(
      "print_progress",
      (data: { sessionId: string; percent: number }) => {
        setPrintProgress(data.percent);
      },
    );

    newSocket.on("print_complete", () => {
      setState("waiting");
      localStorage.removeItem("oneprint_session");
      localStorage.removeItem("oneprint_amount");
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    });

>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get("status");

    if (statusParam === "printing") {
      setKioskState("printing");
      localStorage.removeItem("oneprint_file");
      window.history.replaceState({}, document.title, "/");
    } else if (statusParam === "configure") {
      const savedFileState = localStorage.getItem("oneprint_file");
      if (savedFileState) {
        const fileData = JSON.parse(savedFileState);
        setFileName(fileData.fileName);
        setPageCount(fileData.pageCount);
        setFilePath(fileData.filePath.replace(/\\/g, "/"));
        setEstimatedPages(fileData.pageCount);
        setKioskState("uploaded");
        window.history.replaceState({}, document.title, "/");
      }
    }

    // Socket connection
    const socket = createSocket();

    socket.on("connect", () => {
      const kioskId = "kiosk_" + Math.floor(Math.random() * 1000);
      socket.emit("register_kiosk", kioskId, savedFile ? existingSessionId : null);
    });

    socket.on("session_init", (data: { sessionId: string; expiresAt: string }) => {
      const currentFile = localStorage.getItem("oneprint_file");
      if (!currentFile) {
        setKioskState("waiting");
      }
      setSessionId(data.sessionId);
      setExpiresAt(data.expiresAt);
      localStorage.setItem("oneprint_session", data.sessionId);
    });

    socket.on(
      "file-uploaded",
      (data: { fileName: string; pageCount: number; filePath: string }) => {
        console.log("SOCKET: file-uploaded received!", data);
        const normalizedPath = data.filePath.replace(/\\/g, "/");
        setFileName(data.fileName);
        setPageCount(data.pageCount);
        setEstimatedPages(data.pageCount);
        setFilePath(normalizedPath);
        setKioskState("uploaded");

        const fileData = { ...data, filePath: normalizedPath };
        localStorage.setItem("oneprint_file", JSON.stringify(fileData));
        const currentSession = localStorage.getItem("oneprint_session");
        if (currentSession) localStorage.setItem("oneprint_session", currentSession);
      },
    );

    socket.on("print_started", () => {
      setKioskState("printing");
      setPrintProgress(0);
      localStorage.removeItem("oneprint_file");
      localStorage.removeItem("oneprint_settings");
    });

    socket.on("print_progress", (data: { sessionId: string; percent: number }) => {
      setPrintProgress(data.percent);
    });

    socket.on("print_complete", () => {
      setKioskState("waiting");
      localStorage.removeItem("oneprint_session");
      localStorage.removeItem("oneprint_amount");
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    });

    socket.on("printer_update", () => {
      const apiUrl = getApiUrl();
      kioskApi
        .get(`${apiUrl}/api/admin/printers`)
        .then(({ data }) => {
          const available = data.length > 0;
          setPrintersAvailable(available);
        })
        .catch(() => {/* ignore transient errors */});
    });

    return () => {
<<<<<<< HEAD
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived: estimated pages from page range ───────────────────────────────
=======
      newSocket.off("connect");
      newSocket.off("session_init");
      newSocket.off("file-uploaded");
      newSocket.off("print_started");
      newSocket.off("print_progress");
      newSocket.off("print_complete");
      newSocket.off("printer_update");
    };
  }, []);
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce

  useEffect(() => {
    if (!pageRange.trim() || pageRange === "all") {
      setEstimatedPages(pageCount);
      return;
    }

    try {
      const parts = pageRange.split(",").map((p) => p.trim());
      let count = 0;

      for (const part of parts) {
        if (part.includes("-")) {
          const [start, end] = part.split("-").map(Number);
          if (!isNaN(start) && !isNaN(end) && end >= start) {
            const effectiveStart = Math.max(1, start);
            const effectiveEnd = Math.min(pageCount, end);
            if (effectiveEnd >= effectiveStart) {
              count += effectiveEnd - effectiveStart + 1;
            }
          }
        } else {
          const page = Number(part);
          if (!isNaN(page) && page >= 1 && page <= pageCount) {
            count += 1;
          }
        }
      }

      setEstimatedPages(count > 0 ? count : pageCount);
    } catch {
      console.warn("Invalid page range format");
    }
  }, [pageRange, pageCount, setEstimatedPages]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handlePayment = useCallback(async () => {
    const activeSession = sessionId ?? localStorage.getItem("oneprint_session");
    if (!activeSession) return;

    setLoadingPayment(true);
    try {
<<<<<<< HEAD
      const apiUrl = getApiUrl();
=======
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce
      const pricePerPage = colorMode === "color" ? priceColor : priceBw;
      const totalAmount = copies * estimatedPages * pricePerPage;

      const paymentData = {
        sessionId: activeSession,
        amount: totalAmount,
        colorMode,
        copies,
        pageCount: estimatedPages,
      };

<<<<<<< HEAD
      const { data } = await kioskApi.post(`${apiUrl}/api/order/init`, paymentData);
=======
      const { data } = await axios.post(
        "/api/tx/token",
        paymentData,
      );
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce

      localStorage.setItem("oneprint_amount", totalAmount.toString());
      localStorage.setItem("oneprint_session", activeSession);
      localStorage.setItem(
        "oneprint_settings",
        JSON.stringify({ copies, pageRange, estimatedPages, colorMode }),
      );

      window.snap.pay(data.token, {
        onSuccess: async (result: unknown) => {
          console.log("Payment Success:", result);
<<<<<<< HEAD
          await kioskApi.post(`${apiUrl}/api/order/complete`, {
=======
          await axios.post("/api/tx/complete", {
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce
            sessionId: activeSession,
            orderId: data.orderId,
          });
          setKioskState("printing");
        },
        onPending: (result: unknown) => {
          console.log("Payment Pending:", result);
          setLoadingPayment(false);
        },
        onError: (result: unknown) => {
          console.log("Payment Error:", result);
          setLoadingPayment(false);
        },
        onClose: () => {
          console.log("Payment Modal Closed");
          setLoadingPayment(false);
        },
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error("Payment Init Failed:", error);
      alert(
        "Failed to initialize payment: " +
          (err.response?.data?.message ?? err.message),
      );
      setLoadingPayment(false);
    }
  }, [
    sessionId,
    colorMode,
    priceColor,
    priceBw,
    copies,
    estimatedPages,
    pageRange,
    setLoadingPayment,
    setKioskState,
  ]);

  const handleReset = useCallback(() => {
    setShowResetModal(true);
  }, [setShowResetModal]);

  const confirmReset = useCallback(() => {
    localStorage.removeItem("oneprint_file");
    localStorage.removeItem("oneprint_settings");
    localStorage.removeItem("oneprint_amount");
    localStorage.removeItem("oneprint_session");
    window.location.reload();
  }, []);

  return { handlePayment, handleReset, confirmReset };
};
