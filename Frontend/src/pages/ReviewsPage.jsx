import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import axios from "../api/axios";
import "../styles/StudentDashboard.css";

export default function ReviewsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 0, comment: "" });
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/reviews");
      setReviews(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.rating === 0 || !form.comment.trim()) {
      setError("Please add a rating and a comment.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post("/reviews", form);
      setForm({ rating: 0, comment: "" });
      fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeStars = hoverRating || form.rating;

  return (
    <div className={`dashboard-page ${darkMode ? "dashboard-dark" : ""}`}>
      <Navbar activePath="/dashboard/reviews" darkMode={darkMode} onToggleDarkMode={() => setDarkMode((d) => !d)} />

      <main className="dashboard-content">
        <div className="mc-card" style={{ marginBottom: 20 }}>
          <h1 className="mc-title">Share Your Experience</h1>
          <form onSubmit={handleSubmit} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setForm({ ...form, rating: star })}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 26, color: star <= activeStars ? "#dd8b1f" : "#c7c7d1" }}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              placeholder="What's your experience with Campus Care been like?"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #e6e6ee)", fontSize: 13.5 }}
            />
            {error && <p style={{ color: "#c0392b", fontSize: 13 }}>{error}</p>}
            <button type="submit" disabled={submitting} className="mc-filter-btn active" style={{ alignSelf: "flex-start", padding: "10px 20px" }}>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>

        <div className="mc-card">
          <h2 className="mc-title" style={{ fontSize: 17 }}>What others are saying</h2>
          {loading ? (
            <p className="mc-empty">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="mc-empty">No reviews yet. Be the first to share!</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginTop: 12 }}>
              {reviews.map((r) => (
                <div key={r._id} style={{ border: "1px solid var(--border-color, #e6e6ee)", borderRadius: 10, padding: 16 }}>
                  <p style={{ fontWeight: 700, fontSize: 13.5, margin: 0 }}>{r.user?.name}</p>
                  <p style={{ fontSize: 11, color: "#6b6b7b", textTransform: "capitalize", margin: "2px 0 8px" }}>{r.user?.role}</p>
                  <div style={{ color: "#dd8b1f", marginBottom: 6 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  <p style={{ fontSize: 13, lineHeight: 1.5 }}>{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}