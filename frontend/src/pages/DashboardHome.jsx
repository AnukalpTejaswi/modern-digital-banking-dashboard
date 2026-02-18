import { useEffect, useState } from "react";
import { getDashboard, exportInsightsPDF, exportInsightsCSV } from "../api";
import { showError } from "../utils/toast";
import { useDate } from "../context/DateContext";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  FileSpreadsheet,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTHS_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

// ─── Color palette for categories ────────────────────────────────────────────
const CATEGORY_COLORS = [
  "#6366f1","#8b5cf6","#a78bfa","#c4b5fd","#e0d9ff",
];

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmt = (n) => {
  const num = Number(n);
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
};

const fmtFull = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-4 py-3 rounded-xl text-sm shadow-xl"
      style={{
        background: "var(--tooltip-bg)",
        border: "1px solid var(--border)",
        fontFamily: "'DM Sans', sans-serif",
        color: "var(--text-primary)",
      }}
    >
      <p className="font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmtFull(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
function DashboardHome() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { selectedMonth, setSelectedMonth, selectedYear, setSelectedYear } = useDate();

  const handleExportPDF = async () => {
    try {
      const res = await exportInsightsPDF(selectedMonth, selectedYear);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Insights_${MONTHS[selectedMonth-1]}_${selectedYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      showError("PDF export failed");
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await exportInsightsCSV(selectedMonth, selectedYear);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Insights_${MONTHS[selectedMonth-1]}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      showError("CSV export failed");
    }
  };

  useEffect(() => {
    setLoading(true);
    getDashboard(selectedMonth, selectedYear)
      .then((res) => setDashboardData(res.data))
      .catch(() => showError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [selectedMonth, selectedYear]);
  
  if (loading) return <DashboardSkeleton />;
  if (!dashboardData) return null;

  const insights = dashboardData.insights || {};
  const categorySummary = insights.category_summary || [];
  const topMerchants = insights.top_merchants || [];
  const totalCategorySpend = categorySummary.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in">

      {/* ══ PAGE TITLE + ACTIONS ══════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
          >
            Dashboard
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
            {MONTHS[selectedMonth - 1]} {selectedYear} overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontFamily: "'DM Sans', sans-serif",
              }}
              title="Export as PDF"
            >
              <FileText size={14} />
              PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontFamily: "'DM Sans', sans-serif",
              }}
              title="Export as CSV"
            >
              <FileSpreadsheet size={14} />
              CSV
            </button>
          </div>

          {/* Date picker */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-2xl"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
          >
            <Calendar size={15} style={{ color: "var(--accent)" }} />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-sm font-medium bg-transparent border-none outline-none cursor-pointer"
              style={{ color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <span style={{ color: "var(--border)" }}>|</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-sm font-medium bg-transparent border-none outline-none cursor-pointer"
              style={{ color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ══ SUMMARY CARDS ═════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <SummaryCard
          title="Total Balance"
          value={fmtFull(dashboardData.summary.total_balance)}
          sub="All accounts"
          icon={Wallet}
          type="balance"
          delay={0}
        />
        <SummaryCard
          title="Income"
          value={fmtFull(dashboardData.summary.total_income)}
          sub="This month"
          icon={TrendingUp}
          type="income"
          delay={60}
          positive
        />
        <SummaryCard
          title="Expenses"
          value={fmtFull(dashboardData.summary.total_expenses)}
          sub="This month"
          icon={TrendingDown}
          type="expense"
          delay={120}
          positive={false}
        />
        <SummaryCard
          title="Net Flow"
          value={fmtFull(dashboardData.summary.net_flow)}
          sub="Income − Expenses"
          icon={Activity}
          type="net"
          delay={180}
          positive={Number(dashboardData.summary.net_flow) >= 0}
        />
      </div>

      {/* ══ CHARTS ROW ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Yearly trend (2/3 width) */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                className="font-semibold text-base"
                style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
              >
                Cash Flow {selectedYear}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
                Monthly income vs spending
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={insights.yearly_trend || []}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmt(v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Income"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#incomeGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#6366f1" }}
              />
              <Area
                type="monotone"
                dataKey="Spending"
                stroke="#a78bfa"
                strokeWidth={2}
                fill="url(#spendGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#a78bfa" }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px", fontFamily: "'DM Sans', sans-serif", paddingTop: "12px" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top categories (1/3 width) */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3
              className="font-semibold text-base"
              style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
            >
              Top Spending
            </h3>
            <span
              className="text-xs px-2 py-1 rounded-lg"
              style={{ background: "var(--accent-light)", color: "var(--accent)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {MONTHS_SHORT[selectedMonth - 1]}
            </span>
          </div>

          {categorySummary.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
              No spending data yet.
            </p>
          ) : (
            <div className="space-y-4">
              {categorySummary.map((item, i) => {
                const pct = totalCategorySpend
                  ? ((item.amount / totalCategorySpend) * 100).toFixed(1)
                  : 0;

                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: CATEGORY_COLORS[i] }}
                        />
                        <span
                          className="text-sm font-medium truncate max-w-[120px]"
                          style={{ color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {fmt(item.amount)}
                        </span>
                        <span
                          className="text-xs ml-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-base)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: CATEGORY_COLORS[i],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ BOTTOM ROW ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Budget vs Spending (3/5) */}
        <div
          className="lg:col-span-3 rounded-2xl p-6"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                className="font-semibold text-base"
                style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
              >
                Budget vs Spending
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
          </div>

          {(insights.budget_vs_spending || []).length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
              No budgets set for this month.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={insights.budget_vs_spending || []}
                barCategoryGap="30%"
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => fmt(v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px", fontFamily: "'DM Sans', sans-serif", paddingTop: "8px" }}
                />
                <Bar dataKey="Budget" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Spent" fill="#e0d9ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Merchants (2/5) */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3
              className="font-semibold text-base"
              style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
            >
              Top Merchants
            </h3>
            <span
              className="text-xs px-2 py-1 rounded-lg"
              style={{ background: "var(--accent-light)", color: "var(--accent)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {MONTHS_SHORT[selectedMonth - 1]}
            </span>
          </div>

          {topMerchants.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
              No merchant data this month.
            </p>
          ) : (
            <div className="space-y-3">
              {topMerchants.map((merchant, i) => {
                const totalMerchantSpend = topMerchants.reduce(
                  (s, m) => s + Number(m.amount || 0),
                  0
                );
                const pct = totalMerchantSpend > 0
                  ? Math.round((merchant.amount / totalMerchantSpend) * 100)
                  : 0;
                const colors = ["#6366f1","#8b5cf6","#a78bfa","#06b6d4","#22c55e","#f59e0b"];

                return (
                  <div key={merchant.name}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: colors[i % colors.length] }}
                      >
                        {(merchant.name || "NA").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-sm font-medium truncate max-w-[110px]"
                            style={{ color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {merchant.name}
                          </span>
                          <span
                            className="text-sm font-semibold flex-shrink-0"
                            style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
                          >
                            {fmt(merchant.amount)}
                          </span>
                        </div>
                        <div
                          className="mt-1 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--bg-base)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ title, value, sub, icon: Icon, type, delay = 0, positive }) {
  const configs = {
    balance: {
      iconBg: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      accent: "#6366f1",
      glow: "rgba(99,102,241,0.15)",
    },
    income: {
      iconBg: "linear-gradient(135deg, #22c55e, #16a34a)",
      accent: "#22c55e",
      glow: "rgba(34,197,94,0.12)",
    },
    expense: {
      iconBg: "linear-gradient(135deg, #ef4444, #dc2626)",
      accent: "#ef4444",
      glow: "rgba(239,68,68,0.12)",
    },
    net: {
      iconBg:
        positive === false
          ? "linear-gradient(135deg, #ef4444, #dc2626)"
          : "linear-gradient(135deg, #6366f1, #8b5cf6)",
      accent: positive === false ? "#ef4444" : "#6366f1",
      glow:
        positive === false
          ? "rgba(239,68,68,0.12)"
          : "rgba(99,102,241,0.15)",
    },
  };

  const c = configs[type] || configs.balance;

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        boxShadow: `var(--card-shadow), 0 0 0 0 ${c.glow}`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: c.iconBg }}
        >
          <Icon size={18} color="white" />
        </div>
        {positive !== undefined && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1"
            style={{
              background: positive ? "var(--income-light)" : "var(--expense-light)",
              color: positive ? "#22c55e" : "#ef4444",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {type === "income" ? "Inflow" : type === "expense" ? "Outflow" : positive ? "Positive" : "Negative"}
          </span>
        )}
      </div>

      <p
        className="text-xs font-medium uppercase tracking-wider mb-1"
        style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
      >
        {title}
      </p>
      <p
        className="text-2xl font-bold tracking-tight"
        style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
      >
        {value}
      </p>
      <p
        className="text-xs mt-1"
        style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
      >
        {sub}
      </p>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 rounded-xl" style={{ background: "var(--border)" }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-36 rounded-2xl"
            style={{ background: "var(--border)" }}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 rounded-2xl" style={{ background: "var(--border)" }} />
        <div className="h-72 rounded-2xl" style={{ background: "var(--border)" }} />
      </div>
    </div>
  );
}

export default DashboardHome;
