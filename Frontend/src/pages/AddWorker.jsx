import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/AdminDashboard.css";

export default function AddWorker() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", mobile: "", trade: "", department: "" });
  const [status, setStatus] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ text: "Saving...", type: "pending" });
    try {
      await api.post("/workers", form);
      setStatus({ text: "Worker added successfully.", type: "success" });
      setForm({ name: "", mobile: "", trade: "", department: "" });
    } catch (err) {
      setStatus({ text: err.response?.data?.message || "Something went wrong", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout activePath="/admin/workers">
      <button className="admin-back-btn" onClick={() => navigate("/admin/workers")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Workers List
      </button>

      <div className="admin-section-card">
        <h2 className="admin-section-title">Add Worker</h2>
        <p className="admin-role-prompt">
          Workers don't log in to Campus Care — they're assigned tasks directly by supervisors.
        </p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">Full name</label>
            <input
              className="admin-form-input"
              placeholder="e.g. Ramesh Kumar"
              value={form.name}
              onChange={update("name")}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Mobile number</label>
            <input
              className="admin-form-input"
              type="tel"
              placeholder="9876543210"
              value={form.mobile}
              onChange={update("mobile")}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Trade / role</label>
            <input
              className="admin-form-input"
              placeholder="e.g. Plumber, Electrician, Cleaner"
              value={form.trade}
              onChange={update("trade")}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Department (optional)</label>
            <input
              className="admin-form-input"
              placeholder="e.g. Hostel Block B, Maintenance"
              value={form.department}
              onChange={update("department")}
            />
          </div>

          <button className="admin-form-submit" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Add Worker"}
          </button>

          {status.text && <p className={`admin-form-status ${status.type}`}>{status.text}</p>}
        </form>
      </div>
    </AdminLayout>
  );
}