function NotificationPanel({ alerts, onMarkRead }) {
  return (
    <div
      className="absolute right-0 mt-3 w-96 bg-white shadow-xl rounded-xl border z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-3 border-b font-semibold">
        Notifications
      </div>

      {alerts.length === 0 ? (
        <div className="px-4 py-6 text-center text-gray-500">
          No new notifications
        </div>
      ) : (
        alerts.map((alert) => (
          <div
            key={alert.id}
            className="px-4 py-3 border-b last:border-b-0 hover:bg-slate-50"
          >
            <p className="text-sm text-gray-800">
              {alert.message}
            </p>

            <p className="text-xs text-gray-400 mt-1">
              {new Date(alert.created_at).toLocaleString()}
            </p>

            <button
              onClick={() => onMarkRead(alert.id)}
              className="text-xs text-indigo-600 hover:underline mt-2"
            >
              Mark as read
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default NotificationPanel;