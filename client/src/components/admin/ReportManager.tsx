import axios from "axios";
import OverviewCards from "./OverviewCards";
import type { Report } from "@/types/admin";

export default function ReportManager({
  adminData,
  showModal,
}: {
  adminData: any;
  showModal: any;
}) {
  const {
    reports,
    setReports,
    summary,
    loadingReports,
    fetchReports,
    filterFrom,
    setFilterFrom,
    filterTo,
    setFilterTo,
  } = adminData;

  const handleDeleteReport = (id: string) => {
    showModal(
      "confirm",
      "Hapus Laporan",
      "Yakin ingin menghapus rekaman transaksi ini? Tindakan ini tidak bisa dibatalkan.",
      async () => {
        try {
          await axios.delete(`/api/admin/reports/${id}`);
          setReports((prev: Report[]) => prev.filter((r) => r.id !== id));
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
    const rows = reports.map((r: Report) => [
      r.date,
      r.filename,
      r.pages,
      r.copies,
      r.amount,
      r.status,
    ]);
    const csv = [headers, ...rows]
      .map((row: any[]) => row.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oneprint-laporan-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold text-black mb-1">Manage Laporan</h2>
          <p className="text-gray-600 text-sm">
            Kelola Laporan Transaksi E-Print Anda.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={reports.length === 0}
          className="bg-white text-black border border-black px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition disabled:opacity-40"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="8 17 12 21 16 17"></polyline>
            <line x1="12" y1="12" x2="12" y2="21"></line>
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path>
          </svg>
          Export CSV
        </button>
      </div>

      <OverviewCards summary={summary} />

      <div className="bg-white rounded-xl shadow-sm border border-black p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-lg font-bold text-black mb-1">
              Data Transaksi
            </h3>
            <p className="text-xs text-gray-500">
              Semua Data Transaksi pada Sistem E-Print
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">
                Dari Tanggal
              </label>
              <div className="flex items-center border border-black rounded-full px-4 h-9 bg-white text-sm">
                <input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="outline-none bg-transparent text-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">
                Sampai Tanggal
              </label>
              <div className="flex items-center border border-black rounded-full px-4 h-9 bg-white text-sm">
                <input
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="outline-none bg-transparent text-black"
                />
              </div>
            </div>
            <button
              onClick={fetchReports}
              className="bg-white border border-black text-black px-6 h-9 rounded-full font-bold text-sm hover:bg-gray-50 transition"
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
                className="bg-white text-gray-600 border border-transparent px-4 h-9 rounded-full font-bold text-sm hover:bg-gray-100 transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="w-full">
          {loadingReports ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto mb-3"></div>
              <p className="text-gray-500 font-medium">Memuat data...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 font-medium">Belum ada transaksi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-black text-black">
                    <th className="py-4 font-bold px-2">No.</th>
                    <th className="py-4 font-bold px-2">Tanggal</th>
                    <th className="py-4 font-bold px-2">Pemesan</th>
                    <th className="py-4 font-bold px-2">File</th>
                    <th className="py-4 font-bold px-2">Hal</th>
                    <th className="py-4 font-bold px-2">Copies</th>
                    <th className="py-4 font-bold px-2">Total</th>
                    <th className="py-4 font-bold px-2">Status</th>
                    <th className="py-4 font-bold px-2">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((report: Report, index: number) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-2 text-black font-medium">
                        {index + 1}.
                      </td>
                      <td className="py-4 px-2 text-gray-600 text-xs">
                        {report.date}
                      </td>
                      <td className="py-4 px-2 text-black">-</td>
                      <td className="py-4 px-2 text-black font-medium max-w-[200px] truncate">
                        {report.filename}
                      </td>
                      <td className="py-4 px-2 text-gray-600">
                        {report.pages}
                      </td>
                      <td className="py-4 px-2 text-gray-600">
                        {report.copies}
                      </td>
                      <td className="py-4 px-2 font-bold text-black">
                        Rp {report.amount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-4 px-2">
                        <span className="border border-black bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold">
                          {report.status}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="text-gray-400 hover:text-black transition"
                          title="Hapus laporan"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
