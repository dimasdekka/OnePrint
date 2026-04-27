"use client";

import { adminApi } from "@/lib/apiClient";
import { useAdminStore } from "@/store/adminStore";
import { getApiUrl } from "@/lib/getApiUrl";
import type { Printer } from "@/types/admin";
import type { OsPrinter } from "@/store/adminStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrinterManagerProps {
  showModal: (
    type: "confirm" | "alert" | "info",
    title: string,
    message: string,
    onConfirm?: () => void | Promise<void>,
    onCancel?: () => void | Promise<void>,
  ) => void;
  fetchPrinters: () => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrinterManager({ showModal, fetchPrinters }: PrinterManagerProps) {
  const {
    printers,
    osPrinters,
    selectedOsPrinter,
    loadingPrinters,
    showAddPrinter,
    setPrinters,
    setOsPrinters,
    setSelectedOsPrinter,
    setLoadingPrinters,
    setShowAddPrinter,
  } = useAdminStore();

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openAddPrinterModal = async () => {
    setShowAddPrinter(true);
    setLoadingPrinters(true);
    try {
      const { data } = await adminApi.get<OsPrinter[]>(
        `${getApiUrl()}/api/system/printers`,
      );
      setOsPrinters(data);
      if (data.length > 0) setSelectedOsPrinter(data[0].Name);
    } catch {
      showModal(
        "alert",
        "Error",
        "Gagal scan printer. Pastikan server berjalan di Windows.",
      );
    } finally {
      setLoadingPrinters(false);
    }
  };

  const handleAddPrinter = async () => {
    if (!selectedOsPrinter) return;
    try {
      const printerData = osPrinters.find((p) => p.Name === selectedOsPrinter);
      await adminApi.post(`${getApiUrl()}/api/admin/printers`, {
        name: printerData?.Name,
        driver: printerData?.DriverName,
      });
      fetchPrinters();
      setShowAddPrinter(false);
      showModal("info", "Berhasil", "Printer berhasil ditambahkan!");
    } catch {
      showModal(
        "alert",
        "Error",
        "Gagal menambahkan printer (mungkin sudah ditambahkan?)",
      );
    }
  };

  const handleDeletePrinter = (id: string) => {
    showModal(
      "confirm",
      "Hapus Printer",
      "Yakin ingin menghapus printer ini?",
      async () => {
        try {
          await adminApi.delete(`${getApiUrl()}/api/admin/printers/${id}`);
          fetchPrinters();
        } catch {
          showModal("alert", "Error", "Gagal menghapus printer");
        }
      },
    );
  };

  const handleTestPrint = (id: string, printerName: string) => {
    showModal(
      "confirm",
      "Test Print",
      `Kirim test print ke ${printerName}?`,
      async () => {
        try {
          await adminApi.post(`${getApiUrl()}/api/admin/printers/${id}/test-print`);
          showModal("info", "Berhasil", "Test print terkirim! Cek printer Anda.");
        } catch {
          showModal("alert", "Error", "Gagal mengirim test print");
        }
      },
    );
  };

  const handleSyncStatus = async (id: string, printerName: string) => {
    try {
      const { data } = await adminApi.post(
        `${getApiUrl()}/api/admin/printers/${id}/sync-status`,
      );
      setPrinters((prev: Printer[]) =>
        prev.map((p) => (p.id === id ? { ...p, status: data.status } : p)),
      );
      showModal("info", "Status Diperbarui", `${printerName} sekarang ${data.status}`);
    } catch {
      showModal("alert", "Error", "Gagal sinkronisasi status printer");
    }
  };

  const handleToggleDummy = () => {
    showModal(
      "confirm",
      "Test Mode",
      "Enable Dummy Printer (Online)?\nKlik Cancel untuk Disable (Offline).",
      async () => {
        try {
          await adminApi.post(`${getApiUrl()}/api/admin/dummy-printer`, { action: "add" });
          fetchPrinters();
          showModal("info", "Berhasil", "Dummy Printer sekarang Online.");
        } catch {
          showModal("alert", "Error", "Gagal toggle dummy printer");
        }
      },
      async () => {
        try {
          await adminApi.post(`${getApiUrl()}/api/admin/dummy-printer`, { action: "remove" });
          fetchPrinters();
          showModal("info", "Berhasil", "Dummy Printer sekarang Offline.");
        } catch {
          showModal("alert", "Error", "Gagal toggle dummy printer");
        }
      },
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-black mb-1">Manage Printer</h2>
          <p className="text-gray-600 text-sm">
            Konfigurasi dan kelola printer kiosk Anda.
          </p>
        </div>
        <div className="flex gap-3 mt-1">
          <button
            onClick={handleToggleDummy}
            className="bg-white border text-black border-black px-5 py-2 rounded-full font-bold hover:bg-gray-50 transition text-sm flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Test Mode
          </button>
          <button
            onClick={openAddPrinterModal}
            className="bg-white border text-black border-black px-5 py-2 rounded-full font-bold hover:bg-gray-50 transition text-sm flex items-center gap-2"
          >
            <span>+</span> Add Printer
          </button>
        </div>
      </div>

      {showAddPrinter && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-black mb-6">
          <h3 className="font-bold text-lg mb-4 text-black">Tambah Printer Baru</h3>
          <div className="flex flex-col gap-4">
            {loadingPrinters ? (
              <p className="text-gray-500 animate-pulse text-sm">
                Scanning printers...
              </p>
            ) : (
              <div className="flex gap-4">
                <select
                  value={selectedOsPrinter}
                  onChange={(e) => setSelectedOsPrinter(e.target.value)}
                  className="flex-1 border border-black rounded-lg px-4 py-2 outline-none font-medium bg-white text-black"
                >
                  {osPrinters.length === 0 && (
                    <option value="">No printers found</option>
                  )}
                  {osPrinters.map((p) => (
                    <option key={p.Name} value={p.Name}>
                      {p.Name} ({p.DriverName})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddPrinter}
                  disabled={!selectedOsPrinter}
                  className="bg-white text-black border border-black px-6 py-2 rounded-full font-bold hover:bg-gray-50 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddPrinter(false)}
                  className="bg-white text-black border border-black px-6 py-2 rounded-full font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500">
              * Scanning dari Server OS (Windows)
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-sm border border-black">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {printers.map((printer: Printer) => (
            <div
              key={printer.id}
              className="bg-white p-5 rounded-xl border border-black relative group"
            >
              <button
                onClick={() => handleDeletePrinter(printer.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition"
                title="Remove Printer"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
              <div className="flex justify-between items-start mb-6 pr-8">
                <div>
                  <h3 className="text-lg font-bold text-black mb-1">
                    {printer.name}
                  </h3>
                  <p className="text-xs text-gray-600">ID: {printer.id}</p>
                </div>
                <span className="px-4 py-1 rounded-full text-xs font-bold border border-black text-black bg-white">
                  {printer.status}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleTestPrint(printer.id, printer.name)}
                  className="flex-1 bg-white border border-black text-black py-2 rounded-full text-sm font-bold hover:bg-gray-50 transition"
                >
                  Test Printer
                </button>
                <button
                  onClick={() => handleSyncStatus(printer.id, printer.name)}
                  className="flex-1 bg-white border border-black text-black py-2 rounded-full text-sm font-bold hover:bg-gray-50 transition"
                >
                  Sync Status
                </button>
              </div>
            </div>
          ))}
          {printers.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 font-medium">
                Belum ada printer ditambahkan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
