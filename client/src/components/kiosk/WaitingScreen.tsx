"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export const CountdownTimer = ({
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

interface WaitingScreenProps {
  sessionId: string;
  expiresAt: string | null;
  onQrExpire: () => void;
}

export const WaitingScreen: React.FC<WaitingScreenProps> = ({
  sessionId,
  expiresAt,
  onQrExpire,
}) => {
  const handleQrExpire = () => {
    onQrExpire();
  };

  const qrUrl = sessionId
    ? `${window.location.protocol}//${window.location.host}/upload?session=${sessionId}`
    : "";

  return (
    <div className="w-full h-full flex">
      {/* Left: Tata Cara */}
      <div className="w-1/2 flex flex-col justify-center p-12 border-r border-black relative">
        <div className="max-w-md mx-auto w-full">
          <h2 className="text-2xl font-bold text-black mb-2">
            Tata Cara Print Dokumen.
          </h2>
          <p className="text-sm text-gray-600 mb-8">
            Ikuti langkah berikut untuk mulai mencetak dokumen Anda!
          </p>

          <div className="space-y-7">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center flex-shrink-0">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-black mb-1">
                  Scan QR Code
                </h3>
                <p className="text-sm text-gray-600">
                  Gunakan ponsel Anda untuk scan kode disebelah kanan.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center flex-shrink-0">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-black mb-1">
                  Upload File
                </h3>
                <p className="text-sm text-gray-600">
                  Pilih dan upload dokumen Anda dalam format PDF.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center flex-shrink-0">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 10h18M7 15h.01M11 15h2" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-black mb-1">
                  Bayar & Print
                </h3>
                <p className="text-sm text-gray-600">
                  Atur jumlah copy, lakukan pembayaran, dan ambil hasil print.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-5 left-0 w-full text-center">
          <p className="text-sm text-gray-600">
            ©2026 E-Print Service | All Rights Reserved.
          </p>
        </div>
      </div>

      {/* Right: QR Section */}
      <div className="w-1/2 flex flex-col items-center justify-center p-12 relative">
        <h2 className="text-2xl font-bold text-black mb-2">
          Scan untuk Memulai
        </h2>
        <p className="text-sm text-gray-600 mb-7">
          Siap nge-print? Scan QR Code dibawah ini.
        </p>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm inline-block mb-7">
          <QRCodeSVG value={qrUrl} size={260} level="H" />
        </div>

        {expiresAt && (
          <div className="border border-black rounded-full px-6 py-2 text-sm text-black">
            QR Code berakhir dalam{" "}
            <CountdownTimer targetDate={expiresAt} onExpire={handleQrExpire} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitingScreen;
