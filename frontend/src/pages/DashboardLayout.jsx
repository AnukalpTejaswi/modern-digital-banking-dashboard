import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { showError } from "../utils/toast";
import {
  getAlerts,
  markAlertAsRead,
  generateAlerts,
  getCurrentUser,
} from "../api";
import NotificationPanel from "../components/NotificationPanel";
import AlertPopup from "../components/AlertPopup";
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  Receipt,
  Gift,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  TrendingUp,
} from "lucide-react";

// ─── Nav items config ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/accounts", label: "Accounts", icon: Wallet },
  { to: "/dashboard/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/dashboard/bills", label: "Bills", icon: Receipt },
  { to: "/dashboard/rewards", label: "Rewards", icon: Gift },
  { to: "/dashboard/alerts", label: "Alerts", icon: Bell },
];

function DashboardLayout() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");
  const [alerts, setAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [popupAlert, setPopupAlert] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Greeting ────────────────────────────────────────────────────────────
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const getPersonalMessage = () => {
    if (alerts.length > 0)
      return `You have ${alerts.length} unread alert${alerts.length > 1 ? "s" : ""}`;
    const h = new Date().getHours();
    if (h < 12) return "Hope you have a productive day ahead";
    if (h < 18) return "Here's a quick look at your finances";
    return "Let's review how your day went financially";
  };

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleCloseAlert = async (alertId) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setPopupAlert(null);
    } catch {
      showError("Failed to update alert");
    }
  };

  // ── Effects ─────────────────────────────────────────────────────────────
    useEffect(() => {
    const initAlerts = async () => {
      try {
        await generateAlerts();
        const res = await getAlerts(true);
        setAlerts(res.data || []);
      } catch {
        showError("Failed to initialize alerts");
      }
    };

    initAlerts();
  }, []);
  //  Refresh alerts when a transaction creates one
  useEffect(() => {
    const refreshAlerts = async () => {
      try {
        await generateAlerts();
        const res = await getAlerts(true);
        setAlerts(res.data || []);
      } catch {
        showError("Failed to refresh alerts");
      }
    };

    window.addEventListener("alert-updated", refreshAlerts);

    return () => {
      window.removeEventListener("alert-updated", refreshAlerts);
    };
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        const name = res.data.name;
        setUserName(name);
        localStorage.setItem("user_name", name);
        window.dispatchEvent(new Event("user-name-updated"));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const billDueAlert = alerts.find(
      (a) =>
        a.alert_type === "bill_due" &&
        !localStorage.getItem(`bill_popup_seen_${a.id}`)
    );
    if (billDueAlert) {
      setPopupAlert(billDueAlert);
      localStorage.setItem(`bill_popup_seen_${billDueAlert.id}`, "true");
    }
  }, [alerts]);

  useEffect(() => {
    const sync = () =>
      setUserName(localStorage.getItem("user_name") || "User");
    window.addEventListener("storage", sync);
    window.addEventListener("user-name-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("user-name-updated", sync);
    };
  }, []);

  useEffect(() => {
    const close = () => setShowNotifications(false);
    if (showNotifications) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showNotifications]);

  // ── Avatar initials ──────────────────────────────────────────────────────
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-screen flex" style={{ background: "var(--bg-base)" }}>
      {/* ══════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════ */}
      <aside
        className="flex flex-col transition-all duration-300 ease-in-out relative flex-shrink-0"
        style={{
          width: sidebarCollapsed ? "72px" : "240px",
          height: "100vh",
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--border)",
          boxShadow: "4px 0 24px rgba(99,102,241,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-6"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent-gradient)" }}
          >
            <TrendingUp size={18} color="white" />
          </div>
          {!sidebarCollapsed && (
            <span
              className="font-bold text-lg tracking-tight"
              style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
            >
              Banking Dashboard
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${isActive ? "nav-active" : "nav-inactive"}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                  <Icon
                    size={18}
                    className="flex-shrink-0 transition-colors duration-200"
                    style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}
                  />
                  {!sidebarCollapsed && (
                    <span
                      className="text-sm font-medium transition-colors duration-200"
                      style={{
                        color: isActive ? "var(--accent)" : "var(--text-secondary)",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Profile & Logout */}
        <div
          className="px-3 py-4 space-y-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${isActive ? "nav-active" : "nav-inactive"}`
            }
          >
            {({ isActive }) => (
              <>
                <User
                  size={18}
                  className="flex-shrink-0"
                  style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}
                />
                {!sidebarCollapsed && (
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: isActive ? "var(--accent)" : "var(--text-secondary)",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Profile
                  </span>
                )}
              </>
            )}
          </NavLink>

          {/* User chip */}
          {!sidebarCollapsed && (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--card-bg)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: "var(--accent-gradient)" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold truncate"
                  style={{ color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {userName}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Personal
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 rounded-lg transition-colors duration-200 hover:bg-red-50"
                title="Logout"
              >
                <LogOut size={14} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed((p) => !p)}
          className="absolute top-1/2 -right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
          style={{
            background: "white",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            transform: "translateY(-50%)",
            zIndex: 20
          }}
        >
          <ChevronDown
            size={14}
            style={{
              transform: sidebarCollapsed ? "rotate(-90deg)" : "rotate(90deg)",
              transition: "transform 0.3s",
            }}
          />
        </button>
      </aside>

      {/* ══════════════════════════════════════════════
          MAIN COLUMN
      ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* ── HEADER ──────────────────────────────── */}
        <header
          className="flex items-center justify-between px-8 py-4 sticky top-0 z-30"
          style={{
            background: "var(--header-bg)",
            borderBottom: "1px solid var(--border)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Greeting */}
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: "var(--accent)" }} />
              <h1
                className="text-base font-semibold"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "'Sora', sans-serif",
                }}
              >
                {getGreeting()},{" "}
                <span style={{ color: "var(--accent)" }}>{userName}</span>
              </h1>
            </div>
            <p
              className="text-xs mt-0.5"
              style={{
                color: "var(--text-muted)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {getPersonalMessage()}
            </p>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 relative">
            {/* Notification bell */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifications((p) => !p);
              }}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
              style={{
                background: showNotifications ? "var(--accent-light)" : "var(--card-bg)",
                border: "1px solid var(--border)",
              }}
              title="Notifications"
            >
              <Bell
                size={17}
                style={{ color: showNotifications ? "var(--accent)" : "var(--text-muted)" }}
              />
              {alerts.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1"
                  style={{ background: "var(--danger)" }}
                >
                  {alerts.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 top-12 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <NotificationPanel
                  alerts={alerts}
                  onMarkRead={handleCloseAlert}
                />
              </div>
            )}

            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-all duration-200 hover:scale-105"
              style={{ background: "var(--accent-gradient)" }}
              title={userName}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ────────────────────────── */}
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Bill popup */}
      {popupAlert && (
        <AlertPopup alert={popupAlert} onClose={() => handleCloseAlert(popupAlert.id)} />
      )}
    </div>
  );
}

export default DashboardLayout;
