"use client";

import Script from "next/script";
import IdleTimer from "@/components/IdleTimer";
import { useKioskStore } from "@/store/kioskStore";

// ─── Component ────────────────────────────────────────────────────────────────

export default function KioskLayout({
  children,
  handleReset,
  confirmReset,
}: {
  children: React.ReactNode;
  handleReset: () => void;
  confirmReset: () => void;
}) {
  const { kioskState, printersAvailable, printerLoading, showResetModal, setShowResetModal } =
    useKioskStore();

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900 relative">
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />

      {/* Idle Timer - only when file is uploaded */}
      {(kioskState === "uploaded" || kioskState === "configured") && (
        <IdleTimer timeoutSeconds={60} onTimeout={confirmReset} />
      )}

      {/* Header */}
      <div className="absolute top-8 left-8 z-10">
        <h1 className="text-2xl font-bold tracking-tight text-black">
          E-Print Service
        </h1>
        <p className="text-sm text-gray-600">Universitas Pamulang Serang</p>
      </div>

      {/* Cancel / Reset button */}
      {(kioskState === "uploaded" || kioskState === "configured") && (
        <div className="absolute top-8 right-8 z-10 flex gap-4">
          <button
            onClick={handleReset}
            className="border border-black bg-white rounded-full px-6 py-2 text-sm font-medium hover:bg-gray-100 transition"
          >
            Cancel / Reset
          </button>
        </div>
      )}

      {/* Service Offline Overlay
          Only shown after the first printer check completes (printerLoading = false).
          This prevents the overlay from flashing on initial page load. */}
      {!printerLoading && !printersAvailable && (
        <div className="fixed inset-0 bg-white/95 z-50 flex items-center justify-center p-8 backdrop-blur-sm pointer-events-auto">
          <div className="text-center max-w-md">
            <h2 className="text-3xl font-bold text-black mb-4">Service Offline</h2>
            <p className="text-lg text-gray-600 mb-8">
              Maaf, saat ini tidak ada printer yang tersedia. Silakan hubungi
              petugas.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="border border-black hover:bg-black hover:text-white font-medium py-3 px-8 rounded-full transition-all"
            >
              Coba Refresh
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex pt-28 pb-10">{children}</div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center border border-black">
            <h3 className="text-xl font-bold text-black mb-2">Reset Session?</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Are you sure you want to cancel? This will clear all uploaded
              files and settings.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2 rounded-full border border-black font-medium text-black hover:bg-gray-50 transition-colors"
              >
                No
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 py-2 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition-colors"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
