import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "172.24.160.1", // Docker container IP
    "192.168.1.5", // LAN IP — agar HP bisa akses via QR code
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*", // Proxy to backend
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:3001/uploads/:path*", // Proxy to backend uploads
      },
      {
        source: "/socket.io/:path*",
        destination: "http://localhost:3001/socket.io/:path*", // Proxy to backend socket.io
      },
    ];
  },
};

export default nextConfig;
