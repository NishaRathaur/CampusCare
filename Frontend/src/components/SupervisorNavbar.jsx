import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import mitsLogo from "../assets/mits.png";
import "../styles/SupervisorDashboard.css";

export default function SupervisorNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Seed from localStorage so the navbar isn't blank on first paint, then
  // overwrite with the live value from the database once the fetch resolves.
  const [userName, setUserName] = useState(localStorage.getItem("name") || "Supervisor");
  const [nameLoading, setNameLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        // Handles both res.data.user (wrapped) and res.data (flat) response shapes.
        const data = res.data.user || res.data;
        if (data?.name) {
          setUserName(data.name);
          localStorage.setItem("name", data.name); // keep cache in sync for next page load
        }
      } catch (err) {
        console.error("Failed to load live profile name", err);
        // Falls back to whatever localStorage had — not fatal, navbar still works.
      } finally {
        setNameLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const initial = (userName || "").trim().charAt(0).toUpperCase() || "?";

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  // ---------- Theme toggle ----------
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // ---------- Avatar dropdown ----------
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sv-navbar">
      <div className="sv-navbar-left" onClick={() => navigate("/supervisor")}>
        <img src={mitsLogo} alt="MITS" className="sv-logo-box" />
        <span className="sv-brand-text">Campus Care</span>
      </div>

      <nav className="sv-navbar-links">
        <button
          className={`sv-nav-link ${isActive("/supervisor") ? "active" : ""}`}
          onClick={() => navigate("/supervisor")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H10v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7.5Z" />
          </svg>
          Home
        </button>

        <button
          className={`sv-nav-link pill ${isActive("/supervisor/complaints") ? "active" : ""}`}
          onClick={() => navigate("/supervisor/complaints")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
          </svg>
          Assigned Complaints
        </button>

        <button
          className={`sv-nav-link ${isActive("/supervisor/workers") ? "active" : ""}`}
          onClick={() => navigate("/supervisor/workers")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="8" r="3.2" />
            <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
          </svg>
          My Workers
        </button>
      </nav>

      <div className="sv-navbar-right">
        <button
          className="sv-icon-btn"
          title="Toggle theme"
          onClick={toggleTheme}
        >
          {theme === "light" ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          )}
        </button>

        <button className="sv-icon-btn" title="Notifications">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        <div className="sv-avatar-menu-wrap" ref={menuRef}>
          <div
            className="sv-avatar-block"
            onClick={() => setMenuOpen((prev) => !prev)}
            title="Account menu"
          >
            <div className="sv-avatar-circle">{nameLoading ? "…" : initial}</div>
            <div className="sv-avatar-text">
              <span className="sv-avatar-name">{userName}</span>
              <span className="sv-avatar-role">Supervisor</span>
            </div>
          </div>

          {menuOpen && (
            <div className="sv-avatar-dropdown">
              <div className="sv-dropdown-header">
                <div className="sv-avatar-circle sv-avatar-circle-lg">
                  {nameLoading ? "…" : initial}
                </div>
                <div>
                  <p className="sv-dropdown-name">{userName}</p>
                  <p className="sv-dropdown-role">Supervisor</p>
                </div>
              </div>

              <div className="sv-dropdown-divider" />

              <button
                className="sv-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/supervisor/profile");
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                </svg>
                Profile
              </button>

              <button
                className="sv-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/supervisor/change-password");
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="11" width="16" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Change Password
              </button>

              <button
                className="sv-dropdown-item sv-dropdown-item-danger"
                onClick={handleLogout}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                Logout
              </button>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}