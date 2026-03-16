"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import axios from "axios";

export default function ScanPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const [sessionIdUnwrapped, setSessionIdUnwrapped] = useState<string | null>(
    null,
  );
  const router = useRouter();
  const [status, setStatus] = useState("Verifying Session...");

  useEffect(() => {
    // Unwrap params
    params.then((p) => setSessionIdUnwrapped(p.sessionId));
  }, [params]);

  useEffect(() => {
    // Dynamically determine API URL
    const apiProto = window.location.protocol;
    const apiHost = window.location.hostname;
    const apiUrl = `${apiProto}//${apiHost}:3001`;

    if (!sessionIdUnwrapped) return;

    // 1. Verify session with server API
    axios
      .get(`${apiUrl}/api/verify-session/${sessionIdUnwrapped}`)
      .then((response) => {
        if (response.data.valid) {
          // 2. Connect socket to join room (optional for this step, but good for status updates)
          const apiProto = window.location.protocol;
          const apiHost = window.location.hostname;
          const apiUrl = `${apiProto}//${apiHost}:3001`;

          const socket = io(apiUrl);
          socket.emit("join_session", { sessionId: sessionIdUnwrapped });

          // 3. Redirect to upload page
          // Store sessionId in localStorage or pass via URL
          localStorage.setItem("oneprint_session", sessionIdUnwrapped);
          router.push("/upload");
        } else {
          setStatus("Invalid or Expired Session.");
        }
      })
      .catch((err) => {
        setStatus("Error connecting to kiosk (Check console).");
        console.error(err);
      });
  }, [sessionIdUnwrapped, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-900 p-4">
      <h1 className="text-2xl font-bold mb-4">Connecting...</h1>
      <p>{status}</p>
    </div>
  );
}
