"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface IdleTimerProps {
  timeoutSeconds?: number; // default 60
  onTimeout?: () => void;
}

export default function IdleTimer({
  timeoutSeconds = 60,
  onTimeout,
}: IdleTimerProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(timeoutSeconds);
  // Use a ref so the interval callback always reads the latest values
  // without being recreated (avoids stale closure + "setState in render" issues)
  const onTimeoutRef = useRef(onTimeout);
  const routerRef = useRef(router);
  const firedRef = useRef(false);

  // Keep refs in sync with latest props/router
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    firedRef.current = false;
    setTimeLeft(timeoutSeconds);

    const resetTimer = () => {
      setTimeLeft(timeoutSeconds);
      firedRef.current = false;
    };

    // Events to detect user activity
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("keypress", resetTimer);
    window.addEventListener("scroll", resetTimer);
    window.addEventListener("touchstart", resetTimer);

    // Countdown interval — ONLY decrement state here, never call side effects
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("keypress", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
    };
  }, [timeoutSeconds]);

  // Separate effect to fire the callback AFTER render, when timeLeft hits 0
  // This is the correct pattern — never call side effects inside setState updaters
  useEffect(() => {
    if (timeLeft === 0 && !firedRef.current) {
      firedRef.current = true;
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
    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-black text-black px-6 py-2 rounded-full shadow-sm z-50 flex items-center gap-2 text-sm font-medium">
      <span className="font-bold">Auto Close in {formatTime(timeLeft)}</span>
    </div>
  );
}
