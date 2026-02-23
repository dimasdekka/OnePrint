/**
 * usePrinterStatus Hook
 * Checks printer availability and manages polling
 */

import { useState, useEffect, useCallback } from "react";
import { printerAPI } from "@/lib/api";
import { PRINTER_CHECK_INTERVAL } from "@/lib/constants";
import type { Printer } from "@/types/printer";

export const usePrinterStatus = () => {
  const [printersAvailable, setPrintersAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [printers, setPrinters] = useState<Printer[]>([]);

  const checkPrinters = useCallback(async () => {
    try {
      const { data } = await printerAPI.getAll();
      setPrinters(data);

      // Check if any printer is Online
      const available =
        data.length > 0 && data.some((p) => p.status === "Online");
      setPrintersAvailable(available);
    } catch (error) {
      console.error("Failed to check printers", error);
      setPrintersAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPrinters();

    // Poll every 30 seconds
    const interval = setInterval(checkPrinters, PRINTER_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [checkPrinters]);

  return {
    printersAvailable,
    isLoading,
    printers,
    refetch: checkPrinters,
  };
};
