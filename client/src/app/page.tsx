"use client";

import { useKioskSession } from "@/hooks/kiosk/useKioskSession";
import KioskLayout from "@/components/kiosk/KioskLayout";
import WaitingScreen from "@/components/kiosk/WaitingScreen";
import ConfigScreen from "@/components/kiosk/ConfigScreen";
import PrintingScreen from "@/components/kiosk/PrintingScreen";

declare global {
  interface Window {
    snap: any;
  }
}

export default function KioskPage() {
  const kioskData = useKioskSession();

  return (
    <KioskLayout kioskData={kioskData}>
      {kioskData.state === "waiting" && kioskData.sessionId && (
        <WaitingScreen
          sessionId={kioskData.sessionId!}
          expiresAt={kioskData.expiresAt}
        />
      )}

      {kioskData.state === "uploaded" && <ConfigScreen kioskData={kioskData} />}

      {kioskData.state === "printing" && (
        <PrintingScreen printProgress={kioskData.printProgress} />
      )}
    </KioskLayout>
  );
}
