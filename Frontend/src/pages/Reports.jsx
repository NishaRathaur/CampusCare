import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/Reports.css";

const STATUS_META = {
  pending: { label: "Pending", color: "#dd8b1f" },
  assigned: { label: "Pending", color: "#dd8b1f" },
  in_progress: { label: "In Progress", color: "#3b4bdb" },
  resolved: { label: "Resolved", color: "#1c8a4b" },
  closed: { label: "Completed", color: "#1c8a4b" },
  reopened: { label: "Reopened", color: "#c0392b" },
};

const PRIORITY_META = {
  high: { label: "High", color: "#c0392b" },
  medium: { label: "Medium", color: "#dd8b1f" },
  low: { label: "Low", color: "#1c8a4b" },
};

export default function Reports() {
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [complaintsRes, workersRes, supervisorsRes] = await Promise.all([
          api.get("/complaints"),
          api.get("/workers"),
          api.get("/users?role=supervisor"),
        ]);
        setComplaints(complaintsRes.data.complaints || []);
        setWorkers(workersRes.data || []);
        setSupervisors(supervisorsRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't load report data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const total = complaints.length;

    // Group by real status for counting, but merge "assigned" into "pending"
    // for the collapsed status bar (matches how the complaint list displays it).
    const statusCounts = {};
    complaints.forEach((c) => {
      const key = c.status === "assigned" ? "pending" : c.status;
      statusCounts[key] = (statusCounts[key] || 0) + 1;
    });

    const priorityCounts = { high: 0, medium: 0, low: 0 };
    complaints.forEach((c) => {
      if (priorityCounts[c.priority] !== undefined) priorityCounts[c.priority] += 1;
    });

    const categoryCounts = {};
    complaints.forEach((c) => {
      const cat = c.category || "Uncategorized";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const closedComplaints = complaints.filter(
      (c) => (c.status === "resolved" || c.status === "closed") && c.resolvedAt
    );
    const resolvedRate = total ? Math.round((closedComplaints.length / total) * 100) : 0;

    const avgResolutionDays = closedComplaints.length
      ? (
          closedComplaints.reduce((sum, c) => {
            const diffMs = new Date(c.resolvedAt) - new Date(c.createdAt);
            return sum + diffMs / (1000 * 60 * 60 * 24);
          }, 0) / closedComplaints.length
        ).toFixed(1)
      : "—";

    const feedbackItems = complaints.filter((c) => c.feedback?.rating);
    const avgFeedback = feedbackItems.length
      ? (
          feedbackItems.reduce((sum, c) => sum + c.feedback.rating, 0) / feedbackItems.length
        ).toFixed(1)
      : "—";

    const activeWorkers = workers.filter((w) => w.isActive).length;
    const tradeCounts = {};
    workers.forEach((w) => {
      tradeCounts[w.trade] = (tradeCounts[w.trade] || 0) + 1;
    });
    const topTrades = Object.entries(tradeCounts).sort((a, b) => b[1] - a[1]);

    return {
      total,
      statusCounts,
      priorityCounts,
      topCategories,
      resolvedRate,
      avgResolutionDays,
      avgFeedback,
      feedbackCount: feedbackItems.length,
      activeWorkers,
      totalWorkers: workers.length,
      topTrades,
      totalSupervisors: supervisors.length,
    };
  }, [complaints, workers, supervisors]);

  // Build a conic-gradient string for the status donut chart.
  const donutGradient = useMemo(() => {
    const order = ["pending", "in_progress", "resolved", "reopened"];
    const total = stats.total || 1;
    let cursor = 0;
    const segments = [];

    order.forEach((key) => {
      const count = stats.statusCounts[key] || 0;
      if (count === 0) return;
      const pct = (count / total) * 100;
      const meta = STATUS_META[key];
      segments.push(`${meta.color} ${cursor}% ${cursor + pct}%`);
      cursor += pct;
    });

    if (segments.length === 0) return "#e5e7eb 0% 100%";
    return segments.join(", ");
  }, [stats]);

  return (
    <AdminLayout activePath="/admin/reports">
      <div className="admin-section-card" style={{ marginBottom: 20 }}>
        <h2 className="admin-section-title">Reports &amp; Analytics</h2>
        <p className="admin-section-subtitle">
          A live snapshot of complaint activity, resolution performance, and team capacity.
        </p>

        {loading && <p className="admin-table-empty">Loading report data...</p>}
        {error && <p className="admin-form-status error">{error}</p>}

        {!loading && !error && (
          <>
            {/* Top-line KPI cards */}
            <div className="ar-kpi-grid">
              <div className="ar-kpi-card">
                <span className="ar-kpi-value">{stats.total}</span>
                <span className="ar-kpi-label">Total Complaints</span>
              </div>
              <div className="ar-kpi-card ar-kpi-card-accent">
                <span className="ar-kpi-value">{stats.resolvedRate}%</span>
                <span className="ar-kpi-label">Resolved Rate</span>
              </div>
              <div className="ar-kpi-card">
                <span className="ar-kpi-value">{stats.avgResolutionDays}</span>
                <span className="ar-kpi-label">Avg. Days to Resolve</span>
              </div>
              <div className="ar-kpi-card">
                <span className="ar-kpi-value">
                  {stats.avgFeedback}
                  {stats.avgFeedback !== "—" && "★"}
                </span>
                <span className="ar-kpi-label">Avg. Feedback ({stats.feedbackCount})</span>
              </div>
            </div>

            <div className="ar-two-col">
              {/* Status donut + legend */}
              <div className="ar-panel">
                <h3 className="ar-panel-title">Complaints by Status</h3>
                <div className="ar-donut-row">
                  <div
                    className="ar-donut"
                    style={{ background: `conic-gradient(${donutGradient})` }}
                  >
                    <div className="ar-donut-center">
                      <span className="ar-donut-center-value">{stats.total}</span>
                      <span className="ar-donut-center-label">Total</span>
                    </div>
                  </div>
                  <div className="ar-legend">
                    {["pending", "in_progress", "resolved", "reopened"].map((key) => {
                      const count = stats.statusCounts[key] || 0;
                      const meta = STATUS_META[key];
                      return (
                        <div key={key} className="ar-legend-row">
                          <span
                            className="ar-legend-dot"
                            style={{ background: meta.color }}
                          />
                          <span className="ar-legend-label">{meta.label}</span>
                          <span className="ar-legend-value">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Priority breakdown bars */}
              <div className="ar-panel">
                <h3 className="ar-panel-title">Complaints by Priority</h3>
                <div className="ar-bar-list">
                  {["high", "medium", "low"].map((key) => {
                    const count = stats.priorityCounts[key];
                    const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                    const meta = PRIORITY_META[key];
                    return (
                      <div key={key} className="ar-bar-row">
                        <div className="ar-bar-row-top">
                          <span>{meta.label}</span>
                          <span>{count}</span>
                        </div>
                        <div className="ar-bar-track">
                          <div
                            className="ar-bar-fill"
                            style={{ width: `${pct}%`, background: meta.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="ar-two-col">
              {/* Top categories */}
              <div className="ar-panel">
                <h3 className="ar-panel-title">Top Complaint Categories</h3>
                {stats.topCategories.length === 0 ? (
                  <p className="admin-table-empty">No complaints yet.</p>
                ) : (
                  <div className="ar-bar-list">
                    {stats.topCategories.map(([category, count]) => {
                      const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                      return (
                        <div key={category} className="ar-bar-row">
                          <div className="ar-bar-row-top">
                            <span>{category}</span>
                            <span>{count}</span>
                          </div>
                          <div className="ar-bar-track">
                            <div
                              className="ar-bar-fill ar-bar-fill-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Team capacity */}
              <div className="ar-panel">
                <h3 className="ar-panel-title">Team Capacity</h3>
                <div className="ar-team-stats">
                  <div className="ar-team-stat">
                    <span className="ar-team-stat-value">{stats.totalSupervisors}</span>
                    <span className="ar-team-stat-label">Supervisors</span>
                  </div>
                  <div className="ar-team-stat">
                    <span className="ar-team-stat-value">
                      {stats.activeWorkers}/{stats.totalWorkers}
                    </span>
                    <span className="ar-team-stat-label">Active Workers</span>
                  </div>
                </div>

                {stats.topTrades.length > 0 && (
                  <div className="ar-bar-list" style={{ marginTop: 16 }}>
                    {stats.topTrades.map(([trade, count]) => {
                      const pct = stats.totalWorkers
                        ? Math.round((count / stats.totalWorkers) * 100)
                        : 0;
                      return (
                        <div key={trade} className="ar-bar-row">
                          <div className="ar-bar-row-top">
                            <span>{trade}</span>
                            <span>{count}</span>
                          </div>
                          <div className="ar-bar-track">
                            <div
                              className="ar-bar-fill ar-bar-fill-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}