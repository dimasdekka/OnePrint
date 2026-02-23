import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "172.24.160.1", // Docker container IP
    "192.168.1.5", // LAN IP — agar HP bisa akses via QR code
  ],
};

export default nextConfig;
