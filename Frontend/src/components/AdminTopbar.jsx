import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

// Update with the real logged-in admin's info once you fetch it
// from GET /api/auth/me — placeholder for now.
const CURRENT_ADMIN = {
  name: "Tara Rathaur",
};

const ICONS = {
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
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

export default function AdminTopbar({
  title = "Campus care",
  tagline = "Quick reporting, faster solutions.",
  onMenuClick,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("adminDarkMode") === "true"
  );
  const menuRef = useRef(null);

  const initial = CURRENT_ADMIN.name.trim().charAt(0).toUpperCase();

  useEffect(() => {
    document.body.classList.toggle("admin-dark", darkMode);
    localStorage.setItem("adminDarkMode", darkMode);
  }, [darkMode]);

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
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button className="admin-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="admin-topbar-title">{title}</h1>
          <p className="admin-topbar-tagline">{tagline}</p>
        </div>
      </div>

      <div className="admin-topbar-actions">
        <button
          className="admin-icon-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <Icon name="bell" size={19} />
        </button>

        <button
          className="admin-icon-btn"
          onClick={() => setDarkMode((d) => !d)}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          <Icon name={darkMode ? "sun" : "moon"} size={19} />
        </button>

        <div className="admin-profile" ref={menuRef}>
          <button
            className="admin-profile-trigger"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <div className="admin-topbar-avatar">{initial}</div>
            <div className="admin-profile-text">
              <p className="admin-topbar-name">{CURRENT_ADMIN.name}</p>
              <p className="admin-topbar-role">Administrator</p>
            </div>
          </button>

          {menuOpen && (
                        <div className="admin-dropdown">
              <button
                className="admin-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/admin/profile");
                }}
              >
                <Icon name="user" size={16} />
                Profile
              </button>

              <button
                className="admin-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/admin/change-password");
                }}
              >
                <Icon name="lock" size={16} />
                Change Password
              </button>

              <button className="admin-dropdown-item danger" onClick={handleLogout}>
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