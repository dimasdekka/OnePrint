import { useState, useEffect } from "react";
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

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      setTimeLeft(timeoutSeconds);
    };

    const handleActivity = () => {
      resetTimer();
    };

    // Events to detect user activity
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    // Countdown interval
    timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onTimeout) {
            onTimeout();
          } else {
            // Default action: Redirect to home/QR
            router.push("/");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [timeoutSeconds, router, onTimeout]);

  // Format time as MM:SS (though strictly seconds is fine too)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Only show timer if time is running out (e.g. less than full time) or always?
  // User asked to "memperlihatkan perhitungan mundur" so always show.

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-6 py-2 rounded-full shadow-md z-50 flex items-center gap-2 animate-pulse">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
          clipRule="evenodd"
        />
      </svg>
      <span className="font-bold font-mono">
        Auto Close in {formatTime(timeLeft)}
      </span>
    </div>
  );
}
