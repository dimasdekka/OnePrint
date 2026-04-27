"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminActions } from "@/hooks/admin/useAdminData";
import { useAdminStore } from "@/store/adminStore";
import PrinterManager from "@/components/admin/PrinterManager";
import ReportManager from "@/components/admin/ReportManager";
import SettingsManager from "@/components/admin/SettingsManager";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalConfig = {
  isOpen: boolean;
  type: "confirm" | "alert" | "info";
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();

  // Boot admin data fetch + socket setup — only called ONCE in page
  const { fetchPrinters, fetchReports } = useAdminActions();

  const { isAuthorized, authLoading } = useAdminStore();
  const [activeTab, setActiveTab] = useState<"printers" | "reports">("printers");

  // ── Modal state ────────────────────────────────────────────────────────────

  const [modalConfig, setModalConfig] = useState<ModalConfig>({
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

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  // ── Nav items ──────────────────────────────────────────────────────────────

  const navItems = [
    {
      key: "printers",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
      ),
      label: "Manage Printer",
    },
    {
      key: "reports",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ),
      label: "Manage Laporan",
    },
  ] as const;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-black">
      {/* Sidebar */}
      <aside className="w-72 bg-white z-10 flex flex-col fixed h-full border-r border-black">
        <div className="p-8 pb-10">
          <h1 className="text-xl font-bold tracking-tight text-black">
            E-Print Service
          </h1>
          <p className="text-sm text-gray-600">Universitas Pamulang Serang</p>
        </div>
        <nav className="flex-1 px-6 space-y-4">
          {navItems.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full text-left px-6 py-3 font-bold rounded-full transition-colors flex items-center gap-4 ${
                activeTab === key
                  ? "border border-black bg-white text-black shadow-sm"
                  : "text-gray-600 hover:text-black hover:bg-gray-50"
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="p-6">
          <button
            onClick={() => {
              localStorage.removeItem("admin_auth");
              router.push("/admin/login");
            }}
            className="w-full text-left px-6 py-3 font-bold rounded-full transition-colors flex items-center gap-4 border border-black hover:bg-gray-100 text-black"
          >
            <span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            LogOut
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 ml-72 overflow-y-auto min-h-screen">
        <div className="max-w-[1200px]">
          {activeTab === "printers" && (
            <>
              <PrinterManager showModal={showModal} fetchPrinters={fetchPrinters} />
              <SettingsManager showModal={showModal} />
            </>
          )}
          {activeTab === "reports" && (
            <ReportManager showModal={showModal} fetchReports={fetchReports} />
          )}
        </div>
      </main>

      {/* Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-black shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border border-black mb-4 mx-auto">
                <span className="font-bold text-xl">!</span>
              </div>
              <h3 className="text-xl font-bold text-black text-center mb-2">
                {modalConfig.title}
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6 whitespace-pre-wrap">
                {modalConfig.message}
              </p>

              <div className="flex gap-3 mt-2">
                {modalConfig.type === "confirm" && (
                  <button
                    onClick={modalConfig.onCancel}
                    className="flex-1 border border-black bg-white text-black py-3 rounded-full font-bold text-sm hover:bg-gray-50 transition"
                  >
                    Batal
                  </button>
                )}
                <button
                  onClick={modalConfig.onConfirm}
                  className="flex-1 bg-white border border-black text-black py-3 rounded-full font-bold text-sm hover:bg-gray-50 transition"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
