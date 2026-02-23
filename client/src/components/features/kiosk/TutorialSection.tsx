/**
 * TutorialSection Component
 * Displays step-by-step instructions for using the kiosk
 */

import React from "react";

export const TutorialSection: React.FC = () => {
  return (
    <div className="bg-blue-600 text-white p-12 h-full flex flex-col justify-center relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>

      <h2 className="text-3xl font-extrabold mb-8 relative z-10">
        Cara Print Dokumen
      </h2>
      <div className="space-y-8 relative z-10">
        <div className="flex items-start">
          <div className="flex-shrink-0 w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
            1
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold">Scan QR Code</h3>
            <p className="text-blue-100 text-sm mt-1">
              Gunakan kamera HP Anda untuk scan kode di sebelah kanan.
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="flex-shrink-0 w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
            2
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold">Upload File</h3>
            <p className="text-blue-100 text-sm mt-1">
              Pilih dan upload dokumen PDF atau Gambar Anda.
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="flex-shrink-0 w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
            3
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold">Bayar & Print</h3>
            <p className="text-blue-100 text-sm mt-1">
              Atur jumlah copy, lakukan pembayaran, dan ambil hasil print!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
