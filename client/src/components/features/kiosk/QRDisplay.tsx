/**
 * QRDisplay Component
 * Displays QR code with countdown timer
 */

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { CountdownTimer } from "@/components/ui";

interface QRDisplayProps {
  qrUrl: string;
  expiresAt: string | null;
  onExpire: () => void;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({
  qrUrl,
  expiresAt,
  onExpire,
}) => {
  return (
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
          <CountdownTimer targetDate={expiresAt} onExpire={onExpire} />
        </p>
      )}
    </div>
  );
};
