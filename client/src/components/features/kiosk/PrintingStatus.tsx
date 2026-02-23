/**
 * PrintingStatus Component
 * Displays printing progress animation
 */

import React from "react";

export const PrintingStatus: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-2xl border border-blue-100 animate-pulse">
      <div className="flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-blue-600 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2-4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-blue-900 mb-2">
          Processing Print...
        </h2>
        <p className="text-gray-600 text-lg">
          Payment Successful! Sending document to printer.
        </p>
        <div className="mt-8 w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div className="bg-blue-600 h-4 rounded-full animate-progress-bar"></div>
        </div>
      </div>
    </div>
  );
};
