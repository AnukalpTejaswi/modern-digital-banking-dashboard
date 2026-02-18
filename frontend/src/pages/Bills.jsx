import { useEffect, useState } from "react";
import { getBills, updateBill, deleteBill } from "../api";
import { showError, showSuccess, showConfirm } from "../utils/toast";
import AddBillModal from "../components/AddBillModal";
import {
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  CheckCheck,
  Receipt,
  TrendingDown,
} from "lucide-react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const fmt = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const STATUS_CONFIG = {
  paid:     { label: "Paid",     icon: CheckCircle2,  color: "#22c55e", bg: "#dcfce7", border: "#bbf7d0" },
  overdue:  { label: "Overdue",  icon: AlertTriangle, color: "#ef4444", bg: "#fee2e2", border: "#fecaca" },
  upcoming: { label: "Upcoming", icon: Clock,         color: "#f59e0b", bg: "#fef9c3", border: "#fde68a" },
};

// ─────────────────────────────────────────────────────────────────────────────
function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("upcoming");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadBills = async () => {
    try {
      const res = await getBills();
      setBills(res.data);
    } catch {
      showError("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBills(); }, []);

  const handleMarkPaid = async (billId) => {
    try {
      setActionLoadingId(billId);
      await updateBill(billId, { status: "paid" });
      showSuccess("Bill marked as paid");
      await loadBills();
    } catch {
      showError("Failed to update bill");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteBill = (billId) => {
    showConfirm("Delete this bill permanently?", async () => {
      try {
        setActionLoadingId(billId);
        await deleteBill(billId);
        showSuccess("Bill deleted");
        await loadBills();
      } catch {
        showError("Failed to delete bill");
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  // ── Filtered bills ───────────────────────────────────────────────────────
  const filteredBills = bills.filter((bill) => {
    const d = new Date(bill.due_date);
    const sameMonth =
      d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    if (!sameMonth) return false;
    if (activeFilter === "all") return true;
    return bill.status === activeFilter;
  });

  // ── Stats ────────────────────────────────────────────────────────────────
  const monthBills = bills.filter((bill) => {
    const d = new Date(bill.due_date);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  const stats = {
    total:   monthBills.reduce((s, b) => s + Number(b.amount_due), 0),
    paid:    monthBills.filter((b) => b.status === "paid").reduce((s, b) => s + Number(b.amount_due), 0),
    overdue: monthBills.filter((b) => b.status === "overdue").length,
    upcoming:monthBills.filter((b) => b.status === "upcoming").length,
  };

  const paidPct = stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 w-32 rounded-xl" style={{ background: "var(--border)" }} />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl" style={{ background: "var(--border)" }} />
          ))}
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
          >
            Bills
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date picker */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-2xl"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
          >
            <Calendar size={14} style={{ color: "var(--accent)" }} />
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

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: "var(--accent-gradient)", fontFamily: "'DM Sans', sans-serif" }}
          >
            <Plus size={15} /> Add Bill
          </button>
        </div>
      </div>

      {/* ── SUMMARY BANNER ────────────────────────────────────────────── */}
      {monthBills.length > 0 && (
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: "var(--accent-gradient)" }}
        >
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10 bg-white" />
          <div className="absolute -bottom-8 right-20 w-20 h-20 rounded-full opacity-10 bg-white" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'DM Sans', sans-serif" }}>
                Total Bills This Month
              </p>
              <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                {fmt(stats.total)}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif" }}>
                  {fmt(stats.paid)} paid
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif" }}>
                  {fmt(stats.total - stats.paid)} remaining
                </span>
              </div>
            </div>

            {/* Payment progress */}
            <div className="min-w-[160px]">
              <div className="flex justify-between mb-1.5">
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'DM Sans', sans-serif" }}>
                  Payment Progress
                </span>
                <span className="text-xs font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {paidPct}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.25)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${paidPct}%`, background: "white" }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif" }}>
                <span>{stats.upcoming} upcoming</span>
                <span className={stats.overdue > 0 ? "text-red-300 font-semibold" : ""}>
                  {stats.overdue} overdue
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FILTER TABS ───────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "upcoming", label: "Upcoming", color: "#f59e0b", count: monthBills.filter(b => b.status === "upcoming").length },
          { key: "overdue",  label: "Overdue",  color: "#ef4444", count: monthBills.filter(b => b.status === "overdue").length  },
          { key: "paid",     label: "Paid",     color: "#22c55e", count: monthBills.filter(b => b.status === "paid").length     },
          { key: "all",      label: "All",      color: "var(--accent)", count: monthBills.length },
        ].map(({ key, label, color, count }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: activeFilter === key ? color : "var(--card-bg)",
              color: activeFilter === key ? "white" : "var(--text-secondary)",
              border: `1px solid ${activeFilter === key ? color : "var(--border)"}`,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {label}
            <span
              className="text-xs px-1.5 py-0.5 rounded-lg font-bold"
              style={{
                background: activeFilter === key ? "rgba(255,255,255,0.25)" : "var(--bg-base)",
                color: activeFilter === key ? "white" : "var(--text-muted)",
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── BILLS LIST ────────────────────────────────────────────────── */}
      {filteredBills.length === 0 ? (
        <EmptyBills status={activeFilter} onAdd={() => setIsAddOpen(true)} />
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
        >
          {filteredBills.map((bill, idx) => {
            const cfg = STATUS_CONFIG[bill.status] || STATUS_CONFIG.upcoming;
            const StatusIcon = cfg.icon;
            const isLoading = actionLoadingId === bill.id;
            const dueDate = new Date(bill.due_date);
            const now = new Date();
            const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            // Only allow mark as paid for current or future month bills
            const billMonth = dueDate.getMonth() + 1;
            const billYear  = dueDate.getFullYear();
            const curMonth  = now.getMonth() + 1;
            const curYear   = now.getFullYear();
            const isCurrentOrFuture =
              billYear > curYear || (billYear === curYear && billMonth >= curMonth);
            const canMarkPaid = bill.status !== "paid" && isCurrentOrFuture;

            return (
              <div
                key={bill.id}
                className="flex items-center gap-4 px-6 py-4 group transition-colors duration-150"
                style={{
                  borderBottom: idx < filteredBills.length - 1 ? `1px solid var(--border)` : "none",
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {/* Status icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.bg }}
                >
                  <StatusIcon size={18} style={{ color: cfg.color }} />
                </div>

                {/* Bill info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {bill.biller_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Due {new Date(bill.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {bill.status === "upcoming" && daysUntil >= 0 && daysUntil <= 7 && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-lg font-medium"
                        style={{ background: "#fef9c3", color: "#92400e", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Due in {daysUntil}d
                      </span>
                    )}
                    {bill.status === "overdue" && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-lg font-medium"
                        style={{ background: "#fee2e2", color: "#991b1b", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {Math.abs(daysUntil)}d overdue
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p
                    className="font-bold text-sm"
                    style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
                  >
                    {fmt(bill.amount_due)}
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-lg font-medium"
                    style={{ background: cfg.bg, color: cfg.color, fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {cfg.label}
                  </span>
                </div>

                {/* Actions — on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                  {canMarkPaid && (
                    <button
                      onClick={() => handleMarkPaid(bill.id)}
                      disabled={isLoading}
                      className="p-1.5 rounded-lg transition-colors duration-200 hover:bg-green-50"
                      title="Mark as paid"
                    >
                      <CheckCheck size={14} style={{ color: "#22c55e" }} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteBill(bill.id); }}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg transition-colors duration-200 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={14} style={{ color: "var(--danger)" }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddBillModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onBillAdded={async () => {
          setIsAddOpen(false);
          await loadBills();
        }}
      />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyBills({ status, onAdd }) {
  const messages = {
    upcoming: "No upcoming bills this month",
    overdue:  "No overdue bills — great job!",
    paid:     "No paid bills recorded yet",
    all:      "No bills added yet",
  };
  return (
    <div
      className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
      style={{ background: "var(--card-bg)", border: "2px dashed var(--border)" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--accent-light)" }}
      >
        <Receipt size={28} style={{ color: "var(--accent)" }} />
      </div>
      <h3
        className="font-semibold text-base mb-1"
        style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
      >
        {messages[status] || "No bills found"}
      </h3>
      {status === "all" && (
        <>
          <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
            Track your recurring bills and never miss a payment
          </p>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "var(--accent-gradient)", fontFamily: "'DM Sans', sans-serif" }}
          >
            <Plus size={16} /> Add Bill
          </button>
        </>
      )}
    </div>
  );
}

export default Bills;
