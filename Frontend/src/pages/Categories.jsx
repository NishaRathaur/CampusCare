import { useState, useEffect } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/AdminDashboard.css";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/categories", form);
      setForm({ name: "", description: "" });
      fetchCategories();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to add category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete category");
    }
  };

  return (
    <AdminLayout activePath="/admin/categories">
      <div className="admin-section-card" style={{ marginBottom: 20 }}>
        <h2 className="admin-section-title">Add Category</h2>
        <form className="admin-form" onSubmit={handleAdd}>
          <div className="admin-form-group">
            <label className="admin-form-label">Category name</label>
            <input
              className="admin-form-input"
              placeholder="e.g. Laundry, Library, Transport"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Description (optional)</label>
            <input
              className="admin-form-input"
              placeholder="Short description shown to students"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button className="admin-form-submit" type="submit" disabled={submitting}>
            {submitting ? "Adding..." : "Add Category"}
          </button>
          {formError && <p className="admin-form-status error">{formError}</p>}
        </form>
      </div>

      <div className="admin-section-card">
        <h2 className="admin-section-title">All Categories</h2>

        {loading && <p className="admin-table-empty">Loading categories...</p>}
        {error && <p className="admin-form-status error">{error}</p>}

        {!loading && !error && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="admin-table-empty">
                      No categories yet. Add one above.
                    </td>
                  </tr>
                )}
                {categories.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.description || <span className="admin-table-muted">—</span>}</td>
                    <td>
                      <button
                        className="admin-icon-action danger"
                        title="Delete"
                        onClick={() => handleDelete(c._id, c.name)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}