"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Script from "next/script";

const API_URL = "http://localhost:3001";

declare global {
  interface Window {
    snap: any;
  }
}

export default function PaymentPage() {
  const router = useRouter();
  const [amount, setAmount] = useState(0);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const sid = localStorage.getItem("oneprint_session");
    const amt = localStorage.getItem("oneprint_amount");
    const set = localStorage.getItem("oneprint_settings");

    if (!sid) {
      router.push("/");
    } else {
      setSessionId(sid);
      if (amt) setAmount(parseInt(amt));
      if (set) setSettings(JSON.parse(set));
    }
  }, [router]);

  const handleBack = () => {
    // Return to main page - KioskPage will auto-restore from localStorage
    router.push("/");
  };

  const handleTimeout = () => {
    localStorage.removeItem("oneprint_session");
    router.push("/");
  };

  const handlePayment = async () => {
    if (!sessionId) return;
    setLoading(true);

    try {
      const apiProto = window.location.protocol;
      const apiHost = window.location.hostname;
      const apiUrl = `${apiProto}//${apiHost}:3001`;

      // 1. Get Snap Token from Backend
      const paymentData: any = {
        sessionId,
      };

      // Add colorMode if it exists in settings
      if (settings?.colorMode) {
        paymentData.colorMode = settings.colorMode;
      }

      const { data } = await axios.post(
        `${apiUrl}/api/order/token`,
        paymentData,
      );

      // 2. Open Snap Popup
      window.snap.pay(data.token, {
        onSuccess: async function (result: any) {
          console.log("Payment Success:", result);
          // Notify Backend to Print
          await axios.post(`${apiUrl}/api/order/complete`, {
            sessionId,
            orderId: data.orderId,
          });
          // Redirect to home with printing state
          router.push("/?status=printing");
        },
        onPending: function (result: any) {
          console.log("Payment Pending:", result);
          setLoading(false); // Let them click again if they want, but modal is usually open
        },
        onError: function (result: any) {
          console.log("Payment Error:", result);
          setLoading(false);
        },
        onClose: function () {
          console.log("Payment Modal Closed");
          setLoading(false);
        },
      });
    } catch (error: any) {
      console.error("Payment Init Failed", error);
      alert(
        "Failed to initialize payment: " +
          (error.response?.data?.message || error.message),
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />

      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-lg">
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 font-bold text-sm flex items-center gap-1 transition-colors"
        >
          ← BACK
        </button>

        <h1 className="text-2xl font-bold mb-4 text-gray-800 mt-2">
          Payment Summary
        </h1>

        <div className="mb-6 border-b pb-4 text-left">
          <div className="flex justify-between text-gray-600 mb-2">
            <span>Copies</span>
            <span>{settings?.copies || 1} x</span>
          </div>
          <div className="flex justify-between text-gray-600 mb-2">
            <span>Pages</span>
            <span>{settings?.estimatedPages || 1} pages</span>
          </div>
          {settings?.pageRange && settings?.pageRange !== "all" && (
            <div className="flex justify-between text-gray-600 mb-2 text-sm">
              <span>Range</span>
              <span>{settings.pageRange}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600 mb-2">
            <span>Color Mode</span>
            <span className="font-semibold">
              {settings?.colorMode === "color"
                ? "🎨 Color"
                : "⬜ Black & White"}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-800 mt-4 border-t pt-2">
            <span>Total</span>
            <span>Rp {amount.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full font-bold py-3 px-4 rounded transition-all transform hover:scale-105 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
          }`}
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Secured by Midtrans (Sandbox Mode)
        </p>
      </div>
    </div>
  );
}
