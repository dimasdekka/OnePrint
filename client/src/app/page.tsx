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
    };
  }
}

export default function KioskPage() {
  const { handlePayment: _handlePayment, handleReset, confirmReset } = useKioskSession();

  const { kioskState, sessionId, expiresAt, printProgress } = useKioskStore();

  return (
    <KioskLayout handleReset={handleReset} confirmReset={confirmReset}>
      {kioskState === "waiting" && sessionId && (
        <WaitingScreen sessionId={sessionId} expiresAt={expiresAt} />
      )}

      {kioskState === "uploaded" && <ConfigScreen />}

      {kioskState === "printing" && (
        <PrintingScreen printProgress={printProgress} />
      )}
    </KioskLayout>
  );
}
