/**
 * CountdownTimer Component
 * Displays countdown timer for session expiry
 */

import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: string;
  onExpire: () => void;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  onExpire,
  className = "",
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

  return (
    <span className={`text-gray-600 font-bold ${className}`}>{timeLeft}</span>
  );
};
