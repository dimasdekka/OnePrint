/**
 * PrintSettings Component
 * Print configuration form with preview
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { PRICE_PER_PAGE } from "@/lib/constants";
import type {
  FileData,
  PrintSettings as PrintSettingsType,
  ColorMode,
} from "@/types/session";

interface PrintSettingsProps {
  fileData: FileData;
  onContinue: (settings: PrintSettingsType, amount: number) => void;
}

export const PrintSettings: React.FC<PrintSettingsProps> = ({
  fileData,
  onContinue,
}) => {
  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState<ColorMode>("bw");
  const [pageRange, setPageRange] = useState("");
  const [estimatedPages, setEstimatedPages] = useState(fileData.pageCount);

  // Calculate pages based on range
  useEffect(() => {
    if (!pageRange.trim() || pageRange === "all") {
      setEstimatedPages(fileData.pageCount);
      return;
    }

    try {
      const parts = pageRange.split(",").map((p) => p.trim());
      let count = 0;

      parts.forEach((part) => {
        if (part.includes("-")) {
          const [start, end] = part.split("-").map(Number);
          if (!isNaN(start) && !isNaN(end) && end >= start) {
            const effectiveStart = Math.max(1, start);
            const effectiveEnd = Math.min(fileData.pageCount, end);
            if (effectiveEnd >= effectiveStart) {
              count += effectiveEnd - effectiveStart + 1;
            }
          }
        } else {
          const page = Number(part);
          if (!isNaN(page) && page >= 1 && page <= fileData.pageCount) {
            count += 1;
          }
        }
      });

      setEstimatedPages(count > 0 ? count : fileData.pageCount);
    } catch (e) {
      console.warn("Invalid page range format");
    }
  }, [pageRange, fileData.pageCount]);

  // Calculate total price based on color mode
  const getPricePerPage = () => {
    return colorMode === "color" ? PRICE_PER_PAGE * 2 : PRICE_PER_PAGE;
  };

  const totalPrice = copies * estimatedPages * getPricePerPage();

  const handleContinue = () => {
    onContinue(
      {
        copies,
        pageRange: pageRange || "all",
        estimatedPages,
        colorMode,
      },
      totalPrice,
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: Preview */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-bold text-gray-700 mb-3">File Preview</h3>
        <div className="bg-gray-100 border-2 border-gray-300 rounded-lg h-96 overflow-hidden flex items-center justify-center relative">
          {fileData.filePath && fileData.fileName?.endsWith(".pdf") ? (
            <iframe
              src={`http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:3001${encodeURI(fileData.filePath)}`}
              className="w-full h-full"
              title="PDF Preview"
            >
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <p className="mb-2 text-gray-700 font-semibold">
                  Preview not available.
                </p>
                <a
                  href={`http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:3001${encodeURI(fileData.filePath)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Open PDF
                </a>
              </div>
            </iframe>
          ) : fileData.filePath ? (
            <img
              src={`http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:3001${encodeURI(fileData.filePath)}`}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <p className="text-gray-400 font-bold">No Preview Available</p>
          )}
        </div>
        <p className="mt-3 text-sm text-gray-600">
          <strong>{fileData.fileName}</strong> ({fileData.pageCount} pages
          detected)
        </p>
      </div>

      {/* Right: Settings */}
      <div className="flex flex-col gap-4">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="font-extrabold text-gray-900 text-lg mb-4 border-b pb-2">
            Print Settings
          </h3>

          {/* Copies */}
          <div className="mb-5">
            <label className="text-sm font-extrabold text-black uppercase block mb-2">
              Copies
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCopies(Math.max(1, copies - 1))}
                className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg font-bold text-xl transition-colors border border-gray-400"
              >
                -
              </button>
              <input
                type="number"
                value={copies}
                onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                className="w-20 text-center border-2 border-gray-400 rounded-lg py-2 text-xl font-bold text-black bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
              <button
                onClick={() => setCopies(copies + 1)}
                className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg font-bold text-xl transition-colors border border-gray-400"
              >
                +
              </button>
            </div>
          </div>

          {/* Color Mode */}
          <div className="mb-5">
            <label className="text-sm font-extrabold text-black uppercase block mb-2">
              Print Color
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setColorMode("bw")}
                className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all border-2 ${
                  colorMode === "bw"
                    ? "bg-blue-600 text-white border-blue-700 shadow-lg"
                    : "bg-gray-100 text-gray-700 border-gray-400 hover:bg-gray-200"
                }`}
              >
                ⬜ Black & White
              </button>
              <button
                onClick={() => setColorMode("color")}
                className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all border-2 ${
                  colorMode === "color"
                    ? "bg-blue-600 text-white border-blue-700 shadow-lg"
                    : "bg-gray-100 text-gray-700 border-gray-400 hover:bg-gray-200"
                }`}
              >
                🎨 Color
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Color printing is{" "}
              {getPricePerPage() === PRICE_PER_PAGE
                ? "the same price"
                : "2x price"}
            </p>
          </div>

          {/* Pages to Print */}
          <div className="mb-5">
            <label className="text-sm font-extrabold text-black uppercase block mb-2">
              Pages to Print
            </label>
            <input
              type="number"
              value={estimatedPages}
              onChange={(e) => setEstimatedPages(parseInt(e.target.value) || 1)}
              disabled={pageRange.trim().length > 0}
              className={`w-full border-2 border-gray-400 rounded-lg py-2 px-3 text-xl font-bold text-black bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${
                pageRange.trim().length > 0
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : ""
              }`}
            />
          </div>

          {/* Page Range */}
          <div>
            <label className="text-sm font-extrabold text-black uppercase block mb-2">
              Page Range (Optional)
            </label>
            <input
              type="text"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder="e.g. 1-5, 8, 10-12 or leave blank for all"
              className="w-full border-2 border-gray-400 rounded-lg py-2 px-3 text-black font-bold bg-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>
        </div>

        {/* Total & Payment Button */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-lg shadow-md">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Pages × Copies × Price/page</span>
              <span>
                {estimatedPages} × {copies} × Rp
                {getPricePerPage().toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-lg font-semibold text-gray-700">
                Total Price
              </span>
              <span className="text-3xl font-bold text-blue-700">
                Rp {totalPrice.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
          <Button onClick={handleContinue} size="lg" fullWidth>
            Continue to Payment
          </Button>
        </div>
      </div>
    </div>
  );
};
