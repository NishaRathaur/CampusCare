import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";
import mitsLogo from "../assets/mits.png";

const NAV_SECTIONS = [
  { items: [{ key: "home", label: "Dashboard", path: "/admin", icon: "home" }] },
  {
    title: "Complaints",
    items: [
      { key: "complaints", label: "Complaint List", path: "/admin/complaints", icon: "list" },
      { key: "categories", label: "Categories", path: "/admin/categories", icon: "tag" },
    ],
  },
  {
    title: "People",
    items: [
      { key: "users", label: "Users List", path: "/admin/users", icon: "users" },
      //{ key: "supervisors", label: "Supervisor List", path: "/admin/supervisors", icon: "shield" },
      //{ key: "addSupervisor", label: "Add Supervisor", path: "/admin/supervisors/add", icon: "userPlus" },
      { key: "workers", label: "Workers List", path: "/admin/workers", icon: "tool" },
      { key: "workerGroups", label: "Worker Groups", path: "/admin/worker-groups", icon: "group" },
    ],
  },
  {
    title: "Insights",
    items: [
      { key: "reviews", label: "User Reviews", path: "/admin/reviews", icon: "star" },
      { key: "reports", label: "Reports & Analytics", path: "/admin/reports", icon: "chart" },
    ],
  },
];

const ICONS = {
  home: <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H10v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7.5Z" />,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  tag: <path d="M20.6 12.6 12.7 20.5a2 2 0 0 1-2.8 0L3.5 14.1a2 2 0 0 1 0-2.8L11.4 3.4A2 2 0 0 1 12.8 3H19a2 2 0 0 1 2 2v6.2a2 2 0 0 1-.4 1.4ZM16 8h.01" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
      <path d="M16.5 4.8a3.2 3.2 0 0 1 0 6.2M20.5 20c0-2.8-1.9-4.9-4.5-5.7" />
    </>
  ),
  shield: <path d="M12 3 5 6v6c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6l-7-3Z" />,
  userPlus: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
      <path d="M18 8v6M15 11h6" />
    </>
  ),
  tool: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z" />,
  star: <path d="M12 2 9.5 8.5 3 12l6.5 3.5L12 22l2.5-6.5L21 12l-6.5-3.5Z" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  group: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
};

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export default function AdminSidebar({ activePath = "/admin", mobileOpen = false, onClose }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const go = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <aside className={`admin-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <button className="admin-sidebar-close" onClick={onClose} aria-label="Close menu">
        <Icon name="close" size={18} />
      </button>

      <div className="admin-sidebar-brand" onClick={() => go("/admin")}>
        <img src={mitsLogo} alt="MITS" className="admin-sidebar-logo" />
        <span className="admin-sidebar-brand-text">Campus Care</span>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV_SECTIONS.map((section, i) => (
          <div className="admin-sidebar-section" key={i}>
            {section.title && <p className="admin-sidebar-section-title">{section.title}</p>}
            {section.items.map((item) => (
              <button
                key={item.key}
                className={`admin-sidebar-item ${activePath === item.path ? "active" : ""}`}
                onClick={() => go(item.path)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <button className="admin-sidebar-item admin-sidebar-logout" onClick={handleLogout}>
        <Icon name="logout" />
        <span>Logout</span>
      </button>
    </aside>
  );
}