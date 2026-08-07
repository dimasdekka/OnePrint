"use client";

import { useEffect, useCallback, useRef } from "react";
import { kioskApi } from "@/lib/apiClient";
import { getApiUrl } from "@/lib/getApiUrl";
import { createSocket } from "@/lib/socket";
import { useKioskStore } from "@/store/kioskStore";

const KIOSK_ID_STORAGE_KEY = "oneprint_kiosk_id";
const MIDTRANS_SNAP_SCRIPT_ID = "midtrans-snap-script";
const RELOAD_TRACE_STORAGE_KEY = "oneprint_reload_trace";

const clearKioskSessionStorage = () => {
  localStorage.removeItem("oneprint_session");
  localStorage.removeItem("oneprint_amount");
  localStorage.removeItem("oneprint_file");
  localStorage.removeItem("oneprint_settings");
  localStorage.removeItem("oneprint_idle_deadline");
};

const getOrCreateKioskId = () => {
  const existing = localStorage.getItem(KIOSK_ID_STORAGE_KEY);
  if (existing) return existing;

  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
  const kioskId = `kiosk_${randomId}`;
  localStorage.setItem(KIOSK_ID_STORAGE_KEY, kioskId);
  return kioskId;
};

const loadMidtransSnap = () => {
  if (window.snap?.pay) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(MIDTRANS_SNAP_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Midtrans Snap")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = MIDTRANS_SNAP_SCRIPT_ID;
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.dataset.clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Midtrans Snap"));
    document.body.appendChild(script);
  });
};

const getNavigationType = () => {
  const [navigation] = performance.getEntriesByType(
    "navigation",
  ) as PerformanceNavigationTiming[];
  return navigation?.type ?? "unknown";
};

const appendReloadTrace = (
  event: string,
  meta: Record<string, unknown> = {},
) => {
  try {
    const previous = JSON.parse(
      localStorage.getItem(RELOAD_TRACE_STORAGE_KEY) ?? "[]",
    ) as Array<Record<string, unknown>>;
    const next = [
      ...previous,
      {
        event,
        at: new Date().toISOString(),
        href: window.location.href,
        navType: getNavigationType(),
        visibility: document.visibilityState,
        sessionId: localStorage.getItem("oneprint_session"),
        hasFile: !!localStorage.getItem("oneprint_file"),
        idleDeadline: localStorage.getItem("oneprint_idle_deadline"),
        ...meta,
      },
    ].slice(-40);

    localStorage.setItem(RELOAD_TRACE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Diagnostic only.
  }
};

type UploadedFilePayload = {
  sessionId?: string;
  fileName: string;
  pageCount: number;
  filePath: string;
};

type SessionStateResponse = {
  success: boolean;
  session?: {
    id: string;
    status: string;
    expired?: boolean;
    copies?: number;
    colorMode?: "bw" | "color";
    pageRange?: string;
    pageCount?: number;
    file?: UploadedFilePayload | null;
  };
};

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
    kioskState,
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
  const kioskIdRef = useRef<string | null>(null);

  // ── Printer availability check ─────────────────────────────────────────────

  const checkPrinters = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const { data } = await kioskApi.get(`${apiUrl}/api/admin/printers`);
      // Only count printers that are actually online and connected.
      // Server uses PascalCase: "Online" / "Offline" (see server/src/utils/constants.js)
      const onlinePrinters = (data as Array<{ status: string; isConnected: boolean }>).filter(
        (p) => p.status === "Online" && p.isConnected === true,
      );
      const available = onlinePrinters.length > 0;
      setPrintersAvailable(available);
    } catch (err) {
      console.error("Failed to check printers:", err);
      setPrintersAvailable(false);
    } finally {
      setPrinterLoading(false);
    }
  }, [setPrinterLoading, setPrintersAvailable]);

  const loadPrintSettings = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const settingsRes = await kioskApi.get(`${apiUrl}/api/admin/settings`);
      if (settingsRes.data) {
        setPriceBw(settingsRes.data.pricePerPageBw ?? 1500);
        setPriceColor(settingsRes.data.pricePerPageColor ?? 3000);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  }, [setPriceBw, setPriceColor]);

  const applyUploadedFile = useCallback(
    (data: UploadedFilePayload) => {
      const normalizedPath = data.filePath.replace(/\\/g, "/");

      setFileName(data.fileName);
      setPageCount(data.pageCount);
      setEstimatedPages(data.pageCount);
      setFilePath(normalizedPath);
      setKioskState("uploaded");

      localStorage.setItem(
        "oneprint_file",
        JSON.stringify({ ...data, filePath: normalizedPath }),
      );

      const currentSession = data.sessionId ?? localStorage.getItem("oneprint_session");
      if (currentSession) localStorage.setItem("oneprint_session", currentSession);
    },
    [
      setEstimatedPages,
      setFileName,
      setFilePath,
      setKioskState,
      setPageCount,
    ],
  );

  const syncSessionState = useCallback(
    async (targetSessionId: string | null) => {
      if (!targetSessionId) return;

      try {
        const apiUrl = getApiUrl();
        const { data } = await kioskApi.get<SessionStateResponse>(
          `${apiUrl}/api/sessions/${targetSessionId}/state`,
        );
        const session = data.session;

        if (session?.expired || session?.status !== "uploaded" || !session.file) return;

        appendReloadTrace("session_state_recovered", {
          recoveredSessionId: session.id,
          status: session.status,
        });

        applyUploadedFile({
          ...session.file,
          sessionId: session.id,
          pageCount: session.file.pageCount ?? session.pageCount ?? 1,
        });

        if (session.copies) setCopies(session.copies);
        if (session.colorMode) setColorMode(session.colorMode);
        if (session.pageRange) setPageRange(session.pageRange);
      } catch (error) {
        console.warn("Failed to sync session state:", error);
      }
    },
    [applyUploadedFile, setColorMode, setCopies, setPageRange],
  );

  useEffect(() => {
    appendReloadTrace("kiosk_hook_mount");

    const handleBeforeUnload = () => {
      appendReloadTrace("beforeunload");
    };
    const handlePageHide = (event: PageTransitionEvent) => {
      appendReloadTrace("pagehide", { persisted: event.persisted });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    checkPrinters();
    loadPrintSettings();

    return () => {
      appendReloadTrace("kiosk_hook_unmount");
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [checkPrinters, loadPrintSettings]);

  // ── Boot: socket + restore saved session ───────────────────────────────────

  useEffect(() => {
    // ── Restore localStorage state ──
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
      kioskIdRef.current = kioskIdRef.current ?? getOrCreateKioskId();
      const freshFile = localStorage.getItem("oneprint_file");
      const freshSession = localStorage.getItem("oneprint_session");
      appendReloadTrace("socket_connect", {
        socketId: socket.id,
        freshSession,
        hasFile: !!freshFile,
      });
      console.log("[Socket] connected, registering kiosk", {
        kioskId: kioskIdRef.current,
        freshSession,
        hasFile: !!freshFile,
      });
      socket.emit("register_kiosk", kioskIdRef.current, freshSession);
    };

    const handleSessionInit = (data: { sessionId: string; expiresAt: string }) => {
      console.log("[Socket] session_init received", data.sessionId);
      const currentFile = localStorage.getItem("oneprint_file");
      const storedSession = localStorage.getItem("oneprint_session");
      const receivedNewSession = storedSession !== data.sessionId;
      appendReloadTrace("session_init", {
        receivedSessionId: data.sessionId,
        storedSession,
        receivedNewSession,
      });

      if (currentFile && receivedNewSession) {
        localStorage.removeItem("oneprint_file");
        localStorage.removeItem("oneprint_settings");
        localStorage.removeItem("oneprint_amount");
        resetSession();
      }

      if (!currentFile || receivedNewSession) {
        setKioskState("waiting");
      }
      setSessionId(data.sessionId);
      setExpiresAt(data.expiresAt);
      localStorage.setItem("oneprint_session", data.sessionId);
      syncSessionState(data.sessionId);
    };

    const isActiveSessionEvent = (eventSessionId?: string) => {
      if (!eventSessionId) return true;
      return localStorage.getItem("oneprint_session") === eventSessionId;
    };

    const handleFileUploaded = (data: UploadedFilePayload) => {
      if (!isActiveSessionEvent(data.sessionId)) return;
      console.log("SOCKET: file-uploaded received!", data);
      applyUploadedFile(data);
    };

    const handlePrintStarted = (data: { sessionId?: string } = {}) => {
      if (!isActiveSessionEvent(data.sessionId)) return;
      setKioskState("printing");
      setPrintProgress(0);
      localStorage.removeItem("oneprint_file");
      localStorage.removeItem("oneprint_settings");
    };

    const handlePrintProgress = (data: { sessionId: string; percent: number }) => {
      if (!isActiveSessionEvent(data.sessionId)) return;
      setPrintProgress(data.percent);
    };

    const handlePrintComplete = (data: { sessionId?: string } = {}) => {
      if (!isActiveSessionEvent(data.sessionId)) return;
      clearKioskSessionStorage();

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
      appendReloadTrace("printer_update");
      checkPrinters();
    };

    const handleDisconnect = (reason: string) => {
      appendReloadTrace("socket_disconnect", { reason });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("session_init", handleSessionInit);
    socket.on("file-uploaded", handleFileUploaded);
    socket.on("print_started", handlePrintStarted);
    socket.on("print_progress", handlePrintProgress);
    socket.on("print_complete", handlePrintComplete);
    socket.on("printer_update", handlePrinterUpdate);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    // IMPORTANT: Do NOT call socket.disconnect() here.
    // socket.disconnect() sets socket.active = false which permanently disables
    // auto-reconnect. Instead, only remove our specific listeners.
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("session_init", handleSessionInit);
      socket.off("file-uploaded", handleFileUploaded);
      socket.off("print_started", handlePrintStarted);
      socket.off("print_progress", handlePrintProgress);
      socket.off("print_complete", handlePrintComplete);
      socket.off("printer_update", handlePrinterUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const activeSession = sessionId ?? localStorage.getItem("oneprint_session");
    if (!activeSession || kioskState !== "waiting") return;

    syncSessionState(activeSession);
    const interval = window.setInterval(() => {
      syncSessionState(activeSession);
    }, 3_000);

    return () => window.clearInterval(interval);
  }, [kioskState, sessionId, syncSessionState]);

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
      socket.disconnect();
    }
    window.setTimeout(() => socket.connect(), 0);
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
        pageRange,
      };

      const { data } = await kioskApi.post(`${apiUrl}/api/order/init`, paymentData);
      await loadMidtransSnap();

      if (!window.snap?.pay) {
        throw new Error("Midtrans Snap is not available");
      }

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

  const invalidateSession = useCallback((targetSessionId: string | null) => {
    if (!targetSessionId) return;

    const apiUrl = getApiUrl();
    kioskApi
      .post(`${apiUrl}/api/sessions/${targetSessionId}/reset`)
      .catch((error) => {
        console.warn("Failed to invalidate session on server:", error);
      });
  }, []);

  const confirmReset = useCallback(() => {
    const activeSession = sessionId ?? localStorage.getItem("oneprint_session");

    // Close Midtrans Snap popup if it's open
    if (typeof window !== "undefined" && window.snap?.hide) {
      try { window.snap.hide(); } catch { /* ignore */ }
    }
    // Clear localStorage
    invalidateSession(activeSession);
    clearKioskSessionStorage();
    // Soft-reset Zustand state
    resetSession();
    // Reconnect socket → triggers "connect" → emits register_kiosk → gets session_init
    reRegisterKiosk();
  }, [invalidateSession, resetSession, reRegisterKiosk, sessionId]);

  const handleQrExpire = useCallback(() => {
    const activeSession = sessionId ?? localStorage.getItem("oneprint_session");

    invalidateSession(activeSession);
    clearKioskSessionStorage();
    resetSession();
    reRegisterKiosk();
  }, [invalidateSession, resetSession, reRegisterKiosk, sessionId]);

  return { handlePayment, handleReset, confirmReset, handleQrExpire };
};
