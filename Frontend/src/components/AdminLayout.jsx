import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import "../styles/AdminDashboard.css";

export default function AdminLayout({ activePath, title, tagline, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-layout">
      <AdminSidebar
        activePath={activePath}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <div className="admin-main">
        <AdminTopbar
          title={title}
          tagline={tagline}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}