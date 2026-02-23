/**
 * usePayment Hook
 * Manages payment flow and Midtrans integration
 */

import { useState, useCallback } from "react";
import { paymentAPI } from "@/lib/api";
import type { PaymentData, MidtransResponse } from "@/types/payment";
import type { ColorMode } from "@/types/session";

export const usePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const generateToken = useCallback(
    async (data: PaymentData): Promise<MidtransResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await paymentAPI.generateToken(data);
        setPaymentToken(response.data.token);
        setOrderId(response.data.orderId || null);
        return response.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to generate payment token";
        setError(errorMessage);
        console.error("Payment token generation failed:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const generateTokenWithSettings = useCallback(
    async (
      sessionId: string,
      colorMode?: ColorMode,
      printerId?: string | null,
    ): Promise<MidtransResponse | null> => {
      const payment: PaymentData = {
        sessionId,
      };

      if (colorMode) {
        payment.colorMode = colorMode;
      }

      if (printerId) {
        payment.printerId = printerId;
      }

      return generateToken(payment);
    },
    [generateToken],
  );

  const completePayment = useCallback(
    async (sessionId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await paymentAPI.complete({ sessionId });
        return true;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to complete payment";
        setError(errorMessage);
        console.error("Payment completion failed:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const resetPayment = useCallback(() => {
    setPaymentToken(null);
    setOrderId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    error,
    paymentToken,
    orderId,
    generateToken,
    generateTokenWithSettings,
    completePayment,
    resetPayment,
  };
};
