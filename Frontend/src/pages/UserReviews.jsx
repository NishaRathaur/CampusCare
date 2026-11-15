import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/UserReviews.css";

const RATING_FILTERS = [
  { key: "all", label: "All Feedback" },
  { key: "low", label: "Needs Attention (1–2★)" },
  { key: "high", label: "Positive (4–5★)" },
];

export default function UserReviews() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [closingId, setClosingId] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/complaints");
      setComplaints(res.data.complaints || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Only complaints that actually have feedback left on them.
  const feedbackItems = useMemo(
    () => complaints.filter((c) => c.feedback?.rating),
    [complaints]
  );

  const stats = useMemo(() => {
    if (feedbackItems.length === 0) {
      return { avg: "—", total: 0, positive: 0, needsAttention: 0, openNeedsAttention: 0 };
    }
    const total = feedbackItems.length;
    const sum = feedbackItems.reduce((s, c) => s + c.feedback.rating, 0);
    const positive = feedbackItems.filter((c) => c.feedback.rating >= 4).length;
    const needsAttention = feedbackItems.filter((c) => c.feedback.rating <= 2).length;
    const openNeedsAttention = feedbackItems.filter(
      (c) => c.feedback.rating <= 2 && c.status !== "closed"
    ).length;

    return {
      avg: (sum / total).toFixed(1),
      total,
      positive,
      needsAttention,
      openNeedsAttention,
    };
  }, [feedbackItems]);

  const filtered = useMemo(() => {
    if (ratingFilter === "low") return feedbackItems.filter((c) => c.feedback.rating <= 2);
    if (ratingFilter === "high") return feedbackItems.filter((c) => c.feedback.rating >= 4);
    return feedbackItems;
  }, [feedbackItems, ratingFilter]);

  const handleCloseComplaint = async (id) => {
    if (!window.confirm("Mark this complaint as fully closed? This confirms the issue needs no further action.")) {
      return;
    }
    setClosingId(id);
    try {
      await api.patch(`/complaints/${id}/status`, {
        status: "closed",
        remark: "Closed by admin after reviewing student/faculty feedback",
      });
      setComplaints((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: "closed" } : c))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to close complaint");
    } finally {
      setClosingId(null);
    }
  };

  return (
    <AdminLayout activePath="/admin/reviews">
      <div className="admin-section-card" style={{ marginBottom: 20 }}>
        <div className="admin-list-title-row">
          <h2 className="admin-section-title">Complaint Feedback</h2>
        </div>
        <p className="admin-section-subtitle">
          Feedback students and faculty left after their complaint was marked resolved —
          use this to confirm an issue was actually fixed before closing it for good.
        </p>

        <div className="admin-review-stats-grid">
          <div className="admin-review-stat-card">
            <span className="admin-review-stat-value">{stats.avg}</span>
            <span className="admin-review-stat-label">Average Rating</span>
          </div>
          <div className="admin-review-stat-card">
            <span className="admin-review-stat-value">{stats.total}</span>
            <span className="admin-review-stat-label">Total Feedback</span>
          </div>
          <div className="admin-review-stat-card">
            <span className="admin-review-stat-value">{stats.positive}</span>
            <span className="admin-review-stat-label">Positive (4–5★)</span>
          </div>
          <div className="admin-review-stat-card admin-review-stat-card-warning">
            <span className="admin-review-stat-value">{stats.openNeedsAttention}</span>
            <span className="admin-review-stat-label">Open &amp; Low-Rated</span>
          </div>
        </div>

        <div className="admin-priority-filters" style={{ marginTop: 16, marginBottom: 4 }}>
          {RATING_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`admin-filter-chip ${ratingFilter === f.key ? "active" : ""}`}
              onClick={() => setRatingFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && <p className="admin-table-empty">Loading feedback...</p>}
        {error && <p className="admin-form-status error">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <p className="admin-table-empty">No feedback matches this filter.</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="admin-review-grid">
            {filtered.map((c) => (
              <div key={c._id} className="admin-review-card">
                <div className="admin-review-card-top">
                  <div>
                    <p className="admin-review-name">
                      {c.isAnonymous ? "Anonymous" : c.raisedBy?.name || "Unknown"}
                    </p>
                    <p className="admin-review-role">{c.raisedBy?.role || "—"}</p>
                  </div>
                  <span
                    className={`admin-status-badge ${
                      c.status === "closed" ? "resolved" : "pending"
                    }`}
                  >
                    {c.status === "closed" ? "Closed" : "Awaiting Close"}
                  </span>
                </div>

                <p className="admin-review-complaint-title">{c.title}</p>
                <p className="admin-review-complaint-meta">
                  {c.category} · {c.location}
                </p>

                <div className="admin-review-stars">
                  {"★".repeat(c.feedback.rating)}
                  {"☆".repeat(5 - c.feedback.rating)}
                </div>
                <p className="admin-review-comment">
                  {c.feedback.comment || "No comment left."}
                </p>
                <p className="admin-review-date">
                  Resolved{" "}
                  {c.resolvedAt
                    ? new Date(c.resolvedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>

                {c.status !== "closed" && (
                  <button
                    className="admin-form-submit admin-review-close-btn"
                    disabled={closingId === c._id}
                    onClick={() => handleCloseComplaint(c._id)}
                  >
                    {closingId === c._id ? "Closing..." : "Close Complaint"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}