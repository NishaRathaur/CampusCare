import { useState } from "react";
import api from "../api/axios";
import SupervisorLayout from "../components/SupervisorLayout";
import "../styles/SupervisorDashboard.css";

const initialForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

// Mirrors your backend's password policy — keep this in sync with whatever
// validation your User model / auth controller actually enforces.
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

export default function SupervisorChangePassword() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userName = localStorage.getItem("name") || "Supervisor";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setForm(initialForm);
    setError("");
    setSuccess("");
  };

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
    <SupervisorLayout>
      <div className="sv-section-card">
        <h2 className="sv-section-title">Change Password</h2>
        <p className="sv-section-subtitle">
          Fields marked <span className="sv-required-mark">*</span> are mandatory.
        </p>

        <div className="sv-password-policy">
          <p className="sv-password-policy-title">
            Password Policy — your password must include:
          </p>
          <ul>
            {PASSWORD_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="sv-password-form">
          <div className="sv-password-row">
            <label>User Name</label>
            <span className="sv-password-static-value">{userName}</span>
          </div>

          <div className="sv-password-row">
            <label>
              Current Password<span className="sv-required-mark">*</span>
            </label>
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          <div className="sv-password-row">
            <label>
              New Password<span className="sv-required-mark">*</span>
            </label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <div className="sv-password-row">
            <label>
              Re-Type New Password<span className="sv-required-mark">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="sv-status-error">{error}</p>}
          {success && <p className="sv-status-success">{success}</p>}

          <div className="sv-password-actions">
            <button type="submit" className="sv-view-complaints-btn" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="sv-password-reset-btn"
              onClick={handleReset}
              disabled={submitting}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </SupervisorLayout>
  );
}