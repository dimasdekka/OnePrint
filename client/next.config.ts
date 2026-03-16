import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "172.24.160.1", // Docker container IP
    "192.168.1.5", // LAN IP — agar HP bisa akses via QR code
    "192.168.1.3", // Current IP
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:3001/api/:path*", // Proksi ke backend
      },
    ];
  },
};

export default nextConfig;
