import type { Summary } from "@/types/admin";

export const StatCard = ({
  icon,
  label,
  value,
  sub,
}: {
  icon: string | React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-black p-6 flex items-center gap-4">
    <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center text-black bg-white flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-black">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  </div>
);

export const BarChart = ({
  data,
}: {
  data: { date: string; revenue: number; count: number }[];
}) => {
  const maxVal = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-black p-8">
      <h3 className="text-lg font-bold text-black mb-10">
        Revenue 7 Hari Terakhir
      </h3>
      <div className="flex items-end gap-4 h-48 border-b border-black pb-0 relative">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-2 h-full justify-end relative"
          >
            <div
              className="w-full max-w-[80px] border border-black bg-white hover:bg-gray-50 transition-all border-b-0"
              style={{
                height: `${Math.max((d.revenue / maxVal) * 100, d.revenue > 0 ? 5 : 0)}%`,
                opacity: d.revenue > 0 ? 1 : 0,
              }}
              title={`${d.date}: Rp${d.revenue.toLocaleString("id-ID")} (${d.count} transaksi)`}
            />
            <span className="text-[10px] text-gray-600 text-center leading-tight absolute -bottom-6 w-full whitespace-nowrap overflow-hidden text-ellipsis">
              {d.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function OverviewCards({ summary }: { summary: Summary }) {
  if (!summary) return null;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          }
          label="Total Revenue"
          value={`Rp ${(summary.totalRevenue / 1000).toLocaleString("id-ID")}k`}
        />
        <StatCard
          icon={
            <svg
              width="24"
              height="24"
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
          }
          label="Total Transaksi"
          value={summary.totalTransactions.toString()}
        />
        <StatCard
          icon={
            <svg
              width="24"
              height="24"
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
          }
          label="Total Halaman"
          value={summary.totalPages.toLocaleString("id-ID")}
        />
        <StatCard
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          }
          label="Rata-rata/Transaksi"
          value={`Rp ${(summary.avgRevenue / 1000).toLocaleString("id-ID")}k`}
        />
      </div>
      <BarChart data={summary.dailyRevenue} />
    </>
  );
}
