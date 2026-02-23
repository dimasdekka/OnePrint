/**
 * ServiceOffline Component
 * Displays overlay when no printers are available
 */

import React from "react";
import { Button } from "@/components/ui";

interface ServiceOfflineProps {
  onRetry: () => void;
}

export const ServiceOffline: React.FC<ServiceOfflineProps> = ({ onRetry }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/90 z-50 flex items-center justify-center p-8 backdrop-blur-sm">
      <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-2xl animate-bounce-in">
        <div className="text-6xl mb-6">🚫🖨️</div>
        <h2 className="text-4xl font-extrabold text-gray-800 mb-4">
          Service Offline
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Maaf, saat ini tidak ada printer yang tersedia. <br />
          Silakan hubungi petugas atau coba lagi nanti.
        </p>
        <Button onClick={onRetry} size="lg">
          Coba Refresh
        </Button>
      </div>
    </div>
  );
};
