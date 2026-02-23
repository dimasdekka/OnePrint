/**
 * useSocket Hook
 * Manages Socket.IO connection with type safety
 */

import { useEffect, useState, useCallback } from "react";
import { createSocket, TypedSocket, SOCKET_EVENTS } from "@/lib/socket";

export const useSocket = () => {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = createSocket();
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const registerKiosk = useCallback(
    (kioskId: string) => {
      if (socket) {
        socket.emit(SOCKET_EVENTS.REGISTER_KIOSK, kioskId);
      }
    },
    [socket],
  );

  const joinSession = useCallback(
    (sessionId: string) => {
      if (socket) {
        socket.emit(SOCKET_EVENTS.JOIN_SESSION, { sessionId });
      }
    },
    [socket],
  );

  return {
    socket,
    isConnected,
    registerKiosk,
    joinSession,
  };
};
