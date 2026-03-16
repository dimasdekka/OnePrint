"use client";

import { useEffect, useState, useRef } from "react";
import { createSocket } from "@/lib/socket";
import { QRCodeSVG } from "qrcode.react";

export default function KioskPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState("Initializing System...");
  const kioskIdRef = useRef<string>("kiosk_" + Math.floor(Math.random() * 1000));
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const newSocket = createSocket();
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      setStatus("System Ready");
      newSocket.emit("register_kiosk", kioskIdRef.current);
    });

    newSocket.on("session_init", (data: { sessionId: string }) => {
      setSessionId(data.sessionId);
    });

    newSocket.on("user_connected", () => {
      setStatus("User Connected. Waiting for File...");
    });

    newSocket.on("print_started", () => {
      setStatus(`Processing...`);
    });

    newSocket.on("print_complete", () => {
      setStatus("Printing Finished. Please collect your document.");
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    });

    return () => {
      newSocket.off("connect");
      newSocket.off("session_init");
      newSocket.off("user_connected");
      newSocket.off("print_started");
      newSocket.off("print_complete");
    };
  }, []);

  const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
  const host = typeof window !== "undefined" ? window.location.host : "localhost:3000";
  const scanUrl = sessionId ? `${protocol}//${host}/scan/${sessionId}` : "";

  return (
    <div className="flex min-h-screen bg-gray-900 text-white font-sans overflow-hidden">
      {/* Left Side: Brand & Instructions */}
      <div className="w-1/2 p-12 flex flex-col justify-between bg-gradient-to-br from-blue-900 to-gray-900 relative">
        {/* Abstract Background Element */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#FFFFFF"
              d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-46.9C87.4,-34.7,90.1,-20.4,89.1,-6.5C88.1,7.3,83.5,20.8,75.3,32.3C67.1,43.8,55.3,53.3,42.6,60.8C29.9,68.3,16.3,73.8,1.4,71.4C-13.5,69,-28.4,58.7,-40.8,48.5C-53.2,38.3,-63.1,28.2,-68.8,16.2C-74.5,4.2,-76,-9.7,-70.8,-21.8C-65.6,-33.9,-53.7,-44.2,-41.2,-52.1C-28.7,-60,-15.6,-65.5,-1.2,-63.4C13.2,-61.3,26.4,-51.6,44.7,-76.4Z"
              transform="translate(100 100)"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-6xl font-extrabold tracking-tight mb-4 text-blue-400">
            OnePrint
          </h1>
          <p className="text-xl text-gray-300">
            Self-Service Printing Solution
          </p>
        </div>

        <div className="space-y-8 z-10">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold font-mono">
              1
            </div>
            <div>
              <h3 className="text-2xl font-bold">Scan QR Code</h3>
              <p className="text-gray-400">Use your smartphone camera</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold font-mono">
              2
            </div>
            <div>
              <h3 className="text-2xl font-bold">Upload Document</h3>
              <p className="text-gray-400">Select PDF or Image file</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold font-mono">
              3
            </div>
            <div>
              <h3 className="text-2xl font-bold">Pay & Print</h3>
              <p className="text-gray-400">Secure payment via QRIS</p>
            </div>
          </div>
        </div>

        <div className="text-gray-500 text-sm">
          <p>Need Help? Call Support: 0812-3456-7890</p>
          <p>v1.0.0 • Session ID: {sessionId?.slice(0, 8)}...</p>
        </div>
      </div>

      {/* Right Side: QR Code Area */}
      <div className="w-1/2 bg-white flex flex-col items-center justify-center p-12 text-gray-900">
        <div className="bg-white p-6 rounded-xl shadow-2xl border-4 border-gray-100">
          {sessionId ? (
            <QRCodeSVG value={scanUrl} size={400} />
          ) : (
            <div className="w-[400px] h-[400px] flex items-center justify-center bg-gray-100 animate-pulse text-gray-400">
              Initializing...
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-3xl font-bold mb-2 text-gray-800 uppercase tracking-widest">
            {status}
          </h2>
          <p className="text-gray-500">
            Do not close this screen while printing.
          </p>
        </div>
      </div>
    </div>
  );
}
