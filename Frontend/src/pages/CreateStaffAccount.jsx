import { useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopbar from "../components/AdminTopbar";
import axios from "../api/axios";
import "../styles/AdminDashboard.css";

const ROLES = ["supervisor", "admin", "worker"];
const CATEGORIES = ["Hygiene", "Infrastructure", "Electrical", "Plumbing", "Wi-Fi / IT", "Safety", "Mess / Food"];

const initialForm = {
  name: "",
  email: "",
  role: "supervisor",
  department: "",
  designation: "",
  supervisorCategory: CATEGORIES[0],
  phone: "",
};

export default function CreateStaffAccount() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name || !form.email) {
      setError("Fill in name and email.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/users", form);
      setSuccess(data.message);
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create the account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar activePath="/admin/supervisors" />
      <div className="admin-main">
        <AdminTopbar title="Create staff account" tagline="Supervisor, admin, or worker accounts are created here." />

        <main className="admin-content">
          <div className="admin-section-card" style={{ maxWidth: 480 }}>
            <h2 className="admin-section-title">New account</h2>

            {error && <div className="auth-banner error">{error}</div>}
            {success && <div className="auth-banner success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Full name</label>
                <input className="field-input" name="name" value={form.name} onChange={handleChange} />
              </div>

              <div className="field-group">
                <label className="field-label">College email</label>
                <input className="field-input" name="email" type="email" value={form.email} onChange={handleChange} />
              </div>

              <div className="field-group">
                <label className="field-label">Role</label>
                <select className="field-select" name="role" value={form.role} onChange={handleChange}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>

              {form.role === "supervisor" && (
                <div className="field-group">
                  <label className="field-label">Category they handle</label>
                  <select className="field-select" name="supervisorCategory" value={form.supervisorCategory} onChange={handleChange}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div className="field-group">
                <label className="field-label">Department</label>
                <input className="field-input" name="department" value={form.department} onChange={handleChange} />
              </div>

              <div className="field-group">
                <label className="field-label">Phone number</label>
                <input className="field-input" name="phone" value={form.phone} onChange={handleChange} />
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Creating…" : "Create account & email credentials"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
