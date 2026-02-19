import { useEffect, useState, useMemo } from "react";
import { getAlerts, markAlertAsRead } from "../api";
import {
  Bell,
  BellOff,
  TrendingUp,
  Receipt,
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  Clock,
  Filter,
  Inbox,
} from "lucide-react";

// ── Alert type config ─────────────────────────────────────────────────────────
const ALERT_CONFIG = {
  budget_exceeded: {
    label:   "Budget Exceeded",
    icon:    TrendingUp,
    color:   "#ef4444",
    bg:      "#fee2e2",
    border:  "#fecaca",
  },
  bill_due: {
    label:   "Bill Due",
    icon:    Receipt,
    color:   "#f59e0b",
    bg:      "#fef9c3",
    border:  "#fde68a",
  },
  low_balance: {
    label:   "Low Balance",
    icon:    AlertTriangle,
    color:   "#f97316",
    bg:      "#ffedd5",
    border:  "#fed7aa",
  },
  default: {
    label:   "Alert",
    icon:    Bell,
    color:   "#6366f1",
    bg:      "#ede9fe",
    border:  "#c4b5fd",
  },
};

const getConfig = (type) => ALERT_CONFIG[type] || ALERT_CONFIG.default;

const formatTime = (d) => {
  const date = new Date(d);
  const now  = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60)   return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// ─────────────────────────────────────────────────────────────────────────────
function Alerts() {
  const [alerts, setAlerts]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");   // all | unread | read
  const [typeFilter, setTypeFilter] = useState("all");
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await getAlerts();
      setAlerts(res.data);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleMarkRead = async (id) => {
    try {
      setMarkingId(id);
      await markAlertAsRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );
    } catch (err) {
      console.error("Error marking alert:", err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      const unread = alerts.filter((a) => !a.is_read);
      await Promise.all(unread.map((a) => markAlertAsRead(a.id)));
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const unreadCount = alerts.filter((a) => !a.is_read).length;

  // ── Filtered alerts ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...alerts];
    if (filter === "unread") list = list.filter((a) => !a.is_read);
    if (filter === "read")   list = list.filter((a) =>  a.is_read);
    if (typeFilter !== "all") list = list.filter((a) => a.alert_type === typeFilter);
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [alerts, filter, typeFilter]);

  // ── Type breakdown for stat cards ────────────────────────────────────────
  const typeCounts = useMemo(() => {
    const map = {};
    alerts.forEach((a) => {
      map[a.alert_type] = (map[a.alert_type] || 0) + 1;
    });
    return map;
  }, [alerts]);

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-3xl mx-auto">
        <div className="h-8 w-40 rounded-xl" style={{ background: "var(--border)" }} />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl" style={{ background: "var(--border)" }} />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
          >
            Alert Center
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""} need your attention`
              : "You're all caught up!"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              color: "var(--accent)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <CheckCheck size={14} />
            {markingAll ? "Marking..." : "Mark all read"}
          </button>
        )}
      </div>

      {/* ── TYPE STAT CARDS ───────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(ALERT_CONFIG)
            .filter(([key]) => key !== "default" && typeCounts[key])
            .map(([key, cfg]) => {
              const Icon = cfg.icon;
              const count = typeCounts[key] || 0;
              const unread = alerts.filter((a) => a.alert_type === key && !a.is_read).length;
              return (
                <button
                  key={key}
                  onClick={() => setTypeFilter(typeFilter === key ? "all" : key)}
                  className="rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: typeFilter === key ? cfg.bg : "var(--card-bg)",
                    border: `1px solid ${typeFilter === key ? cfg.border : "var(--border)"}`,
                    boxShadow: "var(--card-shadow)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: cfg.bg }}
                    >
                      <Icon size={16} style={{ color: cfg.color }} />
                    </div>
                    {unread > 0 && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: cfg.color, color: "white", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {unread} new
                      </span>
                    )}
                  </div>
                  <p
                    className="text-lg font-bold"
                    style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
                  >
                    {count}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {cfg.label}
                  </p>
                </button>
              );
            })}
        </div>
      )}

      {/* ── FILTER BAR ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={13} style={{ color: "var(--text-muted)" }} />

        {/* Read/unread tabs */}
        <div
          className="flex rounded-xl overflow-hidden text-xs font-medium"
          style={{ border: "1px solid var(--border)" }}
        >
          {[
            { key: "all",    label: `All (${alerts.length})` },
            { key: "unread", label: `Unread (${unreadCount})` },
            { key: "read",   label: `Read (${alerts.length - unreadCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3 py-1.5 transition-all duration-200"
              style={{
                background: filter === key ? "var(--accent)" : "var(--card-bg)",
                color: filter === key ? "white" : "var(--text-muted)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Type filter clear */}
        {typeFilter !== "all" && (
          <button
            onClick={() => setTypeFilter("all")}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl transition-all duration-200"
            style={{
              background: "var(--accent-light)",
              color: "var(--accent)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {getConfig(typeFilter).label} ×
          </button>
        )}
      </div>

      {/* ── ALERTS LIST ───────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyAlerts filter={filter} />
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const cfg = getConfig(alert.alert_type);
            const Icon = cfg.icon;
            const isMarking = markingId === alert.id;

            return (
              <div
                key={alert.id}
                className="rounded-2xl p-4 flex items-start gap-4 transition-all duration-200"
                style={{
                  background: alert.is_read ? "var(--card-bg)" : cfg.bg,
                  border: `1px solid ${alert.is_read ? "var(--border)" : cfg.border}`,
                  boxShadow: "var(--card-shadow)",
                  opacity: isMarking ? 0.6 : 1,
                }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: alert.is_read ? "var(--bg-base)" : "white" }}
                >
                  <Icon size={18} style={{ color: alert.is_read ? "var(--text-muted)" : cfg.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                          style={{
                            background: alert.is_read ? "var(--bg-base)" : "rgba(255,255,255,0.6)",
                            color: alert.is_read ? "var(--text-muted)" : cfg.color,
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {cfg.label}
                        </span>
                        {!alert.is_read && (
                          <span
                            className="w-2 h-2 rounded-full animate-pulse-dot"
                            style={{ background: cfg.color }}
                          />
                        )}
                      </div>
                      <p
                        className="text-sm font-medium leading-snug"
                        style={{
                          color: alert.is_read ? "var(--text-secondary)" : "var(--text-primary)",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {alert.message}
                      </p>
                    </div>

                    {/* Mark read button */}
                    {!alert.is_read && (
                      <button
                        onClick={() => handleMarkRead(alert.id)}
                        disabled={isMarking}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 flex-shrink-0"
                        style={{
                          background: "white",
                          color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        <CheckCircle2 size={12} />
                        {isMarking ? "..." : "Mark read"}
                      </button>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 mt-2">
                    <Clock size={11} style={{ color: "var(--text-muted)" }} />
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {formatTime(alert.created_at)}
                    </span>
                    {alert.is_read && (
                      <span
                        className="flex items-center gap-0.5 text-xs ml-2"
                        style={{ color: "#22c55e", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <CheckCheck size={11} /> Read
                      </span>
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

// ── Empty States ──────────────────────────────────────────────────────────────
function EmptyAlerts({ filter }) {
  const isAllClear = filter === "unread";
  return (
    <div
      className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
      style={{ background: "var(--card-bg)", border: "2px dashed var(--border)" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: isAllClear ? "#dcfce7" : "var(--accent-light)" }}
      >
        {isAllClear
          ? <BellOff size={28} style={{ color: "#22c55e" }} />
          : <Inbox size={28} style={{ color: "var(--accent)" }} />
        }
      </div>
      <h3
        className="font-semibold text-base mb-1"
        style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
      >
        {isAllClear ? "All caught up!" : "No alerts found"}
      </h3>
      <p
        className="text-sm max-w-xs"
        style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
      >
        {isAllClear
          ? "No unread alerts. We'll notify you when something needs attention."
          : "No alerts match the current filter."}
      </p>
    </div>
  );
}

export default Alerts;
