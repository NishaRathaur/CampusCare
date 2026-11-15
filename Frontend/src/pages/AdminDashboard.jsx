import AdminLayout from "../components/AdminLayout";

export default function AdminDashboard() {
  return (
    <AdminLayout activePath="/admin">
      <div className="admin-section-card">
        <h2 className="admin-section-title">New Complaints & Assignments</h2>
        <p style={{ color: "var(--ad-text-secondary)", fontSize: 13 }}>
          Complaint table with supervisor assignment dropdown will render here once
          connected to GET /api/complaints and the assign-supervisor endpoint.
        </p>
      </div>
    </AdminLayout>
  );
}