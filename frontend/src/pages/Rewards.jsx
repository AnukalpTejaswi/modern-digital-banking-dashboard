import { useEffect, useState, useCallback } from "react";
import { getRewards, createReward, updateReward, getRewardSummary } from "../api";
import {
  Gift,
  Plus,
  RefreshCw,
  Sparkles,
  Pencil,
  Check,
  X,
  Star,
  TrendingUp,
  Coins,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const CURRENCIES = [
  "INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD", "CNY", "CHF", "ZAR", "RUB", "BRL", "HKD", "KRW", "MXN", "SEK", "NZD", "THB", "MYR"
];

const CURRENCY_SYMBOLS = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$", CAD: "C$", SGD: "S$", CNY: "¥", CHF: "Fr.",
  ZAR: "R", RUB: "₽", BRL: "R$", HKD: "HK$", KRW: "₩", MXN: "$", SEK: "kr", NZD: "$", THB: "฿", MYR: "RM"
};

const PROGRAM_COLORS = [
  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
  "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
];

const fmtPoints = (n) => Number(n).toLocaleString("en-IN");
const fmtValue  = (n, currency) =>
  `${CURRENCY_SYMBOLS[currency] || ""}${Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ─────────────────────────────────────────────────────────────────────────────
function Rewards() {
  const [rewards, setRewards]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Add form
  const [programName,     setProgramName]     = useState("");
  const [points,          setPoints]          = useState("");
  const [pointValue,      setPointValue]      = useState("");
  const [rewardCurrency,  setRewardCurrency]  = useState("INR");
  const [showAddForm,     setShowAddForm]     = useState(false);
  const [adding,          setAdding]          = useState(false);

  // Summary
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [totalValue,        setTotalValue]       = useState(0);

  // Edit
  const [editingId,   setEditingId]   = useState(null);
  const [editPoints,  setEditPoints]  = useState("");
  const [saving,      setSaving]      = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await getRewards();
      setRewards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const res = await getRewardSummary(selectedCurrency);
      setTotalValue(res.data.total_reward_value);
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedCurrency]);

  useEffect(() => { fetchRewards(); }, []);
  useEffect(() => { fetchSummary(); }, [fetchSummary, rewards]);

  // ── Create ───────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!programName || !points || !pointValue) return;
    try {
      setAdding(true);
      await createReward({
        program_name:     programName,
        points_balance:   Number(points),
        point_value:      Number(pointValue),
        currency:         rewardCurrency,
      });
      setProgramName(""); setPoints(""); setPointValue("");
      setRewardCurrency("INR"); setShowAddForm(false);
      await fetchRewards();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  // ── Update ───────────────────────────────────────────────────────────────
  const handleUpdate = async (id) => {
    try {
      setSaving(true);
      await updateReward(id, { points_balance: Number(editPoints) });
      setEditingId(null); setEditPoints("");
      await fetchRewards();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const totalPoints = rewards.reduce((s, r) => s + r.points_balance, 0);
  const sym = CURRENCY_SYMBOLS[selectedCurrency] || "";

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 w-32 rounded-xl" style={{ background: "var(--border)" }} />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl" style={{ background: "var(--border)" }} />
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
          >
            Rewards
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
            {rewards.length} program{rewards.length !== 1 ? "s" : ""} tracked
          </p>
        </div>

        <button
          onClick={() => setShowAddForm((p) => !p)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: "var(--accent-gradient)", fontFamily: "'DM Sans', sans-serif" }}
        >
          {showAddForm ? <X size={15} /> : <Plus size={15} />}
          {showAddForm ? "Cancel" : "Add Program"}
        </button>
      </div>

      {/* ── SUMMARY CARDS ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Total Points */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: "var(--accent-gradient)" }}
        >
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 bg-white" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} color="rgba(255,255,255,0.8)" />
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans', sans-serif" }}>
                Total Points
              </span>
            </div>
            <p className="text-4xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
              {fmtPoints(totalPoints)}
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'DM Sans', sans-serif" }}>
              Across {rewards.length} program{rewards.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Total Value */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{ color: "var(--accent)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
                Total Value
              </span>
            </div>

            {/* Currency selector + refresh */}
            <div className="flex items-center gap-2">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="text-xs font-semibold bg-transparent border-none outline-none cursor-pointer px-2 py-1 rounded-lg"
                style={{
                  background: "var(--bg-base)",
                  color: "var(--accent)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={fetchSummary}
                disabled={summaryLoading}
                className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50"
                style={{ background: "var(--bg-base)" }}
                title="Refresh"
              >
                <RefreshCw
                  size={13}
                  style={{
                    color: "var(--accent)",
                    animation: summaryLoading ? "spin 1s linear infinite" : "none",
                  }}
                />
              </button>
            </div>
          </div>

          <p
            className="text-4xl font-bold"
            style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
          >
            {sym}{Number(totalValue).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
            Converted to {selectedCurrency}
          </p>
        </div>
      </div>

      {/* ── ADD PROGRAM FORM ──────────────────────────────────────────── */}
      {showAddForm && (
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
        >
          <h3
            className="font-semibold text-base"
            style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
          >
            New Reward Program
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Program Name">
              <input
                type="text"
                placeholder="e.g. HDFC SmartBuy"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </FormField>

            <FormField label="Points Balance">
              <input
                type="number"
                placeholder="e.g. 5000"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </FormField>

            <FormField label="Value per Point">
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 0.25"
                value={pointValue}
                onChange={(e) => setPointValue(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </FormField>

            <FormField label="Currency">
              <select
                value={rewardCurrency}
                onChange={(e) => setRewardCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={adding || !programName || !points || !pointValue}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
              style={{ background: "var(--accent-gradient)", fontFamily: "'DM Sans', sans-serif" }}
            >
              <Sparkles size={14} />
              {adding ? "Adding..." : "Add Program"}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── REWARDS LIST ──────────────────────────────────────────────── */}
      {rewards.length === 0 ? (
        <EmptyRewards onAdd={() => setShowAddForm(true)} />
      ) : (
        <div className="space-y-4">
          {rewards.map((reward, idx) => {
            const gradient = PROGRAM_COLORS[idx % PROGRAM_COLORS.length];
            const rewardTotal = (reward.points_balance * reward.point_value).toFixed(2);
            const isEditing = editingId === reward.id;

            return (
              <div
                key={reward.id}
                className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 group"
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--card-shadow)",
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Program icon */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: gradient }}
                  >
                    {reward.program_name.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3
                          className="font-semibold text-base"
                          style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
                        >
                          {reward.program_name}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
                          Updated {new Date(reward.last_updated).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>

                      {/* Total value chip */}
                      <span
                        className="text-sm font-bold px-3 py-1 rounded-xl flex-shrink-0"
                        style={{ background: "var(--accent-light)", color: "var(--accent)", fontFamily: "'Sora', sans-serif" }}
                      >
                        {fmtValue(rewardTotal, reward.currency)}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <Coins size={13} style={{ color: "var(--accent)" }} />
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}>
                          {fmtPoints(reward.points_balance)}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>pts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
                          {CURRENCY_SYMBOLS[reward.currency] || ""}{reward.point_value} / pt
                        </span>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-lg"
                        style={{ background: "var(--bg-base)", color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {reward.currency}
                      </span>
                    </div>

                    {/* Points progress bar (visual relative to all programs) */}
                    <div className="mt-3">
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--bg-base)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: totalPoints > 0
                              ? `${(reward.points_balance / totalPoints) * 100}%`
                              : "0%",
                            background: gradient,
                          }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
                        {totalPoints > 0
                          ? `${Math.round((reward.points_balance / totalPoints) * 100)}% of total points`
                          : "0% of total points"}
                      </p>
                    </div>

                    {/* Edit inline */}
                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-3">
                        <input
                          type="number"
                          value={editPoints}
                          onChange={(e) => setEditPoints(e.target.value)}
                          className="px-3 py-1.5 rounded-xl text-sm w-32 outline-none"
                          style={{
                            background: "var(--bg-base)",
                            border: "1px solid var(--accent)",
                            color: "var(--text-primary)",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                          placeholder="New points"
                        />
                        <button
                          onClick={() => handleUpdate(reward.id)}
                          disabled={saving}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                          style={{ background: "#22c55e", fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <Check size={12} /> {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditPoints(""); }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
                          style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(reward.id); setEditPoints(reward.points_balance); }}
                        className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-3 py-1.5 rounded-xl text-xs font-medium"
                        style={{
                          background: "var(--accent-light)",
                          color: "var(--accent)",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        <Pencil size={11} /> Update Points
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Form Field Wrapper ────────────────────────────────────────────────────────
function FormField({ label, children }) {
  return (
    <div>
      <label
        className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
        style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyRewards({ onAdd }) {
  return (
    <div
      className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
      style={{ background: "var(--card-bg)", border: "2px dashed var(--border)" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--accent-light)" }}
      >
        <Gift size={28} style={{ color: "var(--accent)" }} />
      </div>
      <h3
        className="font-semibold text-base mb-1"
        style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
      >
        No reward programs yet
      </h3>
      <p
        className="text-sm mb-6 max-w-xs"
        style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
      >
        Track your credit card points, cashback, and loyalty rewards all in one place
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
        style={{ background: "var(--accent-gradient)", fontFamily: "'DM Sans', sans-serif" }}
      >
        <Plus size={16} /> Add Program
      </button>
    </div>
  );
}

export default Rewards;
