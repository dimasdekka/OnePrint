"use client";

import { useKioskStore } from "@/store/kioskStore";
import { useKioskSession } from "@/hooks/kiosk/useKioskSession";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConfigScreen() {
  const {
    fileName,
    filePath,
    pageCount,
    copies,
    colorMode,
    pageRange,
    estimatedPages,
    priceBw,
    priceColor,
    loadingPayment,
    setCopies,
    setColorMode,
    setPageRange,
  } = useKioskStore();

  const { handlePayment } = useKioskSession();

  return (
    <div className="w-full flex flex-col items-center px-8 relative">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-black mb-2">
          Konfigurasi Cetak Detail
        </h2>
        <p className="text-sm text-gray-600">
          Sesuaikan dokumen Anda sebelum masuk ke proses pembayaran.
        </p>
      </div>

      <div className="w-full max-w-6xl flex gap-6 pb-20">
        {/* Left: Preview */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-black mb-4">File Preview</h3>
          <div className="flex-1 bg-gray-50 border border-gray-300 relative min-h-[500px] overflow-hidden">
            {filePath && fileName?.endsWith(".pdf") ? (
              <iframe
                src={`http://${window.location.hostname}:3001${encodeURI(filePath)}#view=Fit`}
                className="w-full h-full border-none"
                title="PDF Preview"
              />
            ) : filePath ? (
              <img
                src={`http://${window.location.hostname}:3001${encodeURI(filePath)}`}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No Preview Available
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              {fileName}
            </span>
            <span>({pageCount} pages terdeteksi)</span>
          </div>
        </div>

        {/* Right: Settings */}
        <div className="w-[500px] flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-black mb-6">
              Print Settings
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-bold text-black block mb-2">
                  Copies
                </label>
                <div className="flex border border-black rounded-md overflow-hidden h-12">
                  <button
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                    className="w-12 flex items-center justify-center hover:bg-gray-100 border-r border-black font-medium bg-white"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={copies}
                    onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                    className="w-full text-center font-bold text-base outline-none text-black"
                  />
                  <button
                    onClick={() => setCopies(copies + 1)}
                    className="w-12 flex items-center justify-center hover:bg-gray-100 border-l border-black font-medium bg-white"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-black block mb-2">
                  Pages to Print
                </label>
                <div className="h-12 w-full relative">
                  <input
                    type="number"
                    value={estimatedPages}
                    readOnly
                    className="w-full h-full border border-gray-300 rounded-md px-4 font-bold outline-none text-gray-500 bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-black block mb-2">
                  Warna Cetak
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setColorMode("bw")}
                    className={`flex-1 flex items-center justify-center gap-2 border border-black rounded-md px-3 h-12 text-sm font-bold ${
                      colorMode === "bw" ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border border-black flex items-center justify-center">
                      {colorMode === "bw" && (
                        <div className="w-2 h-2 bg-black rounded-full" />
                      )}
                    </div>
                    B&W
                  </button>
                  <button
                    onClick={() => setColorMode("color")}
                    className={`flex-1 flex items-center justify-center gap-2 border border-black rounded-md px-3 h-12 text-sm font-bold ${
                      colorMode === "color" ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border border-black flex items-center justify-center">
                      {colorMode === "color" && (
                        <div className="w-2 h-2 bg-black rounded-full" />
                      )}
                    </div>
                    Warna
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-black block mb-2">
                  Page Range (Opsional)
                </label>
                <div className="h-12 w-full relative">
                  <input
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="All"
                    className="w-full h-full border border-black rounded-md px-4 py-2 font-bold outline-none text-black placeholder-black bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-black mb-6">
              Ringkasan Biaya
            </h3>

            <div className="space-y-3 mb-6 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Jumlah Lembar Cetak ({estimatedPages}x)</span>
                <span>
                  Rp{" "}
                  {(
                    estimatedPages *
                    (colorMode === "color" ? priceColor : priceBw)
                  ).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Jumlah Copies Cetak ({copies}x)</span>
                <span>
                  Rp{" "}
                  {(
                    (copies - 1) *
                    estimatedPages *
                    (colorMode === "color" ? priceColor : priceBw)
                  ).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="border-t border-black pt-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-600 mb-1">
                  Total Pembayaran
                </div>
                <div className="text-xl font-bold text-black">
                  Rp{" "}
                  {(
                    copies *
                    estimatedPages *
                    (colorMode === "color" ? priceColor : priceBw)
                  ).toLocaleString("id-ID")}
                </div>
              </div>
              <button
                onClick={handlePayment}
                disabled={loadingPayment}
                className="border border-black rounded-full px-6 py-2 h-12 font-bold text-black hover:bg-gray-100 transition flex items-center gap-2 disabled:opacity-50 text-sm"
              >
                {loadingPayment ? "Processing..." : "Lanjut Pembayaran"}
                {!loadingPayment && <span>→</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 w-full text-center">
        <p className="text-sm text-gray-600">
          © 2026 E-Print Service | All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
