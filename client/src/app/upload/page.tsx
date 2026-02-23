"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function UploadPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [validatingSession, setValidatingSession] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const validateSession = async () => {
      if (typeof window === "undefined") return;

      const urlParams = new URLSearchParams(window.location.search);
      let sid = urlParams.get("session");

      if (!sid) {
        setSessionError(
          "Link tidak valid. Silakan scan ulang QR code dari layar kiosk.",
        );
        setValidatingSession(false);
        return;
      }

      // Verify session with server
      try {
        const apiProto = window.location.protocol;
        const apiHost = window.location.hostname;
        const apiUrl = `${apiProto}//${apiHost}:3001`;

        const response = await axios.get(`${apiUrl}/api/verify-session/${sid}`);

        if (response.data.valid) {
          setSessionId(sid);
          setValidatingSession(false);

          // Replace history so back button doesn't go somewhere weird
          window.history.replaceState(null, "", window.location.href);
        } else {
          setSessionError(
            response.data.reason ||
              "Sesi tidak valid atau sudah kadaluarsa. Silakan scan QR code lagi.",
          );
          setValidatingSession(false);
        }
      } catch (error) {
        console.error("Session validation failed:", error);
        setSessionError(
          "Tidak dapat terhubung ke server. Pastikan kiosk menyala dan coba scan ulang.",
        );
        setValidatingSession(false);
      }
    };

    validateSession();
  }, []);

  // Prevent back navigation after upload success
  useEffect(() => {
    if (uploadSuccess) {
      window.history.pushState(null, "", window.location.href);
      const handlePop = () => {
        window.history.pushState(null, "", window.location.href);
      };
      window.addEventListener("popstate", handlePop);
      return () => window.removeEventListener("popstate", handlePop);
    }
  }, [uploadSuccess]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !sessionId) return;

    setUploading(true);

    try {
      const apiProto = window.location.protocol;
      const apiHost = window.location.hostname;
      const apiUrl = `${apiProto}//${apiHost}:3001`;

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("sessionId", sessionId);

      const response = await axios.post(`${apiUrl}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setUploadSuccess(true);
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload gagal. Silakan coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex items-center justify-center">
        <h1 className="text-xl font-extrabold text-blue-900">
          📄 OnePrint Upload
        </h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {validatingSession ? (
          // Loading state
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full">
            <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-blue-600 mx-auto mb-5"></div>
            <p className="text-gray-600 font-medium">Memverifikasi sesi...</p>
          </div>
        ) : sessionError ? (
          // Session error state — mobile-friendly, no link to QR page
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full">
            <div className="text-5xl mb-5">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Link Tidak Valid
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              {sessionError}
            </p>
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-blue-700 text-sm font-medium">
                💡 Scan QR code yang ada di layar kiosk untuk mendapatkan link
                baru.
              </p>
            </div>
          </div>
        ) : uploadSuccess ? (
          // Success state — lock here, no redirect to QR page
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              File Berhasil Dikirim!
            </h2>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              File kamu sudah terkirim ke kiosk. Halaman ini sudah tidak
              diperlukan lagi.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-blue-700 text-sm font-semibold">
                👉 Lanjutkan ke layar kiosk untuk mengatur jumlah copy dan
                melakukan pembayaran.
              </p>
            </div>
            <p className="mt-6 text-xs text-gray-400">
              Anda boleh menutup halaman ini.
            </p>
          </div>
        ) : (
          // Upload form
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📱</div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                Pilih File
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                PDF atau gambar, maks. 50MB
              </p>
            </div>

            <label
              htmlFor="file-input"
              className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
                uploading
                  ? "border-blue-300 bg-blue-50 cursor-wait"
                  : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
              }`}
            >
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                id="file-input"
              />
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600 mb-3"></div>
                  <p className="text-blue-700 font-semibold text-sm">
                    Sedang mengupload...
                  </p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-gray-700 font-bold text-base mb-1">
                    Tap untuk pilih file PDF
                  </p>
                  <p className="text-gray-400 text-xs">Hanya file PDF (.pdf)</p>
                </>
              )}
            </label>

            {uploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full"></div>
                </div>
                <p className="text-center text-xs text-gray-500 mt-2">
                  Menganalisis halaman dokumen...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
