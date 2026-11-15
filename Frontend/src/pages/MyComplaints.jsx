import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import axios from "../api/axios";
import FeedbackModal from "../components/FeedbackModal";
import "../styles/StudentDashboard.css";
import "../styles/MyComplaints.css";

const STATUS_LABELS = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Completed",
  reopened: "Reopened",
};

const STATUS_CLASS = {
  pending: "mc-badge-pending",
  assigned: "mc-badge-progress",
  in_progress: "mc-badge-progress",
  resolved: "mc-badge-completed",
  closed: "mc-badge-completed",
  reopened: "mc-badge-pending",
};

const FILTERS = ["all", "pending", "in_progress", "resolved", "closed"];

export default function MyComplaints() {
  const [darkMode, setDarkMode] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackComplaint, setFeedbackComplaint] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null); // { url, title } or null

  const resolvePhotoUrl = (url) =>
    url?.startsWith("http") ? url : `${import.meta.env.VITE_API_URL}${url}`;

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      setError("");
      try {
        const query = filter !== "all" ? `?status=${filter}` : "";
        const { data } = await axios.get(`/complaints${query}`);
        const list = data.complaints || [];
        setComplaints(list);

        // Auto-open the modal for the first resolved/closed complaint that
        // hasn't been given feedback yet and hasn't been dismissed.
        const pendingFeedback = list.find(
          (c) =>
            (c.status === "resolved" || c.status === "closed") &&
            !c.feedback?.rating &&
            !c.feedbackDismissed
        );
        setFeedbackComplaint(pendingFeedback || null);
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't load your complaints.");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [filter]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setViewingPhoto(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    const d = new Date(isoString);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "numeric", year: "numeric" });
  };

  const isResolvedOrClosed = (status) => status === "resolved" || status === "closed";

  const handleFeedbackClose = async (id) => {
    setFeedbackComplaint(null);
    try {
      await axios.patch(`/complaints/${id}/dismiss-feedback`);
      setComplaints((prev) =>
        prev.map((c) => (c._id === id ? { ...c, feedbackDismissed: true } : c))
      );
    } catch (err) {
      // Non-critical if this fails silently — worst case the prompt reappears next visit
      console.error("Couldn't save dismissal:", err);
    }
  };

  const handleFeedbackSubmitted = (id) => {
    setFeedbackComplaint(null);
    setComplaints((prev) =>
      prev.map((c) => (c._id === id ? { ...c, feedback: { rating: 1 } } : c))
    );
  };

  return (
    <div className={`dashboard-page ${darkMode ? "dashboard-dark" : ""}`}>
      <Navbar
        activePath="/dashboard/complaints"
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
      />

      <main className="dashboard-content">
        <div className="mc-card">
          <div className="mc-header">
            <h1 className="mc-title">My Reported Complaints</h1>

            <div className="mc-filters">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className={`mc-filter-btn ${filter === f ? "active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : STATUS_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="auth-banner error">{error}</div>}

          {loading ? (
            <p className="mc-empty">Loading your complaints…</p>
          ) : complaints.length === 0 ? (
            <p className="mc-empty">
              You haven't reported anything yet. Use "Raise Complaint" to submit one.
            </p>
          ) : (
            <div className="mc-table-wrap">
              <table className="mc-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Reported On</th>
                    <th>Resolved On</th>
                    <th>Status</th>
                    <th>Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c._id}>
                      <td>{c.title}</td>
                      <td>{c.category}</td>
                      <td>{c.location}</td>
                      <td>{formatDate(c.createdAt)}</td>
                      <td>
                        {isResolvedOrClosed(c.status) ? (
                          formatDate(c.resolvedAt)
                        ) : (
                          <span className="mc-table-muted">Not yet</span>
                        )}
                      </td>
                      <td>
                        <span className={`mc-badge ${STATUS_CLASS[c.status]}`}>
                          {STATUS_LABELS[c.status]}
                        </span>
                      </td>
                      <td>
                        {c.resolvedPhotoUrl ? (
                          <button
                            type="button"
                            className="mc-filter-btn"
                            onClick={() =>
                              setViewingPhoto({
                                url: resolvePhotoUrl(c.resolvedPhotoUrl),
                                title: `${c.title} — Resolved`,
                              })
                            }
                          >
                            View Proof
                          </button>
                        ) : (
                          <span className="mc-table-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {feedbackComplaint && (
        <FeedbackModal
          complaint={feedbackComplaint}
          onClose={handleFeedbackClose}
          onSubmitted={handleFeedbackSubmitted}
        />
      )}

      {viewingPhoto && (
        <div
          onClick={() => setViewingPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,16,26,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              maxWidth: 640,
              width: "100%",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1f2340" }}>
                {viewingPhoto.title}
              </span>
              <button
                type="button"
                onClick={() => setViewingPhoto(null)}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 18,
                  color: "#6b7280",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
              >
                ✕
              </button>
            </div>
            <img
              src={viewingPhoto.url}
              alt={viewingPhoto.title}
              style={{
                width: "100%",
                maxHeight: "calc(85vh - 56px)",
                objectFit: "contain",
                display: "block",
                background: "#000",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}