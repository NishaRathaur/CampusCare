import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import SupervisorLayout from "../components/SupervisorLayout";
import "../styles/SupervisorDashboard.css";


export default function SupervisorDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    unassigned: 0,
    workerCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const supervisorName = localStorage.getItem("userName") || "Supervisor"; // adjust if stored differently

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // /workers/mine derives the supervisor from the auth token server-side —
        // consistent with SupervisorComplaints.jsx and MyWorkers.jsx.
        const [complaintsRes, workersRes] = await Promise.all([
          api.get("/complaints/supervisor"),
          api.get("/workers/mine"),
        ]);

        const complaints = complaintsRes.data || [];
        setStats({
          total: complaints.length,
          pending: complaints.filter((c) => c.status === "pending").length,
          inProgress: complaints.filter((c) => c.status === "in_progress").length,
          resolved: complaints.filter((c) => c.status === "resolved").length,
          unassigned: complaints.filter((c) => !c.assignedWorker).length,
          workerCount: (workersRes.data || []).length,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <SupervisorLayout>
      <div className="sv-section-card">
        <h2 className="sv-section-title">Welcome back, {supervisorName}</h2>
        <p className="sv-section-subtitle">
          Here's a quick overview of the complaints assigned to you.
        </p>

        {error && <p className="sv-status-error">{error}</p>}
        {loading && <p className="sv-empty">Loading overview...</p>}

        {!loading && !error && (
          <>
            <div className="sv-stats-grid">
              <div className="sv-stat-card">
                <span className="sv-stat-value">{stats.total}</span>
                <span className="sv-stat-label">Total Complaints</span>
              </div>
              <div className="sv-stat-card">
                <span className="sv-stat-value">{stats.pending}</span>
                <span className="sv-stat-label">Pending</span>
              </div>
              <div className="sv-stat-card">
                <span className="sv-stat-value">{stats.inProgress}</span>
                <span className="sv-stat-label">In Progress</span>
              </div>
              <div className="sv-stat-card">
                <span className="sv-stat-value">{stats.resolved}</span>
                <span className="sv-stat-label">Resolved</span>
              </div>
              <div className="sv-stat-card">
                <span className="sv-stat-value">{stats.unassigned}</span>
                <span className="sv-stat-label">Awaiting Worker</span>
              </div>
              <div className="sv-stat-card">
                <span className="sv-stat-value">{stats.workerCount}</span>
                <span className="sv-stat-label">Workers In Your Team</span>
              </div>
            </div>

            <Link to="/supervisor/complaints" className="sv-view-complaints-btn">
              View & Manage Complaints
            </Link>
          </>
        )}
      </div>
    </SupervisorLayout>
  );
}