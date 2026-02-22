import { useEffect, useState, useCallback } from "react";
import { getBudgets, deleteBudget } from "../api";
import BudgetCard from "./BudgetCard.jsx";
import AddBudgetModal from "./AddBudgetModal";
import { showError, showSuccess } from "../utils/toast";
import { useDate } from "../context/DateContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, CheckCircle2, AlertTriangle, XCircle, PiggyBank } from "lucide-react";

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs shadow-xl"
      style={{
        background: "var(--tooltip-bg)",
        border: "1px solid var(--border)",
        fontFamily: "'DM Sans', sans-serif",
        color: "var(--text-primary)",
      }}
    >
      <span className="font-semibold">{payload[0].name}:</span>{" "}
      {payload[0].value} budget{payload[0].value !== 1 ? "s" : ""}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
function BudgetsSection() {
  const { selectedMonth, selectedYear } = useDate();

  const [budgets, setBudgets] = useState({ overall: null, categories: [] });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBudgets(selectedMonth, selectedYear);
      const overall = res.data.find((b) => b.category === null) || null;
      const categories = res.data.filter((b) => b.category !== null);
      setBudgets({ overall, categories });
    } catch {
      showError("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);
  
  useEffect(() => {
    const handleTransactionAdded = () => {
      loadBudgets();
    };

    window.addEventListener("transaction-added", handleTransactionAdded);

    return () => {
      window.removeEventListener("transaction-added", handleTransactionAdded);
    };
  }, [loadBudgets]);
  const handleDelete = async (id) => {
    try {
      await deleteBudget(id);
      showSuccess("Budget deleted");
      loadBudgets();
    } catch {
      showError("Failed to delete budget");
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  // ── Health stats ─────────────────────────────────────────────────────────
  let onTrack = 0, nearLimit = 0, overBudget = 0;
  budgets.categories.forEach((b) => {
    const pct = b.limit_amount > 0 ? (b.spent_amount / b.limit_amount) * 100 : 0;
    if (pct >= 100) overBudget++;
    else if (pct >= 70) nearLimit++;
    else onTrack++;
  });

  const total = budgets.categories.length;
  const healthScore = total > 0 ? Math.round((onTrack / total) * 100) : 0;

  const pieData = [
    { name: "On Track", value: onTrack },
    { name: "Near Limit", value: nearLimit },
    { name: "Over Budget", value: overBudget },
  ].filter((d) => d.value > 0);
  const ALL_COLORS = { "On Track": "#22c55e", "Near Limit": "#f59e0b", "Over Budget": "#ef4444" };

  // ── Total budget & spent ─────────────────────────────────────────────────
  const totalBudget = budgets.categories.reduce((s, b) => s + Number(b.limit_amount), 0);
  const totalSpent = budgets.categories.reduce((s, b) => s + Number(b.spent_amount), 0);
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 rounded-2xl" style={{ background: "var(--border)" }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl" style={{ background: "var(--border)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── HEALTH OVERVIEW ─────────────────────────────────────────────── */}
      {budgets.categories.length > 0 && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div className="flex flex-col lg:flex-row items-center gap-8">

            {/* Donut chart */}
            <div className="relative flex-shrink-0">
              <div className="w-48 h-48 min-w-[192px] min-h-[192px]">
                <ResponsiveContainer width="100%" height={192}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      innerRadius={58}
                      outerRadius={80}
                      paddingAngle={3}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={ALL_COLORS[entry.name]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span
                  className="text-3xl font-bold"
                  style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
                >
                  {healthScore}%
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                >
                  healthy
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 w-full space-y-4">
              <div>
                <h3
                  className="font-semibold text-base"
                  style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
                >
                  Budget Health Overview
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {total} categor{total !== 1 ? "ies" : "y"} tracked this month
                </p>
              </div>

              {/* Status rows */}
              <div className="space-y-3">
                {[
                  { label: "On Track", count: onTrack, icon: CheckCircle2, color: "#22c55e", bg: "#dcfce7" },
                  { label: "Near Limit", count: nearLimit, icon: AlertTriangle, color: "#f59e0b", bg: "#fef9c3" },
                  { label: "Over Budget", count: overBudget, icon: XCircle, color: "#ef4444", bg: "#fee2e2" },
                ].map(({ label, count, icon: Icon, color, bg }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: bg }}
                      >
                        <Icon size={14} style={{ color }} />
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-24 h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--bg-base)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: total > 0 ? `${(count / total) * 100}%` : "0%",
                            background: color,
                          }}
                        />
                      </div>
                      <span
                        className="text-sm font-bold w-4 text-right"
                        style={{ color, fontFamily: "'Sora', sans-serif" }}
                      >
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall spend bar */}
              <div
                className="mt-2 p-3 rounded-xl"
                style={{ background: "var(--bg-base)" }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Total Budget Used
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    ₹{Number(totalSpent).toLocaleString("en-IN")} / ₹{Number(totalBudget).toLocaleString("en-IN")}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--border)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${overallPct}%`,
                      background: overallPct >= 100
                        ? "#ef4444"
                        : overallPct >= 70
                        ? "#f59e0b"
                        : "var(--accent-gradient)",
                    }}
                  />
                </div>
                <p
                  className="text-xs mt-1 text-right"
                  style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {Math.round(overallPct)}% used
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORY BUDGETS ────────────────────────────────────────────── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="font-semibold text-base"
              style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
            >
              Category Budgets
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {budgets.categories.length} budget{budgets.categories.length !== 1 ? "s" : ""} set
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: "var(--accent-gradient)", fontFamily: "'DM Sans', sans-serif" }}
          >
            <Plus size={15} />
            Add Budget
          </button>
        </div>

        {budgets.categories.length === 0 ? (
          <EmptyBudgets onAdd={() => setIsModalOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {budgets.categories.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AddBudgetModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingBudget(null); }}
        onCreated={loadBudgets}
        budget={editingBudget}
      />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyBudgets({ onAdd }) {
  return (
    <div
      className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
      style={{ background: "var(--card-bg)", border: "2px dashed var(--border)" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--accent-light)" }}
      >
        <PiggyBank size={28} style={{ color: "var(--accent)" }} />
      </div>
      <h3
        className="font-semibold text-base mb-1"
        style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
      >
        No budgets yet
      </h3>
      <p
        className="text-sm mb-6 max-w-xs"
        style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
      >
        Set category budgets to track and control your monthly spending
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
        style={{ background: "var(--accent-gradient)", fontFamily: "'DM Sans', sans-serif" }}
      >
        <Plus size={16} />
        Add Budget
      </button>
    </div>
  );
}

export default BudgetsSection;
