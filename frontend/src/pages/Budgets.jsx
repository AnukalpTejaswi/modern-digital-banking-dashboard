import BudgetsSection from "../components/BudgetsSection";
import { useDate } from "../context/DateContext";
import { Calendar } from "lucide-react";

const MONTHS = [
  "January","February","March","April",
  "May","June","July","August",
  "September","October","November","December",
];

function Budgets() {
  const { selectedMonth, setSelectedMonth, selectedYear, setSelectedYear } = useDate();

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── PAGE HEADER ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
          >
            Budgets
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
          >
            {MONTHS[selectedMonth - 1]} {selectedYear} spending limits
          </p>
        </div>

        {/* Date picker pill */}
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

      {/* ── CONTENT ───────────────────────────────────────────────────── */}
      <BudgetsSection />
    </div>
  );
}

export default Budgets;
