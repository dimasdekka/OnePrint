"use client";

import { useEffect, useCallback, useRef } from "react";
import { kioskApi } from "@/lib/apiClient";
import { getApiUrl } from "@/lib/getApiUrl";
import { createSocket } from "@/lib/socket";
import { useKioskStore } from "@/store/kioskStore";

/**
 * useKioskSession
 *
 * Key architectural decisions:
 * 1. socketRef stores the singleton so all actions use the SAME socket with all listeners.
 * 2. We do NOT call socket.disconnect() in cleanup — Socket.IO's socket.disconnect()
 *    sets socket.active = false which permanently disables auto-reconnect.
 *    Instead we only remove our event listeners on cleanup.
 * 3. reRegisterKiosk always reads fresh localStorage values (no stale closure).
 * 4. The "connect" handler also reads fresh localStorage so reconnects work correctly.
 */
export const useKioskSession = () => {
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
    resetSession,
  } = useKioskStore();

  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);

  // ── Printer availability check ─────────────────────────────────────────────

  const checkPrinters = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const { data } = await kioskApi.get(`${apiUrl}/api/admin/printers`);
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
      setPrinterLoading(false);
    }
  }, [setPrinterLoading, setPriceBw, setPriceColor, setPrintersAvailable]);

  useEffect(() => {
    checkPrinters();
    const interval = setInterval(checkPrinters, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Boot: socket + restore saved session ───────────────────────────────────

  useEffect(() => {
    // ── Restore localStorage state ──
    const existingSessionId = localStorage.getItem("oneprint_session");
    const savedFile = localStorage.getItem("oneprint_file");

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

    // ── Handle URL params ──
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

    // ── Socket setup ──
    const socket = createSocket();
    socketRef.current = socket;

    // "connect" handler reads FRESH localStorage every time (no stale closure).
    // This is critical so reconnects after confirmReset work correctly.
    const handleConnect = () => {
      const kioskId = "kiosk_" + Math.floor(Math.random() * 1000);
      const freshFile = localStorage.getItem("oneprint_file");
      const freshSession = localStorage.getItem("oneprint_session");
      console.log("[Socket] connected, registering kiosk", { kioskId, freshSession: freshFile ? freshSession : null });
      socket.emit("register_kiosk", kioskId, freshFile ? freshSession : null);
    };

    const handleSessionInit = (data: { sessionId: string; expiresAt: string }) => {
      console.log("[Socket] session_init received", data.sessionId);
      const currentFile = localStorage.getItem("oneprint_file");
      if (!currentFile) {
        setKioskState("waiting");
      }
      setSessionId(data.sessionId);
      setExpiresAt(data.expiresAt);
      localStorage.setItem("oneprint_session", data.sessionId);
    };

    const handleFileUploaded = (data: { fileName: string; pageCount: number; filePath: string }) => {
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
    };

    const handlePrintStarted = () => {
      setKioskState("printing");
      setPrintProgress(0);
      localStorage.removeItem("oneprint_file");
      localStorage.removeItem("oneprint_settings");
    };

    const handlePrintProgress = (data: { sessionId: string; percent: number }) => {
      setPrintProgress(data.percent);
    };

    const handlePrintComplete = () => {
      localStorage.removeItem("oneprint_session");
      localStorage.removeItem("oneprint_amount");
      localStorage.removeItem("oneprint_file");
      localStorage.removeItem("oneprint_settings");

      setPrintProgress(100);
      setTimeout(() => {
        resetSession();
        // Reconnect to get a fresh session — equivalent to hard refresh socket handshake
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current.connect();
        }
      }, 3000);
    };

    const handlePrinterUpdate = () => {
      const apiUrl = getApiUrl();
      kioskApi
        .get(`${apiUrl}/api/admin/printers`)
        .then(({ data }) => {
          const available = data.length > 0;
          setPrintersAvailable(available);
        })
        .catch(() => {/* ignore transient errors */});
    };

    socket.on("connect", handleConnect);
    socket.on("session_init", handleSessionInit);
    socket.on("file-uploaded", handleFileUploaded);
    socket.on("print_started", handlePrintStarted);
    socket.on("print_progress", handlePrintProgress);
    socket.on("print_complete", handlePrintComplete);
    socket.on("printer_update", handlePrinterUpdate);

    // IMPORTANT: Do NOT call socket.disconnect() here.
    // socket.disconnect() sets socket.active = false which permanently disables
    // auto-reconnect. Instead, only remove our specific listeners.
    return () => {
      socket.off("connect", handleConnect);
      socket.off("session_init", handleSessionInit);
      socket.off("file-uploaded", handleFileUploaded);
      socket.off("print_started", handlePrintStarted);
      socket.off("print_progress", handlePrintProgress);
      socket.off("print_complete", handlePrintComplete);
      socket.off("printer_update", handlePrinterUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived: estimated pages from page range ───────────────────────────────

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

  /**
   * Re-register kiosk by forcing a fresh socket disconnect→connect cycle.
   * This is the ONLY reliable way to get a new session_init from the server,
   * equivalent to what happens on hard refresh.
   *
   * socket.connect() re-enables the socket and triggers "connect" event,
   * which calls our handleConnect handler that emits register_kiosk.
   */
  const reRegisterKiosk = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;

    console.log("[reRegisterKiosk] forcing reconnect, connected=", socket.connected);

    if (socket.connected) {
      // Briefly disconnect then reconnect to trigger fresh "connect" event
      socket.disconnect();
    }
    // socket.connect() re-enables socket.active and initiates connection
    socket.connect();
  }, []);

  const handlePayment = useCallback(async () => {
    const activeSession = sessionId ?? localStorage.getItem("oneprint_session");
    if (!activeSession) return;

    setLoadingPayment(true);
    try {
      const apiUrl = getApiUrl();
      const pricePerPage = colorMode === "color" ? priceColor : priceBw;
      const totalAmount = copies * estimatedPages * pricePerPage;

      const paymentData = {
        sessionId: activeSession,
        amount: totalAmount,
        colorMode,
        copies,
        pageCount: estimatedPages,
      };

      const { data } = await kioskApi.post(`${apiUrl}/api/order/init`, paymentData);

      localStorage.setItem("oneprint_amount", totalAmount.toString());
      localStorage.setItem("oneprint_session", activeSession);
      localStorage.setItem(
        "oneprint_settings",
        JSON.stringify({ copies, pageRange, estimatedPages, colorMode }),
      );

      window.snap.pay(data.token, {
        onSuccess: async (result: unknown) => {
          console.log("Payment Success:", result);
          await kioskApi.post(`${apiUrl}/api/order/complete`, {
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
    // Close Midtrans Snap popup if it's open
    if (typeof window !== "undefined" && window.snap?.hide) {
      try { window.snap.hide(); } catch { /* ignore */ }
    }
    // Clear localStorage
    localStorage.removeItem("oneprint_file");
    localStorage.removeItem("oneprint_settings");
    localStorage.removeItem("oneprint_amount");
    localStorage.removeItem("oneprint_session");
    // Soft-reset Zustand state
    resetSession();
    // Reconnect socket → triggers "connect" → emits register_kiosk → gets session_init
    reRegisterKiosk();
  }, [resetSession, reRegisterKiosk]);

  return { handlePayment, handleReset, confirmReset, reRegisterKiosk };
};
