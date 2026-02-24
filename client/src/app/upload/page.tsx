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
          "Link tidak valid. Silakan scan ulang QR code dari layar e-print.",
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
          "Tidak dapat terhubung ke server. Pastikan e-print menyala dan coba scan ulang.",
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
    <div className="flex flex-col min-h-screen bg-white font-sans text-black relative">
      {/* Header */}
      <div className="p-8">
        <h1 className="text-xl font-bold tracking-tight">E-Print Service</h1>
        <p className="text-sm text-gray-600">Universitas Pamulang Serang</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
        {validatingSession ? (
          <div className="text-center w-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 font-medium">
              Memverifikasi sesi...
            </p>
          </div>
        ) : sessionError ? (
          <div className="text-center w-full border border-black rounded-3xl p-8">
            <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              !
            </div>
            <h2 className="text-xl font-bold text-black mb-2">
              Link Tidak Valid
            </h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {sessionError}
            </p>
            <p className="text-xs font-bold text-black">
              Scan QR code yang ada di layar e-print untuk mendapatkan link
              baru.
            </p>
          </div>
        ) : uploadSuccess ? (
          <div className="text-center w-full border border-black rounded-3xl p-8">
            <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center mx-auto mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-black mb-2">
              File Berhasil Dikirim!
            </h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              File kamu sudah terkirim ke e-print. Anda boleh menutup halaman
              ini.
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-black mb-1">
                Upload File PDF
              </h2>
              <p className="text-sm text-gray-600">
                Silahkan unggah dokumen yang ingin Anda print
              </p>
            </div>

            <label
              htmlFor="file-input"
              className={`flex flex-col items-center justify-center w-full border border-black border-dashed rounded-3xl p-10 cursor-pointer transition-all ${
                uploading ? "opacity-50 cursor-wait" : "hover:bg-gray-50"
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
                  <p className="text-black font-bold text-base">
                    Sedang mengupload...
                  </p>
                  <p className="text-gray-500 text-sm mt-1">Mohon tunggu...</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full border border-black flex items-center justify-center mb-6">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-black mb-1">
                    Pilih File PDF
                  </h3>
                  <p className="text-sm text-gray-600 mb-8 text-center">
                    Klik untuk menelusuri atau seret file kesini
                  </p>
                  <div className="border border-black rounded-full px-6 py-2 text-sm font-bold flex items-center gap-2">
                    <span>+</span> Pilih File
                  </div>
                </>
              )}
            </label>

            {!uploading && (
              <div className="mt-8 flex items-start gap-3 px-2">
                <div className="w-5 h-5 rounded-full border border-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold">!</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Maksimal ukuran file{" "}
                  <span className="font-bold text-black">50MB</span>. Pastikan
                  format file adalah{" "}
                  <span className="font-bold text-black">PDF</span> untuk
                  menjaga tata letak dokumen Anda.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-8 text-center pb-12">
        <p className="text-xs text-gray-600">
          ©2026 E-Print Service | All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
