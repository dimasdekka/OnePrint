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
<<<<<<< HEAD
        destination: "http://localhost:3001/api/:path*", // Proxy to backend
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:3001/uploads/:path*", // Proxy to backend uploads
      },
      {
        source: "/socket.io/:path*",
        destination: "http://localhost:3001/socket.io/:path*", // Proxy to backend socket.io
=======
        destination: "http://127.0.0.1:3001/api/:path*", // Proksi ke backend
>>>>>>> 51fa0337771e8e1ec249745c7bbb0e4b1d9e20ce
      },
    ];
  },
};

export default nextConfig;
