import { useState, useRef, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import "../styles/StudentDashboard.css";
import mitsLogo from "../assets/mits.png";

const NAV_LINKS = [
  { key: "home", label: "Home", path: "/dashboard", icon: "home" },
  { key: "raise", label: "Raise Complaint", path: "/dashboard/raise", icon: "add" },
  { key: "complaints", label: "My Complaints", path: "/dashboard/complaints", icon: "list" },
];

const ICONS = {
  home: (
    <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H10v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7.5Z" />
  ),
  add: (
    <path d="M12 5v14M5 12h14" />
  ),
  list: (
    <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
  ),
  moon: (
    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
};

function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

export default function Navbar({ activePath = "/dashboard", darkMode, onToggleDarkMode }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [currentUser, setCurrentUser] = useState({ name: "", rollNo: "" });
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        // Handles both res.data.name (flat) and res.data.user.name (wrapped) shapes.
        const userData = res.data.user || res.data;
        setCurrentUser({
          name: userData?.name || "",
          rollNo: userData?.rollNo || "",
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setUserLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const initial = (currentUser.name || "").trim().charAt(0).toUpperCase() || "?";

  // Close the profile dropdown when clicking outside it.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-left" onClick={() => navigate("/dashboard")}>
        <img src={mitsLogo} alt="MITS" className="navbar-logo" />
        <span className="navbar-brand">Campus Care</span>
      </div>

      <nav className="navbar-links" aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <button
            key={link.key}
            className={`navbar-link ${activePath === link.path ? "active" : ""}`}
            onClick={() => navigate(link.path)}
            title={link.label}
          >
            <Icon name={link.icon} />
            <span className="navbar-link-label">{link.label}</span>
          </button>
        ))}
      </nav>

      <div className="navbar-right">
        <button
          className="navbar-icon-btn"
          onClick={onToggleDarkMode}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          <Icon name={darkMode ? "sun" : "moon"} />
        </button>

        <div className="navbar-profile" ref={menuRef}>
          <button
            className="navbar-avatar"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            disabled={userLoading}
          >
            {userLoading ? "…" : initial}
          </button>

          {menuOpen && (
            <div className="navbar-dropdown">
              <div className="navbar-dropdown-header">
                <p className="navbar-dropdown-name">{currentUser.name || "—"}</p>
                <p className="navbar-dropdown-roll">{currentUser.rollNo || "—"}</p>
              </div>
              <button
                className="navbar-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/dashboard/profile");
                }}
              >
                <Icon name="user" size={16} />
                Profile
              </button>

              <button
                className="navbar-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/dashboard/change-password");
                }}
              >
                <Icon name="lock" size={16} />
                Change Password
              </button>

              <button
                className="navbar-dropdown-item danger"
                onClick={handleLogout}
              >
                <Icon name="logout" size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}