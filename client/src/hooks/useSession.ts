/**
 * useSession Hook
 * Manages session state and localStorage persistence
 */

import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import type {
  KioskState,
  FileData,
  PrintSettings,
  ColorMode,
} from "@/types/session";

export const useSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [state, setState] = useState<KioskState>("waiting");
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [settings, setSettings] = useState<PrintSettings | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>("bw");

  // Restore from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
    const savedFile = localStorage.getItem(STORAGE_KEYS.FILE);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const savedColorMode = localStorage.getItem(
      "colorMode",
    ) as ColorMode | null;

    if (savedSession) {
      setSessionId(savedSession);
    }

    if (savedFile) {
      try {
        const fileDataParsed: FileData = JSON.parse(savedFile);
        setFileData(fileDataParsed);
        setState("uploaded");
      } catch (e) {
        console.error("Failed to restore file data", e);
        localStorage.removeItem(STORAGE_KEYS.FILE);
      }
    }

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        if (parsedSettings.colorMode) {
          setColorMode(parsedSettings.colorMode);
        }
      } catch (e) {
        console.error("Failed to restore settings", e);
      }
    }

    if (savedColorMode) {
      setColorMode(savedColorMode);
    }
  }, []);

  const saveSession = useCallback((id: string, expires?: string) => {
    setSessionId(id);
    localStorage.setItem(STORAGE_KEYS.SESSION, id);
    if (expires) {
      setExpiresAt(expires);
      localStorage.setItem("expiresAt", expires);
    }
  }, []);

  const saveFileData = useCallback((data: FileData) => {
    setFileData(data);
    localStorage.setItem(STORAGE_KEYS.FILE, JSON.stringify(data));
  }, []);

  const saveSettings = useCallback((data: PrintSettings) => {
    setSettings(data);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
    if (data.colorMode) {
      setColorMode(data.colorMode);
      localStorage.setItem("colorMode", data.colorMode);
    }
  }, []);

  const saveColorMode = useCallback((mode: ColorMode) => {
    setColorMode(mode);
    localStorage.setItem("colorMode", mode);
  }, []);

  const saveAmount = useCallback((amount: number) => {
    localStorage.setItem(STORAGE_KEYS.AMOUNT, amount.toString());
  }, []);

  const clearSession = useCallback(() => {
    setSessionId(null);
    setExpiresAt(null);
    setFileData(null);
    setSettings(null);
    setColorMode("bw");
    setState("waiting");

    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem("expiresAt");
    localStorage.removeItem("colorMode");
  }, []);

  const clearFileData = useCallback(() => {
    setFileData(null);
    setSettings(null);
    setColorMode("bw");
    localStorage.removeItem(STORAGE_KEYS.FILE);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem("colorMode");
  }, []);

  return {
    sessionId,
    expiresAt,
    state,
    setState,
    fileData,
    settings,
    colorMode,
    saveSession,
    saveFileData,
    saveSettings,
    saveColorMode,
    saveAmount,
    clearSession,
    clearFileData,
  };
};
