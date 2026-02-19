import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getTransactions,
  deleteTransaction,
  updateTransactionCategory,
  getAccounts,
} from "../api";
import { showError, showSuccess, showConfirm } from "../utils/toast";
import { CATEGORIES } from "../constants/categories";
import AddTransactionModal from "../components/AddTransactionModal";
import CategoryBadge from "../components/CategoryBadge";
import UploadCSVModal from "../components/UploadCSVModal";
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Upload,
  Download,
  Trash2,
  ArrowLeft,
  Filter,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronDown,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ─────────────────────────────────────────────────────────────────────────────
function AccountDetails() {
  const { accountId } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterType, setFilterType] = useState("all"); // all | credit | debit
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc"); // desc | asc

  const loadAccountData = useCallback(async () => {
    try {
      const [txnRes, accRes] = await Promise.all([
        getTransactions(),
        getAccounts(),
      ]);
      const txns = txnRes.data.filter(
        (t) => t.account_id === Number(accountId)
      );
      setTransactions(txns);
      const acc = accRes.data.find((a) => a.id === Number(accountId));
      setAccount(acc || null);
    } catch {
      showError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadAccountData();
  }, [loadAccountData]);

  const handleDeleteTransaction = (txnId) => {
    showConfirm("Delete this transaction?", async () => {
      try {
        setDeletingId(txnId);
        await deleteTransaction(txnId);
        showSuccess("Transaction deleted");
        await loadAccountData();
      } catch {
        showError("Failed to delete transaction");
      } finally {
        setDeletingId(null);
      }
    });
  };

  const handleCategoryChange = async (txnId, newCategory) => {
    try {
      const res = await updateTransactionCategory(txnId, {
        category: newCategory,
        force: false,
      });

      if (res.data?.warning) {
        showConfirm(res.data.message, async () => {
          await updateTransactionCategory(txnId, {
            category: newCategory,
            force: true,
          });
          setTransactions((prev) =>
            prev.map((t) =>
              t.id === txnId ? { ...t, category: newCategory } : t
            )
          );
          showSuccess("Category updated");
        });
        return;
      }

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === txnId ? { ...t, category: newCategory } : t
        )
      );
      showSuccess("Category updated");
    } catch {
      showError("Failed to update category");
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.txn_type === "credit")
      .reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions
      .filter((t) => t.txn_type === "debit")
      .reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, net: income - expense, total: transactions.length };
  }, [transactions]);

  // ── Category breakdown ───────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => t.txn_type === "debit")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount);
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [transactions]);

  // ── Filtered & sorted transactions ──────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filterType !== "all")
      list = list.filter((t) => t.txn_type === filterType);
    if (filterCategory !== "all")
      list = list.filter((t) => t.category === filterCategory);
    list.sort((a, b) => {
      const diff = new Date(a.txn_date) - new Date(b.txn_date);
      return sortOrder === "desc" ? -diff : diff;
    });
    return list;
  }, [transactions, filterType, filterCategory, sortOrder]);

  // ── Unique categories present in transactions ────────────────────────────
  const presentCategories = useMemo(() => {
    return [...new Set(transactions.map((t) => t.category).filter(Boolean))];
  }, [transactions]);

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl mx-auto">
        <div className="h-6 w-32 rounded-xl" style={{ background: "var(--border)" }} />
        <div className="h-32 rounded-2xl" style={{ background: "var(--border)" }} />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl" style={{ background: "var(--border)" }} />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">

      {/* ── BACK LINK ─────────────────────────────────────────────────── */}
      <Link
        to="/dashboard/accounts"
        className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-200"
        style={{ color: "var(--accent)", fontFamily: "'DM Sans', sans-serif" }}
      >
        <ArrowLeft size={15} />
        Back to Accounts
      </Link>

      {/* ── ACCOUNT HEADER CARD ────────────────────────────────────────── */}
      {account && (
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: "var(--accent-gradient)" }}
        >
          <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full opacity-10 bg-white" />
          <div className="absolute -bottom-8 right-16 w-24 h-24 rounded-full opacity-10 bg-white" />
          <div className="relative z-10">
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {account.account_type} · {account.masked_account}
            </p>
            <h1
              className="text-3xl font-bold text-white mb-1"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {account.bank_name}
            </h1>
            <p
              className="text-2xl font-semibold"
              style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Sora', sans-serif" }}
            >
              {fmt(account.balance)}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif" }}
            >
              Current balance
            </p>
          </div>
        </div>
      )}

      {/* ── STATS ROW ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Income"
          value={fmt(stats.income)}
          icon={TrendingUp}
          color="#22c55e"
          bg="var(--income-light)"
        />
        <StatCard
          label="Total Expenses"
          value={fmt(stats.expense)}
          icon={TrendingDown}
          color="#ef4444"
          bg="var(--expense-light)"
        />
        <StatCard
          label="Net Flow"
          value={fmt(Math.abs(stats.net))}
          icon={Activity}
          color={stats.net >= 0 ? "#6366f1" : "#ef4444"}
          bg="var(--accent-light)"
          prefix={stats.net >= 0 ? "+" : "−"}
        />
      </div>

      {/* ── CATEGORY BREAKDOWN ────────────────────────────────────────── */}
      {categoryBreakdown.length > 0 && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <h3
            className="font-semibold text-sm mb-4"
            style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
          >
            Top Spending Categories
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categoryBreakdown.map(([cat, amt], i) => {
              const colors = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];
              return (
                <div key={cat} className="text-center">
                  <div
                    className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: colors[i] }}
                  >
                    {cat?.slice(0, 2).toUpperCase()}
                  </div>
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {cat}
                  </p>
                  <p
                    className="text-sm font-bold"
                    style={{ color: colors[i], fontFamily: "'Sora', sans-serif" }}
                  >
                    {fmt(amt)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS SECTION ─────────────────────────────────────── */}
      <div
        className="rounded-2xl"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        {/* Header */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-6"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2
              className="font-semibold text-base"
              style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
            >
              Transactions
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {filtered.length} of {stats.total} transactions
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsTxnModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "var(--accent-gradient)", fontFamily: "'DM Sans', sans-serif" }}
            >
              <Plus size={13} /> Add
            </button>

            <button
              onClick={() => setIsCSVModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Upload size={13} /> Upload CSV
            </button>

            <a
              href="/sample-transactions.csv"
              download
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Download size={13} /> Sample CSV
            </a>
          </div>
        </div>

        {/* Filters bar */}
        <div
          className="flex flex-wrap items-center gap-3 px-6 py-3"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-base)" }}
        >
          <Filter size={13} style={{ color: "var(--text-muted)" }} />

          {/* Type filter */}
          <div className="flex rounded-xl overflow-hidden text-xs font-medium" style={{ border: "1px solid var(--border)" }}>
            {["all", "credit", "debit"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className="px-3 py-1.5 capitalize transition-all duration-200"
                style={{
                  background: filterType === t ? "var(--accent)" : "var(--card-bg)",
                  color: filterType === t ? "white" : "var(--text-muted)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {t === "all" ? "All" : t === "credit" ? "Income" : "Expense"}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div
            className="relative flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer text-xs pr-4"
              style={{ color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}
            >
              <option value="all">All Categories</option>
              {presentCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={11} style={{ color: "var(--text-muted)", pointerEvents: "none" }} />
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortOrder((p) => (p === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-colors duration-200"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {sortOrder === "desc" ? "Newest first" : "Oldest first"}
            <ChevronDown
              size={11}
              style={{
                transform: sortOrder === "asc" ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
                color: "var(--text-muted)",
              }}
            />
          </button>
        </div>

        {/* Transaction list */}
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p
                className="text-sm"
                style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
              >
                No transactions match your filters.
              </p>
            </div>
          ) : (
            filtered.map((txn) => {
              const isCredit = txn.txn_type === "credit";
              const isDeleting = deletingId === txn.id;

              return (
                <div
                  key={txn.id}
                  className="flex items-center gap-4 px-6 py-4 group transition-colors duration-150"
                  style={{
                    background: isDeleting ? "var(--bg-base)" : "transparent",
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                >
                  {/* Type icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isCredit ? "var(--income-light)" : "var(--expense-light)",
                    }}
                  >
                    {isCredit ? (
                      <ArrowUpRight size={18} style={{ color: "#22c55e" }} />
                    ) : (
                      <ArrowDownRight size={18} style={{ color: "#ef4444" }} />
                    )}
                  </div>

                  {/* Description + meta */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-sm truncate"
                      style={{ color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {txn.merchant || txn.description || "Transaction"}
                    </p>
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {formatDate(txn.txn_date)}
                      </span>
                      <CategoryBadge category={txn.category || "Others"} />
                    </div>
                  </div>

                  {/* Category selector */}
                  <div
                    className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                    style={{
                      background: "var(--bg-base)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <select
                      value={txn.category || "Others"}
                      onChange={(e) => handleCategoryChange(txn.id, e.target.value)}
                      className="bg-transparent border-none outline-none cursor-pointer text-xs"
                      style={{ color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className="font-bold text-sm"
                      style={{
                        color: isCredit ? "#22c55e" : "#ef4444",
                        fontFamily: "'Sora', sans-serif",
                      }}
                    >
                      {isCredit ? "+" : "−"}{fmt(txn.amount)}
                    </p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteTransaction(txn.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-200 hover:bg-red-50 flex-shrink-0"
                    title="Delete"
                    disabled={isDeleting}
                  >
                    <Trash2 size={14} style={{ color: "var(--danger)" }} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        accountId={Number(accountId)}
        onTransactionAdded={() => {
          setIsTxnModalOpen(false);
          loadAccountData();
        }}
      />
      <UploadCSVModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        accountId={Number(accountId)}
        onUploadSuccess={() => {
          setIsCSVModalOpen(false);
          loadAccountData();
        }}
      />
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg, prefix = "" }) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: bg }}
      >
        <Icon size={17} style={{ color }} />
      </div>
      <p
        className="text-xs font-medium uppercase tracking-wider mb-1"
        style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
      >
        {label}
      </p>
      <p
        className="text-xl font-bold"
        style={{ color, fontFamily: "'Sora', sans-serif" }}
      >
        {prefix}{value}
      </p>
    </div>
  );
}

export default AccountDetails;
