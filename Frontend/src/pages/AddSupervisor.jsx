import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";

export default function AddSupervisor() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "" });
  const [status, setStatus] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ text: "Sending...", type: "pending" });
    try {
      await api.post("/admin/add-supervisor", form);
      setStatus({ text: "Supervisor created — credentials emailed successfully.", type: "success" });
      setForm({ name: "", email: "" });
    } catch (err) {
      setStatus({ text: err.response?.data?.message || "Something went wrong", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout activePath="/admin/supervisors/add">
      <button className="admin-back-btn" onClick={() => navigate("/admin")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      <div className="admin-section-card">
        <h2 className="admin-section-title">Add Supervisor</h2>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">Supervisor name</label>
            <input className="admin-form-input" placeholder="e.g. Rahul Mehta"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Supervisor email</label>
            <input className="admin-form-input" type="email" placeholder="name@institute.edu"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <button className="admin-form-submit" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Add Supervisor"}
          </button>
          {status.text && <p className={`admin-form-status ${status.type}`}>{status.text}</p>}
        </form>
      </div>
    </AdminLayout>
  );
}