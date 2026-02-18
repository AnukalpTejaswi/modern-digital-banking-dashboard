import { useState } from "react";
import { updateProfile } from "../api";
import { showSuccess, showError } from "../utils/toast";
import { User, Lock, KeyRound, Save, Shield, Eye, EyeOff } from "lucide-react";

function Profile() {
  const [name,        setName]        = useState(localStorage.getItem("user_name") || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld,     setShowOld]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [saving,      setSaving]      = useState(false);

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { name };
      if (newPassword) {
        payload.old_password = oldPassword;
        payload.new_password = newPassword;
      }
      const res = await updateProfile(payload);
      localStorage.setItem("user_name", res.data.name);
      window.dispatchEvent(new Event("user-name-updated"));
      showSuccess("Profile updated successfully");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">

      {/* ── PAGE HEADER ───────────────────────────────────────────────── */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
        >
          Profile
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
          Manage your account details and security
        </p>
      </div>

      {/* ── AVATAR CARD ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 flex items-center gap-5"
        style={{
          background: "var(--accent-gradient)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-8 right-16 w-20 h-20 rounded-full opacity-10 bg-white" />

        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 relative z-10"
          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
        >
          {initials}
        </div>

        <div className="relative z-10">
          <p
            className="text-xl font-bold text-white"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {name || "Your Name"}
          </p>
          <p
            className="text-sm mt-0.5"
            style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'DM Sans', sans-serif" }}
          >
            Personal Account
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── PERSONAL INFO ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-light)" }}
            >
              <User size={14} style={{ color: "var(--accent)" }} />
            </div>
            <h2
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
            >
              Personal Info
            </h2>
          </div>

          <FormField label="Display Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </FormField>
        </div>

        {/* ── SECURITY ──────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#dcfce7" }}
            >
              <Shield size={14} style={{ color: "#22c55e" }} />
            </div>
            <h2
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)", fontFamily: "'Sora', sans-serif" }}
            >
              Change Password
            </h2>
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
            Leave both fields blank to keep your current password
          </p>

          <FormField label="Current Password">
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <button
                type="button"
                onClick={() => setShowOld((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              >
                {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FormField>

          <FormField label="New Password">
            <div className="relative">
              <KeyRound
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FormField>
        </div>

        {/* ── SAVE BUTTON ───────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:translate-y-0"
          style={{ background: "var(--accent-gradient)", fontFamily: "'DM Sans', sans-serif" }}
        >
          <Save size={15} />
          {saving ? "Saving changes..." : "Save Changes"}
        </button>
      </form>
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

export default Profile;
