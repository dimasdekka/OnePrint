export type Printer = {
  id: string;
  name: string;
  status: "Online" | "Offline" | "Paper Jam";
  jobs: number;
};

export type Report = {
  id: string;
  date: string;
  filename: string;
  pages: number;
  copies: number;
  amount: number;
  status: "Success" | "Failed";
};

export type Summary = {
  totalRevenue: number;
  totalTransactions: number;
  totalPages: number;
  avgRevenue: number;
  dailyRevenue: { date: string; revenue: number; count: number }[];
};
