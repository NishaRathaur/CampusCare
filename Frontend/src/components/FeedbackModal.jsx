import { useState } from "react";
import axios from "../api/axios";
import "../styles/FeedbackModal.css";

const STAR_LABELS = ["Poor", "Fair", "Okay", "Good", "Excellent"];

export default function FeedbackModal({ complaint, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If a proof photo was uploaded, show it first and require the student to
  // acknowledge it before the rating form appears. If no photo exists, skip
  // straight to feedback so the flow isn't blocked by something optional.
  const [step, setStep] = useState(complaint?.resolvedPhotoUrl ? "photo" : "feedback");

  if (!complaint) return null;

  const resolvePhotoUrl = (url) =>
    url?.startsWith("http") ? url : `${import.meta.env.VITE_API_URL}${url}`;

  const handleSubmit = async () => {
    setError("");
    if (rating === 0) {
      setError("Tap a star to rate how the issue was resolved.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/complaints/${complaint._id}/feedback`, { rating, comment });
      onSubmitted(complaint._id);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit feedback. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const activeStars = hoverRating || rating;

  return (
    <div className="fb-overlay" role="dialog" aria-modal="true" aria-label="Complaint feedback">
      <div className="fb-modal">
        <button className="fb-close" onClick={() => onClose(complaint._id)} aria-label="Close">
          ×
        </button>

        <div className="fb-header">
          <div className="fb-logo">CC</div>
          <div>
            <p className="fb-header-title">Campus Care Feedback</p>
            <p className="fb-header-subtitle">
              {step === "photo" ? "Here's proof the issue was fixed." : "Help us know how the fix went."}
            </p>
          </div>
        </div>

        <p className="fb-section-label">Resolved complaint</p>
        <p className="fb-complaint-title">{complaint.title}</p>
        <div className="fb-complaint-meta">
          <span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {complaint.location}
          </span>
          <span className="fb-category-tag">{complaint.category}</span>
        </div>

        {step === "photo" ? (
          <>
            <div className="fb-photo-wrap">
              <img
                src={resolvePhotoUrl(complaint.resolvedPhotoUrl)}
                alt="Proof the issue was resolved"
                className="fb-photo-img"
              />
            </div>
            <p className="fb-photo-caption">
              Uploaded by your supervisor as proof the issue was resolved.
            </p>

            <div className="fb-actions">
              <button className="fb-btn-secondary" onClick={() => onClose(complaint._id)}>
                Not now
              </button>
              <button className="fb-btn-primary" onClick={() => setStep("feedback")}>
                Looks Good, Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="fb-stars" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="fb-star-btn"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                >
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill={star <= activeStars ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className={star <= activeStars ? "fb-star-filled" : "fb-star-empty"}
                  >
                    <path d="M12 2 9.5 8.5 3 12l6.5 3.5L12 22l2.5-6.5L21 12l-6.5-3.5Z" />
                  </svg>
                </button>
              ))}
            </div>
            {activeStars > 0 && <p className="fb-star-label">{STAR_LABELS[activeStars - 1]}</p>}

            <textarea
              className="fb-comment"
              placeholder="How was the repair quality? (optional)"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            {error && <p className="fb-error">{error}</p>}

            <div className="fb-actions">
              {complaint.resolvedPhotoUrl ? (
                <button className="fb-btn-secondary" onClick={() => setStep("photo")}>
                  Back
                </button>
              ) : (
                <button className="fb-btn-secondary" onClick={() => onClose(complaint._id)}>
                  Not now
                </button>
              )}
              <button className="fb-btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Submitting…" : "Submit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}