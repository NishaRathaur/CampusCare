import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import axios from "../api/axios";
import "../styles/StudentDashboard.css";
import "../styles/Profile.css";

export default function Profile() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get("/auth/me");
        setUser(data.user);
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't load your profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "?";

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const roleLabel = {
    student: "Student",
    faculty: "Faculty",
    supervisor: "Supervisor",
    admin: "Admin",
  };

  return (
    <div className={`dashboard-page ${darkMode ? "dashboard-dark" : ""}`}>
      <Navbar
        activePath="/dashboard/profile"
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
      />

      <main className="dashboard-content">
        <h1 className="dashboard-welcome-title" style={{ marginBottom: 18 }}>
          My Profile
        </h1>

        {error && <div className="auth-banner error">{error}</div>}

        {loading ? (
          <p className="mc-empty">Loading your profile…</p>
        ) : user ? (
          <div className="pf-card">
            <div className="pf-avatar-section">
              <div className="pf-avatar">{initial}</div>
              <p className="pf-locked-note">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="11" width="16" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Profile picture set by admin
              </p>

              <span className={`pf-role-badge pf-role-${user.role}`}>
                {roleLabel[user.role] || user.role}
              </span>
            </div>

            <div className="pf-fields">
              <div className="pf-field">
                <label className="pf-label">Full name</label>
                <input className="pf-input" value={user.name} disabled />
              </div>

              <div className="pf-field">
                <label className="pf-label">College email</label>
                <input className="pf-input" value={user.email} disabled />
              </div>

              <div className="pf-row">
                <div className="pf-field">
                  <label className="pf-label">
                    {user.role === "student" ? "Roll number" : "Employee ID"}
                  </label>
                  <input
                    className="pf-input"
                    value={user.rollNo || user.empId || "—"}
                    disabled
                  />
                </div>
                <div className="pf-field">
                  <label className="pf-label">Department</label>
                  <input className="pf-input" value={user.department || "—"} disabled />
                </div>
              </div>

              <div className="pf-row">
                <div className="pf-field">
                  <label className="pf-label">
                    {user.role === "student" ? "Year" : "Designation"}
                  </label>
                  <input
                    className="pf-input"
                    value={user.year || user.designation || "—"}
                    disabled
                  />
                </div>
                <div className="pf-field">
                  <label className="pf-label">Phone number</label>
                  <input className="pf-input" value={user.phone || "—"} disabled />
                </div>
              </div>

              <div className="pf-row">
                <div className="pf-field">
                  <label className="pf-label">Account status</label>
                  <div className="pf-status-row">
                    <span className={`pf-status-dot ${user.isVerified ? "verified" : "pending"}`} />
                    {user.isVerified ? "Verified" : "Pending verification"}
                  </div>
                </div>
                <div className="pf-field">
                  <label className="pf-label">Member since</label>
                  <input className="pf-input" value={formatDate(user.createdAt)} disabled />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="mc-empty">No profile data found.</p>
        )}
      </main>
    </div>
  );
}
