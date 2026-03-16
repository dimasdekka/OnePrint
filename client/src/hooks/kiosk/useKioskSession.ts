import { useState, useEffect, useRef } from "react";
import { createSocket } from "@/lib/socket";
import axios from "axios";
import type { KioskState } from "@/types/kiosk";

export const useKioskSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [state, setState] = useState<KioskState>("waiting");
  const kioskIdRef = useRef<string>("kiosk_" + Math.floor(Math.random() * 1000));
  const [printersAvailable, setPrintersAvailable] = useState(true);

  // Pricing Settings
  const [priceBw, setPriceBw] = useState(1500);
  const [priceColor, setPriceColor] = useState(3000);

  // File data
  const [fileName, setFileName] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [filePath, setFilePath] = useState<string | null>(null);

  // Print settings
  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState<"bw" | "color">("color");
  const [pageRange, setPageRange] = useState("all");
  const [estimatedPages, setEstimatedPages] = useState(1);
  const [showResetModal, setShowResetModal] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
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

    checkPrinters();
    const interval = setInterval(checkPrinters, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socketProto = window.location.protocol;
    const socketHost = window.location.hostname;
    const socketUrl = `${socketProto}//${socketHost}:3001`;

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
          setCopies(settings.copies || 1);
          setPageRange(settings.pageRange || "all");
          setEstimatedPages(settings.estimatedPages || fileData.pageCount);
          setColorMode(settings.colorMode || "color");
        } else {
          setEstimatedPages(fileData.pageCount);
        }

        setState("uploaded");
      } catch (e) {
        console.error("Failed to restore file state", e);
        localStorage.removeItem("oneprint_file");
      }
    }

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

    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get("status");

    if (statusParam === "printing") {
      setState("printing");
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
        setState("uploaded");
        window.history.replaceState({}, document.title, "/");
      }
    }

    newSocket.on("printer_update", () => {
      window.location.reload();
    });

    return () => {
      newSocket.off("connect");
      newSocket.off("session_init");
      newSocket.off("file-uploaded");
      newSocket.off("print_started");
      newSocket.off("print_progress");
      newSocket.off("print_complete");
      newSocket.off("printer_update");
    };
  }, []);

  // Calculate pages based on range
  useEffect(() => {
    if (!pageRange.trim() || pageRange === "all") {
      setEstimatedPages(pageCount);
      return;
    }

    try {
      const parts = pageRange.split(",").map((p) => p.trim());
      let count = 0;

      parts.forEach((part) => {
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
      });

      setEstimatedPages(count > 0 ? count : pageCount);
    } catch (e) {
      console.warn("Invalid page range format");
    }
  }, [pageRange, pageCount]);

  const handlePayment = async () => {
    const activeSession = sessionId || localStorage.getItem("oneprint_session");
    if (!activeSession) return;
    setLoadingPayment(true);

    try {
      const pricePerPage = colorMode === "color" ? priceColor : priceBw;
      const totalAmount = copies * estimatedPages * pricePerPage;

      const paymentData: any = {
        sessionId: activeSession,
        amount: totalAmount,
        colorMode,
        copies,
        pageCount: estimatedPages,
      };

      const { data } = await axios.post(
        "/api/tx/token",
        paymentData,
      );

      localStorage.setItem("oneprint_amount", totalAmount.toString());
      localStorage.setItem("oneprint_session", activeSession);
      localStorage.setItem(
        "oneprint_settings",
        JSON.stringify({ copies, pageRange, estimatedPages, colorMode }),
      );

      window.snap.pay(data.token, {
        onSuccess: async function (result: any) {
          console.log("Payment Success:", result);
          await axios.post("/api/tx/complete", {
            sessionId: activeSession,
            orderId: data.orderId,
          });
          setState("printing");
        },
        onPending: function (result: any) {
          console.log("Payment Pending:", result);
          setLoadingPayment(false);
        },
        onError: function (result: any) {
          console.log("Payment Error:", result);
          setLoadingPayment(false);
        },
        onClose: function () {
          console.log("Payment Modal Closed");
          setLoadingPayment(false);
        },
      });
    } catch (error: any) {
      console.error("Payment Init Failed", error);
      alert(
        "Failed to initialize payment: " +
          (error.response?.data?.message || error.message),
      );
      setLoadingPayment(false);
    }
  };

  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    localStorage.removeItem("oneprint_file");
    localStorage.removeItem("oneprint_settings");
    localStorage.removeItem("oneprint_amount");
    localStorage.removeItem("oneprint_session");

    window.location.reload();
  };

  return {
    state,
    sessionId,
    expiresAt,
    printersAvailable,
    fileName,
    filePath,
    pageCount,
    copies,
    setCopies,
    colorMode,
    setColorMode,
    pageRange,
    setPageRange,
    estimatedPages,
    priceBw,
    priceColor,
    printProgress,
    loadingPayment,
    showResetModal,
    setShowResetModal,
    handlePayment,
    handleReset,
    confirmReset,
  };
};
