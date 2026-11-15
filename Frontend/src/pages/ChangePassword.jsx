import { useState } from "react";
import Navbar from "../components/Navbar";
import axios from "../api/axios";
import "../styles/StudentDashboard.css";

const initialForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const PASSWORD_RULES = [
  "At least 1 upper case letter (A–Z)",
  "At least 1 lower case letter (a–z)",
  "At least 1 number (0–9)",
  "At least 1 symbol (e.g. !@#$%^&*?_-)",
  "Length must be at least 8 characters",
];

const validatePassword = (pw) => {
  if (pw.length < 8) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[a-z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  if (!/[^A-Za-z0-9]/.test(pw)) return false;
  return true;
};

export default function ChangePassword() {
  const [darkMode, setDarkMode] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (!validatePassword(form.newPassword)) {
      setError("New password doesn't meet the policy requirements below.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and retyped password don't match.");
      return;
    }
    if (form.newPassword === form.currentPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.patch("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess("Password updated successfully.");
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update your password. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`dashboard-page ${darkMode ? "dashboard-dark" : ""}`}>
      <Navbar
        activePath="/dashboard/change-password"
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
      />

      <main className="dashboard-content">
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
          <div className="mc-card" style={{ maxWidth: 480, width: "100%" }}>
            <h1 className="mc-title">Change Password</h1>
            <p style={{ fontSize: 13, color: "#6b6b7b", margin: "4px 0 18px" }}>
              Fields marked <span style={{ color: "#c0392b" }}>*</span> are mandatory.
            </p>

            <div
              style={{
                background: "#e6f7ed",
                border: "1px solid #c9e8d4",
                borderRadius: 10,
                padding: "16px 18px",
                marginBottom: 20,
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13.5, color: "#1f2340" }}>
                Your new password must include:
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                {PASSWORD_RULES.map((rule) => (
                  <li key={rule} style={{ fontSize: 12.5, color: "#6b6b7b" }}>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Current Password<span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  type="password"
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border-color, #e6e6ee)",
                    fontSize: 13.5,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  New Password<span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  autoComplete="new-password"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border-color, #e6e6ee)",
                    fontSize: 13.5,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Re-Type New Password<span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border-color, #e6e6ee)",
                    fontSize: 13.5,
                  }}
                />
              </div>

              {error && <p style={{ color: "#c0392b", fontSize: 13 }}>{error}</p>}
              {success && (
                <p
                  style={{
                    color: "#1c8a4b",
                    background: "#e6f7ed",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mc-filter-btn active"
                style={{ alignSelf: "flex-start", padding: "10px 22px" }}
              >
                {submitting ? "Saving..." : "Save Password"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}