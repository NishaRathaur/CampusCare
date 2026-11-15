import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/AdminDashboard.css";

export default function WorkersList() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchWorkers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/workers");
      setWorkers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const filtered = useMemo(() => {
    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.trade.toLowerCase().includes(search.toLowerCase()) ||
        w.mobile.includes(search)
    );
  }, [workers, search]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/workers/${id}/status`, { isActive: !currentStatus });
      setWorkers((prev) => prev.map((w) => (w._id === id ? { ...w, isActive: !currentStatus } : w)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this worker? This can't be undone.")) return;
    try {
      await api.delete(`/workers/${id}`);
      setWorkers((prev) => prev.filter((w) => w._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete worker");
    }
  };

  return (
    <AdminLayout activePath="/admin/workers">
      <div className="admin-section-card">
        <div className="admin-list-header">
          <div className="admin-list-title-row">
            <h2 className="admin-section-title">Workers</h2>
            <button className="admin-add-btn" onClick={() => navigate("/admin/workers/add")}>
              + Add Worker
            </button>
          </div>

          <input
            className="admin-form-input admin-search-input"
            placeholder="Search by name, trade, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p className="admin-table-empty">Loading workers...</p>}
        {error && <p className="admin-form-status error">{error}</p>}

        {!loading && !error && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Mobile</th>
                  <th>Trade</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="admin-table-empty">
                      No workers found.
                    </td>
                  </tr>
                )}
                {filtered.map((w) => (
                  <tr key={w._id}>
                    <td>{w.name}</td>
                    <td>{w.mobile}</td>
                    <td>{w.trade}</td>
                    <td>{w.department || <span className="admin-table-muted">—</span>}</td>
                    <td>
                      <span className={`admin-status-badge ${w.isActive ? "resolved" : "pending"}`}>
                        {w.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-cell">
                        <button
                          className={`admin-status-toggle ${w.isActive ? "deactivate" : "activate"}`}
                          onClick={() => handleToggleStatus(w._id, w.isActive)}
                        >
                          {w.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button className="admin-icon-action danger" title="Delete" onClick={() => handleDelete(w._id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                          </svg>
                        </button>
                      </div>
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