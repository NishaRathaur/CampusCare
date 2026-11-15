import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import "../styles/Auth.css";

export default function SetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/auth/set-password", { newPassword: password });
      const role = localStorage.getItem("role");
      if (role === "supervisor") navigate("/supervisor");
      else if (role === "admin") navigate("/admin");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card single-col">
        <div className="auth-form-panel">
          <div className="auth-header">
            <div className="auth-icon-badge">
              <i className="ti ti-lock" aria-hidden="true"></i>
            </div>
            <p className="auth-title">Set your password</p>
            <p className="auth-subtitle">
              This is your first login — choose a new password to continue.
            </p>
          </div>

          {error && <div className="auth-banner error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label className="field-label" htmlFor="password">New password</label>
              <input
                id="password"
                type="password"
                className="field-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                className="field-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Saving…" : "Set password & continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
