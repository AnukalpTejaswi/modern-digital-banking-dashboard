import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { showError } from "../utils/toast";
import { getAlerts, markAlertRead } from "../api";
import NotificationPanel from "../components/NotificationPanel";
import AlertPopup from "../components/AlertPopup";

function DashboardLayout() {
  const navigate = useNavigate();

  // ========================
  // User state
  // ========================
  const [userName, setUserName] = useState(
    localStorage.getItem("user_name") || "User"
  );

  // ========================
  // Alerts & notifications
  // ========================
  const [alerts, setAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [popupAlert, setPopupAlert] = useState(null);

  // ========================
  // Time-based greeting
  // ========================
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // ========================
  // Logout handler
  // ========================
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  // ========================
  // Mark alert as read
  // ========================
  const handleCloseAlert = async (alertId) => {
    try {
      await markAlertRead(alertId);

      // Remove alert from local state
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch {
      showError("Failed to update alert");
    }
  };

  // ========================
  // Load alerts + polling
  // ========================
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const res = await getAlerts();
        setAlerts(res.data);
      } catch {
        showError("Failed to load alerts");
      }
    };

    loadAlerts();

    // Poll alerts every 15 seconds
    const id = setInterval(loadAlerts, 15000);

    // Cleanup interval on unmount
    return () => clearInterval(id);
  }, []);

  // ========================
  // Show bill-due popup (once per alert)
  // ========================
  useEffect(() => {
    const billDueAlert = alerts.find(
      (a) =>
        a.type === "bill_due" &&
        !localStorage.getItem(`bill_popup_seen_${a.id}`)
    );

    if (billDueAlert) {
      setPopupAlert(billDueAlert);

      // Prevent showing same popup again
      localStorage.setItem(
        `bill_popup_seen_${billDueAlert.id}`,
        "true"
      );
    }
  }, [alerts]);

  // ========================
  // Sync username across tabs
  // ========================
  useEffect(() => {
    const syncUserName = () => {
      setUserName(localStorage.getItem("user_name") || "User");
    };

    // Other tabs
    window.addEventListener("storage", syncUserName);

    // Same tab (custom event)
    window.addEventListener("user-name-updated", syncUserName);

    return () => {
      window.removeEventListener("storage", syncUserName);
      window.removeEventListener("user-name-updated", syncUserName);
    };
  }, []);

  // ========================
  // Personal message based on alerts/net cash flow
  // ========================
  const getPersonalMessage = () => {
    if (alerts.length > 0) {
      return `You have ${alerts.length} new alert${alerts.length > 1 ? "s" : ""}`;
    }

    const hour = new Date().getHours();
    if (hour < 12) return "Hope you have a productive day ahead";
    if (hour < 18) return "Here’s a quick look at your finances";
    return "Let’s review how your day went financially";
  };


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* ========================
          Header
      ======================== */}
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
      {/* Left: Greeting + message */}
      <div className="flex flex-col">
        <h1 className="text-xl font-bold leading-tight">
          {getGreeting()},{" "}
          <span className="text-indigo-600">{userName}</span>
        </h1>
        <p className="text-sm text-slate-500">
          {getPersonalMessage()}
        </p>
      </div>

      {/* Right: Notifications + Logout */}
      <div className="flex items-center gap-4 relative">
        {/* Notifications */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowNotifications((p) => !p);
          }}
          className="text-xl relative"
          title="Notifications"
        >
          🔔
          {alerts.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 rounded-full">
              {alerts.length}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12 z-50">
            <NotificationPanel
              alerts={alerts}
              onMarkRead={handleCloseAlert}
            />
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 transition text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </header>


      {/* ========================
          Layout body
      ======================== */}
      <div className="flex flex-1 p-6 gap-6">
        {/* Sidebar */}
        <aside className="w-64 bg-white rounded-xl shadow p-4 flex flex-col min-h-[calc(100vh-120px)]">

          <div className="space-y-2">
            <NavLink to="/dashboard" end className="block p-2 rounded hover:bg-indigo-50">
              Overview
            </NavLink>
            <NavLink to="/dashboard/accounts" className="block p-2 rounded hover:bg-indigo-50">
              Accounts
            </NavLink>
            <NavLink to="/dashboard/budgets" className="block p-2 rounded hover:bg-indigo-50">
              Budgets
            </NavLink>
            <NavLink to="/dashboard/bills" className="block p-2 rounded hover:bg-indigo-50">
              Bills
            </NavLink>
            <NavLink to="/dashboard/rewards" className="block p-2 rounded hover:bg-indigo-50">
              Rewards
            </NavLink>
          </div>

          <div className="pt-4 border-t mt-auto">
            <NavLink to="/dashboard/profile" className="block p-2 rounded hover:bg-indigo-50">
              Profile
            </NavLink>
          </div>

        </aside>


        {/* Main content */}
        <main className="flex-1 bg-white rounded-xl shadow p-6">
          <Outlet />
        </main>
      </div>

      {/* Bill due popup */}
      {popupAlert && (
        <AlertPopup
          alert={popupAlert}
          onClose={() => setPopupAlert(null)}
        />
      )}
    </div>
  );
}

export default DashboardLayout;
