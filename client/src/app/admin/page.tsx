"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import axios from "axios";

// Configure axios globally to include credentials (cookies) in requests
axios.defaults.withCredentials = true;

import Modal from "@/components/Modal";

// Types
type Printer = {
  id: string;
  name: string;
  status: "Online" | "Offline" | "Paper Jam";
  jobs: number;
};

type Report = {
  id: string;
  date: string;
  filename: string;
  pages: number;
  copies: number;
  amount: number;
  status: "Success" | "Failed";
};

type Summary = {
  totalRevenue: number;
  totalTransactions: number;
  totalPages: number;
  avgRevenue: number;
  dailyRevenue: { date: string; revenue: number; count: number }[];
};

// ── Small helper components ────────────────────────────

const StatCard = ({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4`}
  >
    <div
      className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${color}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const BarChart = ({
  data,
}: {
  data: { date: string; revenue: number; count: number }[];
}) => {
  const maxVal = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-bold text-gray-700 mb-4">
        📊 Revenue 7 Hari Terakhir
      </h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400 font-medium">
              {d.revenue > 0 ? `Rp${(d.revenue / 1000).toFixed(0)}k` : ""}
            </span>
            <div
              className="w-full rounded-t-md bg-indigo-500 hover:bg-indigo-600 transition-all"
              style={{
                height: `${Math.max((d.revenue / maxVal) * 120, d.revenue > 0 ? 4 : 1)}px`,
                opacity: d.revenue > 0 ? 1 : 0.2,
              }}
              title={`${d.date}: Rp${d.revenue.toLocaleString("id-ID")} (${d.count} transaksi)`}
            />
            <span className="text-[9px] text-gray-400 text-center leading-tight">
              {d.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "printers" | "reports" | "settings"
  >("printers");

  // Printers
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [osPrinters, setOsPrinters] = useState<any[]>([]);
  const [selectedOsPrinter, setSelectedOsPrinter] = useState("");
  const [loadingPrinters, setLoadingPrinters] = useState(false);

  // Reports
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Settings
  const [priceBw, setPriceBw] = useState(1500);
  const [priceColor, setPriceColor] = useState(3000);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Modal
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "confirm" | "alert" | "info";
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const closeModal = () =>
    setModalConfig((prev) => ({ ...prev, isOpen: false }));

  const showModal = (
    type: "confirm" | "alert" | "info",
    title: string,
    message: string,
    onConfirm?: () => void | Promise<void>,
    onCancel?: () => void | Promise<void>,
  ) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: async () => {
        if (onConfirm) await Promise.resolve(onConfirm());
        closeModal();
      },
      onCancel: async () => {
        if (onCancel) await Promise.resolve(onCancel());
        closeModal();
      },
    });
  };

  const getApiUrl = () => {
    const proto = window.location.protocol;
    const host = window.location.hostname;
    return `${proto}//${host}:3001`;
  };

  const fetchPrinters = useCallback(async () => {
    try {
      const { data } = await axios.get(`${getApiUrl()}/api/admin/printers`);
      setPrinters(data);
    } catch (e) {
      console.error("Failed to fetch printers", e);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const params = new URLSearchParams();
      if (filterFrom) params.append("from", filterFrom);
      if (filterTo) params.append("to", filterTo);

      const [repRes, sumRes] = await Promise.all([
        axios.get(`${getApiUrl()}/api/admin/reports?${params}`),
        axios.get(`${getApiUrl()}/api/admin/reports/summary`),
      ]);

      setReports(repRes.data);
      setSummary(sumRes.data);
    } catch (e) {
      console.error("Failed to fetch reports", e);
    } finally {
      setLoadingReports(false);
    }
  }, [filterFrom, filterTo]);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await axios.get(`${getApiUrl()}/api/admin/settings`);
      if (data) {
        setPriceBw(data.pricePerPageBw || 1500);
        setPriceColor(data.pricePerPageColor || 3000);
      }
    } catch (e) {
      console.error("Failed to fetch settings", e);
    }
  }, []);

  const handleSaveSettings = async () => {
    setLoadingSettings(true);
    try {
      await axios.post(`${getApiUrl()}/api/admin/settings`, {
        pricePerPageBw: priceBw,
        pricePerPageColor: priceColor,
      });
      showModal("info", "Berhasil", "Pengaturan harga berhasil disimpan!");
    } catch (e) {
      showModal("alert", "Error", "Gagal menyimpan pengaturan.");
      console.error(e);
    } finally {
      setLoadingSettings(false);
    }
  };

  const setupSocket = useCallback(() => {
    const socket = io(`${getApiUrl()}`);

    socket.on("admin_job_update", (job: any) => {
      setPrinters((prev) =>
        prev.map((p) =>
          p.name === job.printerName ? { ...p, jobs: p.jobs + 1 } : p,
        ),
      );
      const newReport: Report = {
        id: job.id,
        date:
          new Date().toLocaleDateString("id-ID") +
          " " +
          new Date().toLocaleTimeString("id-ID"),
        filename: job.fileName,
        pages: job.pages,
        copies: 1,
        amount: job.pages * 1500,
        status: "Success",
      };
      setReports((prev) => [newReport, ...prev]);
    });

    // Auto-refresh printer list when server monitor detects a status change
    socket.on("printer_update", () => {
      fetchPrinters();
    });

    return () => socket.disconnect();
  }, [fetchPrinters]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${getApiUrl()}/api/auth/me`);
        setIsAuthorized(true);
        fetchPrinters();
        fetchReports();
        fetchSettings();
      } catch (err) {
        router.push("/admin/login");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    const cleanup = setupSocket();
    const syncInterval = setInterval(fetchPrinters, 30000);

    return () => {
      clearInterval(syncInterval);
      cleanup();
    };
  }, []);

  // Re-fetch reports when tab changes to reports
  useEffect(() => {
    if (activeTab === "reports" && isAuthorized) {
      fetchReports();
    }
  }, [activeTab]);

  // ── Printer Handlers ──

  const openAddPrinterModal = async () => {
    setShowAddPrinter(true);
    setLoadingPrinters(true);
    try {
      const { data } = await axios.get(`${getApiUrl()}/api/system/printers`);
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
      await axios.post(`${getApiUrl()}/api/admin/printers`, {
        name: printerData.Name,
        driver: printerData.DriverName,
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
          await axios.delete(`${getApiUrl()}/api/admin/printers/${id}`);
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
          await axios.post(
            `${getApiUrl()}/api/admin/printers/${id}/test-print`,
          );
          showModal(
            "info",
            "Berhasil",
            "Test print terkirim! Cek printer Anda.",
          );
        } catch {
          showModal("alert", "Error", "Gagal mengirim test print");
        }
      },
    );
  };

  const handleSyncStatus = async (id: string, printerName: string) => {
    try {
      const { data } = await axios.post(
        `${getApiUrl()}/api/admin/printers/${id}/sync-status`,
      );
      setPrinters((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: data.status } : p)),
      );
      showModal(
        "info",
        "Status Diperbarui",
        `${printerName} sekarang ${data.status}`,
      );
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
          await axios.post(`${getApiUrl()}/api/admin/dummy-printer`, {
            action: "add",
          });
          fetchPrinters();
          showModal("info", "Berhasil", "Dummy Printer sekarang Online.");
        } catch {
          showModal("alert", "Error", "Gagal toggle dummy printer");
        }
      },
      async () => {
        try {
          await axios.post(`${getApiUrl()}/api/admin/dummy-printer`, {
            action: "remove",
          });
          fetchPrinters();
          showModal("info", "Berhasil", "Dummy Printer sekarang Offline.");
        } catch {
          showModal("alert", "Error", "Gagal toggle dummy printer");
        }
      },
    );
  };

  // ── Report Handlers ──

  const handleDeleteReport = (id: string) => {
    showModal(
      "confirm",
      "Hapus Laporan",
      "Yakin ingin menghapus rekaman transaksi ini? Tindakan ini tidak bisa dibatalkan.",
      async () => {
        try {
          await axios.delete(`${getApiUrl()}/api/admin/reports/${id}`);
          setReports((prev) => prev.filter((r) => r.id !== id));
          fetchReports();
          showModal("info", "Berhasil", "Laporan berhasil dihapus.");
        } catch {
          showModal("alert", "Error", "Gagal menghapus laporan");
        }
      },
    );
  };

  const handleExportCSV = () => {
    if (reports.length === 0) return;
    const headers = [
      "Tanggal",
      "File",
      "Halaman",
      "Copies",
      "Total (Rp)",
      "Status",
    ];
    const rows = reports.map((r) => [
      r.date,
      r.filename,
      r.pages,
      r.copies,
      r.amount,
      r.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oneprint-laporan-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  // ── Tab Content ──

  const renderPrinters = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Printer Management</h2>
        <div className="flex gap-2">
          <button
            onClick={handleToggleDummy}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 transition text-sm"
          >
            ⚙️ Test Mode
          </button>
          <button
            onClick={openAddPrinterModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition text-sm flex items-center gap-2"
          >
            + Add Printer
          </button>
        </div>
      </div>

      {showAddPrinter && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 mb-6">
          <h3 className="font-bold text-lg mb-4">Tambah Printer Baru</h3>
          <div className="flex flex-col gap-4">
            {loadingPrinters ? (
              <p className="text-gray-500 animate-pulse">
                Scanning printers...
              </p>
            ) : (
              <div className="flex gap-4">
                <select
                  value={selectedOsPrinter}
                  onChange={(e) => setSelectedOsPrinter(e.target.value)}
                  className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-2 outline-none focus:border-blue-500 font-medium bg-white text-gray-900"
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
                  className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddPrinter(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl font-bold hover:bg-gray-300"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {printers.map((printer) => (
          <div
            key={printer.id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group"
          >
            <button
              onClick={() => handleDeletePrinter(printer.id)}
              className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
              title="Remove Printer"
            >
              🗑️
            </button>
            <div className="flex justify-between items-start mb-4 pr-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {printer.name}
                </h3>
                <p className="text-xs text-gray-400">ID: {printer.id}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  printer.status === "Online"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {printer.status}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleTestPrint(printer.id, printer.name)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition"
              >
                Test Print
              </button>
              <button
                onClick={() => handleSyncStatus(printer.id, printer.name)}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition"
              >
                ↻ Sync Status
              </button>
            </div>
          </div>
        ))}
        {printers.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">
              Belum ada printer ditambahkan.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Laporan Transaksi</h2>
        <button
          onClick={handleExportCSV}
          disabled={reports.length === 0}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-40"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="💰"
            label="Total Revenue"
            value={`Rp ${summary.totalRevenue.toLocaleString("id-ID")}`}
            color="bg-indigo-50"
          />
          <StatCard
            icon="🧾"
            label="Total Transaksi"
            value={summary.totalTransactions.toString()}
            sub="Transaksi berhasil"
            color="bg-blue-50"
          />
          <StatCard
            icon="📄"
            label="Total Halaman"
            value={summary.totalPages.toLocaleString("id-ID")}
            sub="Halaman dicetak"
            color="bg-violet-50"
          />
          <StatCard
            icon="📈"
            label="Rata-rata/Transaksi"
            value={`Rp ${summary.avgRevenue.toLocaleString("id-ID")}`}
            color="bg-emerald-50"
          />
        </div>
      )}

      {/* Bar Chart */}
      {summary && <BarChart data={summary.dailyRevenue} />}

      {/* Date Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 text-gray-900"
            />
          </div>
          <button
            onClick={fetchReports}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition"
          >
            Filter
          </button>
          {(filterFrom || filterTo) && (
            <button
              onClick={() => {
                setFilterFrom("");
                setFilterTo("");
                setTimeout(fetchReports, 50);
              }}
              className="text-gray-500 px-4 py-2 rounded-xl font-bold text-sm border border-gray-200 hover:bg-gray-50 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loadingReports ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-600 mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">Memuat data...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-400 font-medium">Belum ada transaksi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4 font-bold text-gray-600">Tanggal</th>
                  <th className="px-5 py-4 font-bold text-gray-600">File</th>
                  <th className="px-5 py-4 font-bold text-gray-600">Hal.</th>
                  <th className="px-5 py-4 font-bold text-gray-600">Copies</th>
                  <th className="px-5 py-4 font-bold text-gray-600">Total</th>
                  <th className="px-5 py-4 font-bold text-gray-600">Status</th>
                  <th className="px-5 py-4 font-bold text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {report.date}
                    </td>
                    <td className="px-5 py-4 text-gray-700 max-w-[200px] truncate">
                      {report.filename}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{report.pages}</td>
                    <td className="px-5 py-4 text-gray-600">{report.copies}</td>
                    <td className="px-5 py-4 font-bold text-indigo-600">
                      Rp {report.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">
                        {report.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-red-400 hover:text-red-600 transition"
                        title="Hapus laporan"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Harga per Halaman (Hitam Putih)
          </label>
          <div className="flex">
            <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl px-4 flex items-center font-bold text-gray-500">
              Rp
            </span>
            <input
              type="number"
              value={priceBw}
              onChange={(e) => setPriceBw(Number(e.target.value))}
              className="flex-1 border border-gray-300 rounded-r-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-indigo-200 text-gray-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Harga per Halaman (Berwarna)
          </label>
          <div className="flex">
            <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl px-4 flex items-center font-bold text-gray-500">
              Rp
            </span>
            <input
              type="number"
              value={priceColor}
              onChange={(e) => setPriceColor(Number(e.target.value))}
              className="flex-1 border border-gray-300 rounded-r-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-indigo-200 text-gray-900"
            />
          </div>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={loadingSettings}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loadingSettings ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </div>
  );

  const navItems = [
    { key: "printers", icon: "🖨️", label: "Printer Manager" },
    { key: "reports", icon: "📊", label: "Laporan" },
    { key: "settings", icon: "⚙️", label: "Settings" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm z-10 flex flex-col fixed h-full border-r border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-extrabold text-indigo-900">
            OnePrint <span className="text-indigo-500 font-light">Admin</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full text-left px-4 py-3 font-semibold rounded-xl transition-colors flex items-center gap-3 ${
                activeTab === key
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => {
              localStorage.removeItem("admin_auth");
              router.push("/admin/login");
            }}
            className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 font-semibold rounded-xl transition-colors flex items-center gap-3"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 ml-64 overflow-y-auto min-h-screen">
        {activeTab === "printers" && renderPrinters()}
        {activeTab === "reports" && renderReports()}
        {activeTab === "settings" && renderSettings()}
      </main>

      <Modal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />
    </div>
  );
}
