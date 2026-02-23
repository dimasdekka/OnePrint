"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import IdleTimer from "@/components/IdleTimer"; // Import
import axios from "axios";

const PDFPreview = dynamic(() => import("../components/PDFPreview"), {
  ssr: false,
  loading: () => <p>Loading PDF Viewer...</p>,
});

type KioskState =
  | "waiting"
  | "uploaded"
  | "configured"
  | "payment"
  | "printing";

const CountdownTimer = ({
  targetDate,
  onExpire,
}: {
  targetDate: string;
  onExpire: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        onExpire();
        return;
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  return <span className="text-gray-600 font-bold">{timeLeft}</span>;
};

// ...

export default function KioskPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [state, setState] = useState<KioskState>("waiting");
  const [socket, setSocket] = useState<any>(null);
  const [printersAvailable, setPrintersAvailable] = useState(true); // Default true

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

  useEffect(() => {
    // Check for available printers
    const checkPrinters = async () => {
      try {
        const apiProto = window.location.protocol;
        const apiHost = window.location.hostname;
        const apiUrl = `${apiProto}//${apiHost}:3001`;

        const { data } = await axios.get(`${apiUrl}/api/admin/printers`);

        // Check if any printer is Online
        // If data is empty array -> No printers
        // If printers exist but all are Offline -> No printers
        const available =
          data.length > 0 && data.some((p: any) => p.status === "Online");

        setPrintersAvailable(available);

        // Fetch settings config
        try {
          const settingsObj = await axios.get(`${apiUrl}/api/admin/settings`);
          if (settingsObj.data) {
            setPriceBw(settingsObj.data.pricePerPageBw || 1500);
            setPriceColor(settingsObj.data.pricePerPageColor || 3000);
          }
        } catch (settingsError) {
          console.error("Failed to fetch settings", settingsError);
        }
      } catch (e) {
        console.error("Failed to check printers", e);
        // If error (e.g. server down), maybe set false?
        // For now keep true or set false depending on preference.
        // Let's set false if we can't connect to be safe.
        setPrintersAvailable(false);
      }
    };

    checkPrinters();

    // Poll every 30 seconds? Or just once?
    // Let's poll every 30s
    const interval = setInterval(checkPrinters, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socketProto = window.location.protocol;
    const socketHost = window.location.hostname;
    const socketUrl = `${socketProto}//${socketHost}:3001`;

    // ── Step 1: Check for existing session ──
    const existingSessionId = localStorage.getItem("oneprint_session");

    // ── Step 2: Synchronously restore file state if an upload is in progress ──
    // We keep `oneprint_file` intact so the configuration screen persists
    // across refreshes (user had already uploaded a file).
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

    // ── Step 3: Connect socket AFTER state is set ──
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      // Register with existing session if any
      const kioskId = "kiosk_" + Math.floor(Math.random() * 1000);
      newSocket.emit("register_kiosk", kioskId, existingSessionId);
    });

    newSocket.on(
      "session_init",
      (data: { sessionId: string; expiresAt: string }) => {
        // Server issued a fresh session — always accept it if no active file
        const currentFile = localStorage.getItem("oneprint_file");
        if (!currentFile) {
          setSessionId(data.sessionId);
          setExpiresAt(data.expiresAt);
          setState("waiting");
        }
        // Always save the new session ID for file-upload correlation
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
        // Normalize slashes for URL
        const normalizedPath = data.filePath.replace(/\\/g, "/");
        setFilePath(normalizedPath);
        setState("uploaded");

        // Persist file data with normalized path
        const fileData = { ...data, filePath: normalizedPath };
        localStorage.setItem("oneprint_file", JSON.stringify(fileData));
        // Ensure session matches
        if (sessionId) localStorage.setItem("oneprint_session", sessionId);
      },
    );

    newSocket.on("print_started", () => {
      setState("printing");
      setPrintProgress(0);
      // Clear saved data on print start to prevent 'back' loop
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
      // Clear session so we generate a new one on reload
      localStorage.removeItem("oneprint_session");
      localStorage.removeItem("oneprint_amount");

      // Reset to home after 3 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    });

    // Check URL parameters on load
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get("status");

    if (statusParam === "printing") {
      setState("printing");
      localStorage.removeItem("oneprint_file");
      // Clear query param without reload
      window.history.replaceState({}, document.title, "/");
    } else if (statusParam === "configure") {
      // Restore state immediately for back button
      const savedFile = localStorage.getItem("oneprint_file");
      if (savedFile) {
        const fileData = JSON.parse(savedFile);
        setFileName(fileData.fileName);
        setPageCount(fileData.pageCount);
        setFilePath(fileData.filePath.replace(/\\/g, "/")); // Normalize on restore
        setEstimatedPages(fileData.pageCount);
        setState("uploaded");
        // Clear query param
        window.history.replaceState({}, document.title, "/");
      }
    }

    // Listen for Printer Updates
    newSocket.on("printer_update", () => {
      console.log("Printer update received, checking status...");
      // Re-run the check logic
      // We can't call checkPrinters directly here because it's defined in another effect.
      // So detailed implementation:
      // 1. We should ideally refactor checkPrinters to be outside, OR
      // 2. Just trigger a reload? Slower but effective.
      // 3. Or just toggle a dummy state to trigger re-check.

      // Let's force a reload for now as per user request "otomatis refresh"
      window.location.reload();
    });

    return () => {
      newSocket.disconnect();
    };
  }, []); // Empty dependency array to prevent infinite reconnection loop
  // Actually cleaner to keep [] and let session_init handle it.

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
            // Cap at max pages
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

  const handleContinueToPayment = () => {
    // Calculate price based on color mode
    const pricePerPage = colorMode === "color" ? priceColor : priceBw;
    const totalAmount = copies * estimatedPages * pricePerPage;

    localStorage.setItem("oneprint_amount", totalAmount.toString());
    localStorage.setItem("oneprint_session", sessionId || "");
    localStorage.setItem(
      "oneprint_settings",
      JSON.stringify({ copies, pageRange, estimatedPages, colorMode }),
    );

    router.push("/payment");
  };

  const qrUrl = sessionId
    ? `${window.location.protocol}//${window.location.host}/upload?session=${sessionId}`
    : "";

  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    // Must clear storage explicitly so the restore logic doesn't kick in on reload
    localStorage.removeItem("oneprint_file");
    localStorage.removeItem("oneprint_settings");
    localStorage.removeItem("oneprint_amount");

    window.location.reload();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      {/* Idle Timer for Kiosk - Only when uploaded/configured */}
      {(state === "uploaded" || state === "configured") && (
        <IdleTimer timeoutSeconds={60} onTimeout={confirmReset} />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm p-6 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">
          OnePrint
        </h1>
        {state !== "waiting" && state !== "printing" && (
          <button
            onClick={handleReset}
            className="text-red-500 font-bold hover:text-red-700 transition-colors uppercase text-sm tracking-wider border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50"
          >
            Cancel / Reset
          </button>
        )}
      </div>

      {/* Service Offline Overlay */}
      {!printersAvailable && (
        <div className="fixed inset-0 bg-gray-900/90 z-50 flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-2xl animate-bounce-in">
            <div className="text-6xl mb-6">🚫🖨️</div>
            <h2 className="text-4xl font-extrabold text-gray-800 mb-4">
              Service Offline
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Maaf, saat ini tidak ada printer yang tersedia. <br />
              Silakan hubungi petugas atau coba lagi nanti.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg hover:scale-105"
            >
              Coba Refresh
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {state === "waiting" && sessionId && (
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px]">
            {/* Left: Tutorial Section */}
            <div className="bg-blue-600 text-white p-12 h-full flex flex-col justify-center relative overflow-hidden">
              {/* Decorative Circles */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>

              <div className="relative z-10 w-full h-full min-h-[400px] flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold mb-6">Video Tutorial</h2>
                <div className="w-full aspect-video bg-black/20 rounded-2xl border-2 border-white/30 flex items-center justify-center overflow-hidden shadow-2xl group cursor-pointer relative">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    poster="https://images.unsplash.com/photo-1586075010633-1ec4440594ba?auto=format&fit=crop&q=80&w=1000"
                  >
                    <source src="" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 text-white shadow-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-10 h-10 ml-1"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-blue-100 text-center text-sm opacity-80 italic">
                  Klik play untuk melihat panduan penggunaan OnePrint
                </p>
              </div>
            </div>

            {/* Right: QR Section */}
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Scan untuk Memulai
              </h2>
              <p className="text-gray-500 mb-8">
                Siap nge-print? Scan QR code di bawah ini.
              </p>
              <div className="bg-white p-4 rounded-2xl inline-block shadow-[0_0_20px_rgba(0,0,0,0.1)] border border-gray-100">
                <QRCodeSVG value={qrUrl} size={280} level="H" />
              </div>
              {expiresAt && (
                <p className="mt-8 text-sm font-medium text-gray-400 bg-gray-50 px-4 py-2 rounded-full">
                  QR berakhir dalam{" "}
                  <CountdownTimer
                    targetDate={expiresAt}
                    onExpire={() => window.location.reload()}
                  />
                </p>
              )}
            </div>
          </div>
        )}

        {state === "uploaded" && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-5xl w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Configure Print Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-700 mb-3">File Preview</h3>
                <div className="bg-gray-100 border-2 border-gray-300 rounded-lg aspect-[1/1.4] max-h-[75vh] w-full overflow-hidden flex items-center justify-center relative shadow-inner">
                  {filePath && fileName?.endsWith(".pdf") ? (
                    <iframe
                      src={`http://${window.location.hostname}:3001${encodeURI(filePath)}#view=Fit`}
                      className="w-full h-full border-none"
                      title="PDF Preview"
                    >
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <p className="mb-2 text-gray-700 font-semibold">
                          Preview not available.
                        </p>
                        <a
                          href={`http://${window.location.hostname}:3001${encodeURI(filePath)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Open PDF
                        </a>
                      </div>
                    </iframe>
                  ) : filePath ? (
                    <img
                      src={`http://${window.location.hostname}:3001${encodeURI(filePath)}`}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <p className="text-gray-400 font-bold">
                      No Preview Available
                    </p>
                  )}
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  <strong>{fileName}</strong> ({pageCount} pages detected)
                </p>
              </div>

              {/* Right: Settings */}
              <div className="flex flex-col gap-4">
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                  <h3 className="font-extrabold text-gray-900 text-lg mb-4 border-b pb-2">
                    Print Settings
                  </h3>

                  {/* Copies */}
                  <div className="mb-5">
                    <label className="text-sm font-extrabold text-black uppercase block mb-2">
                      Copies
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCopies(Math.max(1, copies - 1))}
                        className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg font-bold text-xl transition-colors border border-gray-400"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={copies}
                        onChange={(e) =>
                          setCopies(parseInt(e.target.value) || 1)
                        }
                        className="w-20 text-center border-2 border-gray-400 rounded-lg py-2 text-xl font-bold text-black bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      />
                      <button
                        onClick={() => setCopies(copies + 1)}
                        className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg font-bold text-xl transition-colors border border-gray-400"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Color Mode */}
                  <div className="mb-5">
                    <label className="text-sm font-extrabold text-black uppercase block mb-2">
                      Print Color
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setColorMode("bw")}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all border-2 ${
                          colorMode === "bw"
                            ? "bg-blue-600 text-white border-blue-700 shadow-lg"
                            : "bg-gray-100 text-gray-700 border-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        ⬜ Black & White
                      </button>
                      <button
                        onClick={() => setColorMode("color")}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all border-2 ${
                          colorMode === "color"
                            ? "bg-blue-600 text-white border-blue-700 shadow-lg"
                            : "bg-gray-100 text-gray-700 border-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        🎨 Color
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Color printing is Rp {priceColor.toLocaleString("id-ID")}{" "}
                      per page
                    </p>
                  </div>

                  {/* Pages to Print */}
                  <div className="mb-5">
                    <label className="text-sm font-extrabold text-black uppercase block mb-2">
                      Pages to Print
                    </label>
                    <input
                      type="number"
                      value={estimatedPages}
                      onChange={(e) =>
                        setEstimatedPages(parseInt(e.target.value) || 1)
                      }
                      disabled={pageRange.trim().length > 0}
                      className={`w-full border-2 border-gray-400 rounded-lg py-2 px-3 text-xl font-bold text-black bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${
                        pageRange.trim().length > 0
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : ""
                      }`}
                    />
                  </div>

                  {/* Page Range */}
                  <div>
                    <label className="text-sm font-extrabold text-black uppercase block mb-2">
                      Page Range (Optional)
                    </label>
                    <input
                      type="text"
                      value={pageRange}
                      onChange={(e) => setPageRange(e.target.value)}
                      placeholder="e.g. 1-5, 8, 10-12"
                      className="w-full border-2 border-gray-400 rounded-lg py-2 px-3 text-black font-bold bg-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  </div>
                </div>

                {/* Total & Payment Button */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-lg shadow-md">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Pages × Copies × Price/page</span>
                      <span>
                        {estimatedPages} × {copies} × Rp
                        {(colorMode === "color"
                          ? priceColor
                          : priceBw
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-lg font-semibold text-gray-700">
                        Total Price
                      </span>
                      <span className="text-3xl font-bold text-blue-700">
                        Rp{" "}
                        {(
                          copies *
                          estimatedPages *
                          (colorMode === "color" ? priceColor : priceBw)
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleContinueToPayment}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-xl shadow-lg transition-all transform hover:scale-105"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {state === "printing" && (
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-2xl border border-blue-100">
            <div className="flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2-4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-blue-900 mb-2">
                {printProgress >= 100 ? "Selesai! ✅" : "Mencetak Dokumen..."}
              </h2>
              <p className="text-gray-600 text-lg mb-2">
                {printProgress >= 100
                  ? "Dokumen berhasil dicetak. Terima kasih!"
                  : "Pembayaran berhasil! Mengirim ke printer..."}
              </p>

              {/* Real progress bar driven by server events */}
              <div className="mt-6 w-full">
                <div className="flex justify-between text-sm font-semibold text-gray-500 mb-2">
                  <span>Progress</span>
                  <span>{printProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden shadow-inner">
                  <div
                    className="h-5 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${printProgress}%`,
                      background:
                        printProgress >= 100
                          ? "linear-gradient(90deg, #16a34a, #22c55e)"
                          : "linear-gradient(90deg, #2563eb, #60a5fa)",
                    }}
                  />
                </div>
                {printProgress < 100 && printProgress > 0 && (
                  <p className="text-xs text-gray-400 mt-2 text-center animate-pulse">
                    Harap tunggu, jangan matikan perangkat...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Custom Reset Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30 transition-opacity">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center transform transition-all scale-100">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Reset Session?
              </h3>
              <p className="text-gray-600 mb-8">
                Are you sure you want to cancel? This will clear all uploaded
                files and settings.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="px-6 py-3 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold transition-colors"
                >
                  No, Keep Editing
                </button>
                <button
                  onClick={confirmReset}
                  className="px-6 py-3 rounded-lg text-white bg-red-600 hover:bg-red-700 font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Yes, Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
