import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import FeedbackModal from "../components/FeedbackModal";
import axios from "../api/axios";
import "../styles/StudentDashboard.css";

// Complaints the student dismissed with "Not now" this session —
// stops the modal from nagging again on every page reload.
const DISMISSED_KEY = "cc_dismissed_feedback_ids";

const STAT_META = [
  { key: "total", label: "Total Complaints", icon: "list" },
  { key: "pending", label: "Pending", icon: "home" },
  { key: "resolved", label: "Resolved", icon: "add" },
];

export default function StudentDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [feedbackQueue, setFeedbackQueue] = useState([]);

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pulled from localStorage, saved there at login.
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const firstName = storedUser?.name?.split(" ")[0] || "there";

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await axios.get("/complaints");
        setComplaints(data.complaints || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load your complaints");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  // Check for resolved complaints that still need feedback.
  useEffect(() => {
    const checkPendingFeedback = async () => {
      try {
        const { data } = await axios.get("/complaints?status=resolved");
        const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");

        const needsFeedback = (data.complaints || []).filter(
          (c) => !c.feedback?.rating && !dismissed.includes(c._id)
        );

        setFeedbackQueue(needsFeedback);
      } catch {
        // If this check fails, just skip it silently — not critical to page load.
      }
    };

    checkPendingFeedback();
  }, []);

  const currentFeedbackTarget = feedbackQueue[0] || null;

  const handleDismiss = (complaintId) => {
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed, complaintId]));
    setFeedbackQueue((q) => q.filter((c) => c._id !== complaintId));
  };

  const handleSubmitted = (complaintId) => {
    setFeedbackQueue((q) => q.filter((c) => c._id !== complaintId));
  };

  // Derive stat counts from the real complaint list.
  const statValues = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    resolved: complaints.filter((c) => c.status === "resolved" || c.status === "closed").length,
  };

  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className={`dashboard-page ${darkMode ? "dashboard-dark" : ""}`}>
      <Navbar
        activePath="/dashboard"
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
      />

      <main className="dashboard-content">
        <div className="dashboard-welcome">
          <div>
            <h1 className="dashboard-welcome-title">Welcome back, {firstName}!</h1>
            <p className="dashboard-welcome-subtitle">Here's what's happening with your complaints.</p>
          </div>
          <button className="dashboard-cta">+ Raise a complaint</button>
        </div>

        <div className="dashboard-stats">
          {STAT_META.map((stat) => (
            <div className="dashboard-stat-card" key={stat.key}>
              <div className="dashboard-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <div>
                <p className="dashboard-stat-label">{stat.label}</p>
                <p className="dashboard-stat-value">{loading ? "—" : statValues[stat.key]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-section">
          <h2 className="dashboard-section-title">Your recent complaints</h2>

          {loading && (
            <p style={{ color: "var(--sd-text-secondary)", fontSize: 13 }}>Loading your complaints...</p>
          )}

          {!loading && error && (
            <p style={{ color: "var(--sd-text-secondary)", fontSize: 13 }}>{error}</p>
          )}

          {!loading && !error && recentComplaints.length === 0 && (
            <p style={{ color: "var(--sd-text-secondary)", fontSize: 13 }}>
              You haven't raised any complaints yet.
            </p>
          )}

          {!loading && !error && recentComplaints.length > 0 && (
            <ul className="dashboard-complaint-list">
              {recentComplaints.map((c) => (
                <li className="dashboard-complaint-item" key={c._id}>
                  <div>
                    <p className="dashboard-complaint-title">{c.title || "Untitled complaint"}</p>
                    <p className="dashboard-complaint-meta">
                      {c.category?.name || "Uncategorized"} ·{" "}
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <span className={`dashboard-status-badge status-${c.status}`}>{c.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {currentFeedbackTarget && (
        <FeedbackModal
          complaint={currentFeedbackTarget}
          onClose={handleDismiss}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  );
}