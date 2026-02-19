import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Pencil, Trash2 } from "lucide-react";

function BudgetCard({ budget, onEdit, onDelete }) {
  const { category, limit_amount, spent_amount, remaining_amount, is_over_budget } = budget;

  const WARNING_THRESHOLD = 70;

  const percentUsed =
    limit_amount > 0 ? Math.min((spent_amount / limit_amount) * 100, 100) : 0;

  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimatedWidth(percentUsed), 120);
    return () => clearTimeout(t);
  }, [percentUsed]);

  // ── Status config ────────────────────────────────────────────────────────
  const isOver    = percentUsed >= 100;
  const isNear    = percentUsed >= WARNING_THRESHOLD && !isOver;

  const statusConfig = isOver
    ? { label: "Over Budget",  icon: XCircle,       color: "#ef4444", bg: "#fee2e2", bar: "#ef4444" }
    : isNear
    ? { label: "Near Limit",   icon: AlertTriangle,  color: "#f59e0b", bg: "#fef9c3", bar: "#f59e0b" }
    : { label: "On Track",     icon: CheckCircle2,   color: "#22c55e", bg: "#dcfce7", bar: "var(--accent)" };

  const { label, icon: StatusIcon, color, bg, bar } = statusConfig;

  // ── Formatted values ─────────────────────────────────────────────────────
  const fmt = (n) =>
    `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 group ${
        isOver ? "animate-shake" : ""
      }`}
      style={{
        background: "var(--card-bg)",
        border: `1px solid ${isOver ? "#fecaca" : isNear ? "#fde68a" : "var(--border)"}`,
        boxShadow: "var(--card-shadow)",
      }}
    >
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Category icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: isOver ? "#ef4444" : isNear ? "#f59e0b" : "var(--accent-gradient)" }}
          >
            {(category || "OA").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3
              className="font-semibold text-sm leading-tight"
              style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
            >
              {category || "Overall Budget"}
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
            >
              Limit: {fmt(limit_amount)}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium flex-shrink-0"
          style={{ background: bg, color }}
        >
          <StatusIcon size={11} />
          <span style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        </div>
      </div>

      {/* ── PROGRESS BAR ──────────────────────────────────────────────── */}
      <div className="mb-3">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "var(--bg-base)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${animatedWidth}%`, background: bar }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
          >
            {fmt(spent_amount)} spent
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color, fontFamily: "'DM Sans', sans-serif" }}
          >
            {Math.round(percentUsed)}%
          </span>
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {/* Remaining / over */}
        <div>
          {is_over_budget ? (
            <p className="text-xs font-semibold" style={{ color: "#ef4444", fontFamily: "'DM Sans', sans-serif" }}>
              Over by {fmt(Math.abs(remaining_amount))}
            </p>
          ) : (
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
              {fmt(remaining_amount)}{" "}
              <span style={{ color: "var(--text-muted)" }}>remaining</span>
            </p>
          )}
        </div>

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(budget)}
            className="p-1.5 rounded-lg transition-colors duration-200"
            style={{ color: "var(--accent)" }}
            title="Edit budget"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="p-1.5 rounded-lg transition-colors duration-200 hover:bg-red-50"
            style={{ color: "var(--danger)" }}
            title="Delete budget"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default BudgetCard;
