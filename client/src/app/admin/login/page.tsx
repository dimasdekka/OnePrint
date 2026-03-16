"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import axios from "axios";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(
        "/api/auth/login",
        { username, password },
        { withCredentials: true },
      );
      router.push("/admin");
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Login failed. Check server connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-black relative">
      {/* Header */}
      <div className="p-8 absolute top-0 left-0 w-full">
        <h1 className="text-xl font-bold tracking-tight">E-Print Service</h1>
        <p className="text-sm text-gray-600">Universitas Pamulang Serang</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 w-full mt-20">
        <div className="bg-white border text-center border-black p-10 py-12 rounded-[2rem] shadow-sm w-full max-w-[450px]">
          <h1 className="text-2xl font-bold mb-3">Selamat Datang!!</h1>
          <p className="text-sm text-gray-600 mb-10">
            Silahkan masuk untuk mengelola Sistem E-Print
          </p>
          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Username *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username anda disini"
                className="w-full h-12 px-4 py-2 border border-black rounded-lg outline-none text-black placeholder-gray-500 focus:bg-gray-50 transition"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password anda disini"
                  className="w-full h-12 px-4 py-2 border border-black rounded-lg outline-none text-black placeholder-gray-500 pr-12 focus:bg-gray-50 transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-gray-500 focus:outline-none"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex justify-start mb-6">
              <a
                href="#"
                className="text-xs text-gray-600 hover:text-black hover:underline transition"
              >
                Lupa Password?
              </a>
            </div>

            {error && (
              <p className="text-red-500 text-sm font-medium">{error}</p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white border border-black text-black h-12 rounded-full font-bold hover:bg-gray-100 transition disabled:opacity-50"
              >
                {loading ? "LOGGING IN..." : "LOGIN"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 text-center absolute bottom-0 left-0 w-full pointer-events-none">
        <p className="text-xs text-gray-600 pointer-events-auto">
          ©2026 E-Print Service | All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
