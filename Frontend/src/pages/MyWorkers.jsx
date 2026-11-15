import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import SupervisorLayout from "../components/SupervisorLayout";
import "../styles/SupervisorDashboard.css";

export default function MyWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/workers/mine");
        setWorkers(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load your workers");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const active = workers.filter((w) => w.isActive).length;
    return {
      total: workers.length,
      active,
      inactive: workers.length - active,
      trades: new Set(workers.map((w) => w.trade)).size,
    };
  }, [workers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter(
      (w) =>
        w.name?.toLowerCase().includes(q) ||
        w.trade?.toLowerCase().includes(q) ||
        w.mobile?.toLowerCase().includes(q)
    );
  }, [workers, search]);

  const initials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

  return (
    <SupervisorLayout>
      <div className="sv-section-card">
        <h2 className="sv-section-title">My Workers</h2>
        <p className="sv-section-subtitle">
          Everyone currently assigned to your team, at a glance.
        </p>

        {error && <p className="sv-status-error">{error}</p>}
        {loading && <p className="sv-empty">Loading your workers...</p>}

        {!loading && !error && (
          <>
            <div className="sv-stats-grid">
              <div className="sv-stat-card">
                <span className="sv-stat-value">{stats.total}</span>
                <span className="sv-stat-label">Total Workers</span>
              </div>
              <div className="sv-stat-card">
                <span className="sv-stat-value">{stats.active}</span>
                <span className="sv-stat-label">Active</span>
              </div>
              <div className="sv-stat-card">
                <span className="sv-stat-value">{stats.inactive}</span>
                <span className="sv-stat-label">Inactive</span>
              </div>
              <div className="sv-stat-card">
                <span className="sv-stat-value">{stats.trades}</span>
                <span className="sv-stat-label">Trades Covered</span>
              </div>
            </div>

            {workers.length > 0 && (
              <input
                className="sv-worker-search"
                placeholder="Search by name, trade, or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}

            {workers.length === 0 && (
              <p className="sv-empty">
                No workers have been added to your team yet. Ask an admin to assign workers to
                you.
              </p>
            )}

            {workers.length > 0 && filtered.length === 0 && (
              <p className="sv-empty">No workers match your search.</p>
            )}

            {filtered.length > 0 && (
              <div className="sv-worker-grid">
                {filtered.map((w) => (
                  <div key={w._id} className="sv-worker-card">
                    <div className="sv-worker-card-top">
                      <div className="sv-worker-avatar">{initials(w.name) || "?"}</div>
                      <span
                        className={`sv-worker-status-badge ${w.isActive ? "active" : "inactive"}`}
                      >
                        {w.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <h3 className="sv-worker-name">{w.name}</h3>
                    <span className="sv-worker-trade-badge">{w.trade}</span>

                    <div className="sv-worker-details">
                      <div className="sv-worker-detail-row">
                        <span className="sv-worker-detail-label">Mobile</span>
                        <span className="sv-worker-detail-value">{w.mobile || "—"}</span>
                      </div>
                      <div className="sv-worker-detail-row">
                        <span className="sv-worker-detail-label">Department</span>
                        <span className="sv-worker-detail-value">{w.department || "—"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </SupervisorLayout>
  );
}