"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const IDLE_DEADLINE_KEY = "oneprint_idle_deadline";

interface IdleTimerProps {
  timeoutSeconds?: number;
  onTimeout?: () => void;
}

const getRemainingSeconds = (timeoutSeconds: number) => {
  if (typeof window === "undefined") return timeoutSeconds;

  const deadline = Number(localStorage.getItem(IDLE_DEADLINE_KEY));
  if (!deadline) return timeoutSeconds;

  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
};

const setIdleDeadline = (timeoutSeconds: number) => {
  const deadline = Date.now() + timeoutSeconds * 1000;
  localStorage.setItem(IDLE_DEADLINE_KEY, String(deadline));
};

export default function IdleTimer({
  timeoutSeconds = 60,
  onTimeout,
}: IdleTimerProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(() =>
    getRemainingSeconds(timeoutSeconds),
  );
  const onTimeoutRef = useRef(onTimeout);
  const routerRef = useRef(router);
  const firedRef = useRef(false);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    firedRef.current = false;

    if (!localStorage.getItem(IDLE_DEADLINE_KEY)) {
      setIdleDeadline(timeoutSeconds);
    }

    const resetTimer = () => {
      setIdleDeadline(timeoutSeconds);
      setTimeLeft(timeoutSeconds);
      firedRef.current = false;
    };

    window.addEventListener("pointerdown", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    window.addEventListener("input", resetTimer);

    const timer = setInterval(() => {
      setTimeLeft(getRemainingSeconds(timeoutSeconds));
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      window.removeEventListener("input", resetTimer);
    };
  }, [timeoutSeconds]);

  useEffect(() => {
    if (timeLeft === 0 && !firedRef.current) {
      firedRef.current = true;
      localStorage.removeItem(IDLE_DEADLINE_KEY);

      if (onTimeoutRef.current) {
        onTimeoutRef.current();
      } else {
        routerRef.current.push("/");
      }
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white border border-black text-black px-5 py-2 rounded-full shadow-sm z-50 flex items-center gap-2 text-xs font-medium">
      <span className="font-bold">Auto Close in {formatTime(timeLeft)}</span>
    </div>
  );
}
