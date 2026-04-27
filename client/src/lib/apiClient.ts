import axios from "axios";
import { getApiUrl } from "@/lib/getApiUrl";

/**
 * adminApi
 *
 * Axios instance pre-configured for Admin panel requests.
 * Sends cookies (withCredentials) required for session-based auth.
 */
export const adminApi = axios.create({
  withCredentials: true,
});

/**
 * kioskApi
 *
 * Axios instance for Kiosk public endpoints.
 * Does NOT send cookies — avoids CORS preflight credential issues.
 */
export const kioskApi = axios.create({
  withCredentials: false,
});

/**
 * getAdminApiUrl / getKioskApiUrl
 * Convenience wrappers — use getApiUrl() from lib internally.
 */
export { getApiUrl };
