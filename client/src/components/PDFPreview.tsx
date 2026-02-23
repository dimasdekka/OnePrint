"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFPreviewProps {
  url: string;
}

export default function PDFPreview({ url }: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(err: Error) {
    console.error("PDF Load Error:", err);
    setError(err.message);
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 overflow-auto p-4">
      {loading && (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      )}

      {error ? (
        <div className="text-center text-red-500">
          <p className="font-bold">Failed to load PDF</p>
          <p className="text-xs mt-1">{error}</p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-blue-600 underline text-sm"
          >
            Open external
          </a>
        </div>
      ) : (
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div className="text-gray-500">Loading PDF...</div>}
          className="flex flex-col items-center shadow-lg"
        >
          <Page
            pageNumber={pageNumber}
            width={300}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="bg-white"
          />
        </Document>
      )}

      {!loading && !error && (
        <p className="mt-2 text-xs text-gray-500">
          Page {pageNumber} of {numPages}
        </p>
      )}
    </div>
  );
}
