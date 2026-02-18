import { useEffect, useState } from "react";
import { getAccounts, deleteAccount } from "../api";
import { showError, showSuccess, showConfirm } from "../utils/toast";
import { useNavigate } from "react-router-dom";
import AddAccountModal from "../components/AddAccountModal";
import {
  Landmark,
  Wallet,
  CreditCard,
  PiggyBank,
  Plus,
  Trash2,
  ChevronRight,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtBalance = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const getAccountIcon = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("credit")) return CreditCard;
  if (t.includes("saving")) return PiggyBank;
  if (t.includes("wallet")) return Wallet;
  return Landmark;
};

const getAccountTypeLabel = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("credit"))  return { label: "Credit Card",    color: "#ef4444", bg: "#fee2e2" };
  if (t.includes("saving"))  return { label: "Savings",        color: "#22c55e", bg: "#dcfce7" };
  if (t.includes("current")) return { label: "Current",        color: "#f59e0b", bg: "#fef9c3" };
  if (t.includes("wallet"))  return { label: "Wallet",         color: "#6366f1", bg: "#ede9fe" };
  return                              { label: type || "Bank",  color: "#6366f1", bg: "#ede9fe" };
};

const getAccountGradient = (index) => {
  const gradients = [
    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
    "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
    "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
  ];
  return gradients[index % gradients.length];
};

// ─────────────────────────────────────────────────────────────────────────────
function Accounts() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadAccounts = async () => {
    try {
      const res = await getAccounts();
      setData({ accounts: res.data });
    } catch {
      showError("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleDeleteAccount = (id) => {
    showConfirm("Delete this account?", async () => {
      try {
        setDeletingId(id);
        await deleteAccount(id);
        showSuccess("Account deleted");
        await loadAccounts();
      } finally {
        setDeletingId(null);
      }
    });
  };

  const accounts = data?.accounts || [];
  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  // ── Skeleton ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 w-40 rounded-xl" style={{ background: "var(--border)" }} />
        <div className="h-28 rounded-2xl" style={{ background: "var(--border)" }} />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

      {/* ── PAGE HEADER ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
          >
            Accounts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
            {accounts.length} account{accounts.length !== 1 ? "s" : ""} linked
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: "var(--accent-gradient)", fontFamily: "'DM Sans', sans-serif" }}
        >
          <Plus size={16} />
          Add Account
        </button>
      </div>

      {/* ── TOTAL BALANCE BANNER ─────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "var(--accent-gradient)" }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: "white" }}
        />
        <div
          className="absolute -bottom-10 -right-4 w-28 h-28 rounded-full opacity-10"
          style={{ background: "white" }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <CircleDollarSign size={16} color="rgba(255,255,255,0.8)" />
            <p
              className="text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans', sans-serif" }}
            >
              Total Balance Across All Accounts
            </p>
          </div>
          <h2
            className="text-4xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {fmtBalance(totalBalance)}
          </h2>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={14} color="rgba(255,255,255,0.7)" />
            <p
              className="text-xs"
              style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {accounts.length} account{accounts.length !== 1 ? "s" : ""} combined
            </p>
          </div>
        </div>
      </div>

      {/* ── ACCOUNTS LIST ────────────────────────────────────────────── */}
      {accounts.length === 0 ? (
        <EmptyState onAdd={() => setIsAddOpen(true)} />
      ) : (
        <div className="space-y-4">
          {accounts.map((acc, idx) => {
            const Icon = getAccountIcon(acc.account_type);
            const gradient = getAccountGradient(idx);
            const balance = Number(acc.balance);
            const isDeleting = deletingId === acc.id;
            const typeInfo = getAccountTypeLabel(acc.account_type);
            // Share of total
            const share = totalBalance > 0
              ? Math.round((balance / totalBalance) * 100)
              : 0;

            return (
              <div
                key={acc.id}
                onClick={() => navigate(`/dashboard/accounts/${acc.id}`)}
                className="group rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--card-shadow)",
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: gradient }}
                  >
                    <Icon size={22} color="white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className="font-semibold text-base"
                          style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
                        >
                          {acc.bank_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-xs px-2 py-0.5 rounded-lg font-medium"
                            style={{
                              background: typeInfo.bg,
                              color: typeInfo.color,
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {typeInfo.label}
                          </span>
                          <span
                            className="text-xs font-mono tracking-widest"
                            style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {acc.masked_account}
                          </span>
                        </div>
                      </div>

                      {/* Balance + actions */}
                      <div className="text-right flex-shrink-0">
                        <p
                          className="text-lg font-bold"
                          style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
                        >
                          {fmtBalance(balance)}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {share}% of total
                        </p>
                      </div>
                    </div>

                    {/* Balance share bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--bg-base)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${share}%`, background: gradient }}
                        />
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAccount(acc.id);
                          }}
                          className="p-1.5 rounded-lg transition-colors duration-200 hover:bg-red-50"
                          title="Delete account"
                          disabled={isDeleting}
                        >
                          <Trash2 size={14} style={{ color: "var(--danger)" }} />
                        </button>
                        <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AddAccountModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAccountAdded={async () => {
          setIsAddOpen(false);
          await loadAccounts();
        }}
      />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div
      className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
      style={{
        background: "var(--card-bg)",
        border: "2px dashed var(--border)",
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--accent-light)" }}
      >
        <Landmark size={28} style={{ color: "var(--accent)" }} />
      </div>
      <h3
        className="font-semibold text-base mb-1"
        style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
      >
        No accounts yet
      </h3>
      <p
        className="text-sm mb-6 max-w-xs"
        style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
      >
        Add your first bank account to start tracking your finances
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
        style={{ background: "var(--accent-gradient)", fontFamily: "'DM Sans', sans-serif" }}
      >
        <Plus size={16} />
        Add Account
      </button>
    </div>
  );
}

export default Accounts;
