import { useState, useEffect } from "react";
import api from "../api/axios";
import SupervisorLayout from "../components/SupervisorLayout";
import "../styles/SupervisorDashboard.css";

const DETAIL_ITEMS = [
  {
    key: "email",
    label: "Email",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
  },
  {
    key: "mobile",
    label: "Mobile",
    icon: (
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.6 1 1 0 0 1-.25 1Z" />
    ),
  },
  {
    key: "department",
    label: "Department",
    icon: (
      <>
        <path d="M3 21V8l9-5 9 5v13" />
        <path d="M9 21v-6h6v6" />
      </>
    ),
  },
  {
    key: "designation",
    label: "Designation",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
  },
];

export default function SupervisorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/auth/me");
        // Handles both res.data.user (wrapped) and res.data (flat) response shapes.
        const data = res.data.user || res.data;
        setProfile(data);
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't load your profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const initial = (profile?.name || "").trim().charAt(0).toUpperCase() || "?";

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <SupervisorLayout>
      <div className="sv-section-card sv-profile-wrap">
        {loading && <p className="sv-empty">Loading your profile...</p>}
        {error && <p className="sv-status-error">{error}</p>}

        {!loading && !error && profile && (
          <>
            <div className="sv-profile-hero">
              <div className="sv-profile-hero-avatar">{initial}</div>
              <div className="sv-profile-hero-info">
                <h2 className="sv-profile-hero-name">{profile.name}</h2>
                <div className="sv-profile-hero-badges">
                  <span className="sv-profile-badge sv-profile-badge-role">Supervisor</span>
                  <span
                    className={`sv-profile-badge ${
                      profile.isActive ? "sv-profile-badge-active" : "sv-profile-badge-inactive"
                    }`}
                  >
                    {profile.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {memberSince && (
                  <p className="sv-profile-hero-meta">Member since {memberSince}</p>
                )}
              </div>
            </div>

            <div className="sv-profile-grid">
              {DETAIL_ITEMS.map((item) => (
                <div key={item.key} className="sv-profile-detail-card">
                  <div className="sv-profile-detail-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {item.icon}
                    </svg>
                  </div>
                  <div>
                    <p className="sv-profile-detail-card-label">{item.label}</p>
                    <p className="sv-profile-detail-card-value">
                      {profile[item.key] || "Not provided"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </SupervisorLayout>
  );
}