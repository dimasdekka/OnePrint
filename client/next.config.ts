import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "10.150.18.99", // Current LAN IP
    "172.24.160.1", // Internal network IP
    "192.168.1.5", // LAN IP — agar HP bisa akses via QR code
    "192.168.1.3", // Current IP
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
