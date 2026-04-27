"use client";

import { useKioskSession } from "@/hooks/kiosk/useKioskSession";
import { useKioskStore } from "@/store/kioskStore";
import KioskLayout from "@/components/kiosk/KioskLayout";
import WaitingScreen from "@/components/kiosk/WaitingScreen";
import ConfigScreen from "@/components/kiosk/ConfigScreen";
import PrintingScreen from "@/components/kiosk/PrintingScreen";

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess: (result: unknown) => void;
          onPending: (result: unknown) => void;
          onError: (result: unknown) => void;
          onClose: () => void;
        },
      ) => void;
      /** Programmatically hide/close the Snap payment popup */
      hide: () => void;
    };
  }
}

export default function KioskPage() {
  const {
    handlePayment: _handlePayment,
    handleReset,
    confirmReset,
    reRegisterKiosk,
  } = useKioskSession();

  const { kioskState, sessionId, expiresAt, printProgress } = useKioskStore();

  return (
    <KioskLayout handleReset={handleReset} confirmReset={confirmReset}>
      {/* Waiting for new session after reset — show spinner instead of blank screen */}
      {kioskState === "waiting" && !sessionId && (
        <div className="w-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-sm text-gray-500 font-medium">Mempersiapkan sesi baru...</p>
          </div>
        </div>
      )}

      {kioskState === "waiting" && sessionId && (
        <WaitingScreen
          sessionId={sessionId}
          expiresAt={expiresAt}
          onQrExpire={reRegisterKiosk}
        />
      )}

      {kioskState === "uploaded" && <ConfigScreen />}

      {kioskState === "printing" && (
        <PrintingScreen printProgress={printProgress} />
      )}
    </KioskLayout>
  );
}
