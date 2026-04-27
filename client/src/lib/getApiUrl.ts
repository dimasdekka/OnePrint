/**
 * getApiUrl
 *
 * Pure helper — safe to import anywhere (server or client).
 * Returns empty string on client to use Next.js rewrites,
 * or localhost:3001 on server to bypass Next.js rewrites.
 */
export const getApiUrl = (): string => {
  if (typeof window !== "undefined") {
    // Client-side: Use relative path, relies on Next.js rewrites
    return "";
  }
  // Server-side (SSR): Direct to backend
  return process.env.API_URL || "http://localhost:3001";
};
