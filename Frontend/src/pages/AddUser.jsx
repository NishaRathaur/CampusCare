import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/AdminDashboard.css";

const ROLE_META = {
  student: { title: "Add Student", noun: "student", showDept: true, deptLabel: "Department/Branch" },
  faculty: { title: "Add Faculty", noun: "faculty member", showDept: true, deptLabel: "Department/Branch" },
  supervisor: { title: "Add Supervisor", noun: "supervisor", showDesignation: true, showDept: true, deptLabel: "Department" },
  worker: { title: "Add Worker", noun: "worker", showDesignation: true, showDept: true, deptLabel: "Department" },
};

export default function AddUser() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "student";
  const meta = ROLE_META[role] || ROLE_META.student;

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    department: "",
    designation: "",
  });
  const [status, setStatus] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ text: "Sending...", type: "pending" });
    try {
      await api.post("/users", { ...form, role });
      setStatus({ text: `${meta.noun[0].toUpperCase() + meta.noun.slice(1)} created — credentials emailed successfully.`, type: "success" });
      setForm({ name: "", email: "", mobile: "", department: "", designation: "" });
    } catch (err) {
      setStatus({ text: err.response?.data?.message || "Something went wrong", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout activePath="/admin/users">
      <button className="admin-back-btn" onClick={() => navigate("/admin/users")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Users List
      </button>

      <div className="admin-section-card">
        <h2 className="admin-section-title">{meta.title}</h2>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">Full name</label>
            <input
              className="admin-form-input"
              placeholder="e.g. Priya Sharma"
              value={form.name}
              onChange={update("name")}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Email</label>
            <input
              className="admin-form-input"
              type="email"
              placeholder="name@institute.edu"
              value={form.email}
              onChange={update("email")}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Mobile</label>
            <input
              className="admin-form-input"
              type="tel"
              placeholder="9876543210"
              value={form.mobile}
              onChange={update("mobile")}
            />
          </div>

          {meta.showDept && (
            <div className="admin-form-group">
              <label className="admin-form-label">{meta.deptLabel}</label>
              <input
                className="admin-form-input"
                placeholder="e.g. MCA, IT, Btech"
                value={form.department}
                onChange={update("department")}
                required
              />
            </div>
          )}

          {meta.showDesignation && (
            <div className="admin-form-group">
              <label className="admin-form-label">Designation</label>
              <input
                className="admin-form-input"
                placeholder="e.g. Senior Warden, Professor"
                value={form.designation}
                onChange={update("designation")}
                required
              />
            </div>
          )}

          <button className="admin-form-submit" type="submit" disabled={loading}>
            {loading ? "Sending..." : meta.title}
          </button>

          {status.text && <p className={`admin-form-status ${status.type}`}>{status.text}</p>}
        </form>
      </div>
    </AdminLayout>
  );
}