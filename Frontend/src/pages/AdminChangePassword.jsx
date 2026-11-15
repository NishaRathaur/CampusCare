import { useState } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/AdminDashboard.css";

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

export default function AdminChangePassword() {
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
      await api.patch("/auth/change-password", {
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
    <AdminLayout activePath="/admin/change-password">
      <div className="admin-section-card" style={{ maxWidth: 480 }}>
        <h2 className="admin-section-title">Change Password</h2>
        <p className="admin-section-subtitle">
          Fields marked <span className="admin-required-mark">*</span> are mandatory.
        </p>

        <div className="admin-password-policy">
          <p className="admin-password-policy-title">Your new password must include:</p>
          <ul>
            {PASSWORD_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">
              Current Password<span className="admin-required-mark">*</span>
            </label>
            <input
              type="password"
              className="admin-form-input"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              autoComplete="current-password"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">
              New Password<span className="admin-required-mark">*</span>
            </label>
            <input
              type="password"
              className="admin-form-input"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              autoComplete="new-password"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">
              Re-Type New Password<span className="admin-required-mark">*</span>
            </label>
            <input
              type="password"
              className="admin-form-input"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="admin-form-status error">{error}</p>}
          {success && <p className="admin-form-status success">{success}</p>}

          <button className="admin-form-submit" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Password"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}