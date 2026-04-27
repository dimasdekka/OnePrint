"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { kioskApi } from "@/lib/apiClient";
import { createSocket } from "@/lib/socket";
import { API_BASE_URL } from "@/lib/constants";


<<<<<<< HEAD

=======
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce
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
    if (!sessionIdUnwrapped) return;

    const apiUrl = API_BASE_URL;

    // 1. Verify session with server API
    kioskApi
      .get(`${apiUrl}/api/verify-session/${sessionIdUnwrapped}`)
      .then((response) => {
        if (response.data.valid) {
          // 2. Connect socket to join room (optional for this step, but good for status updates)
          const socket = createSocket();
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
