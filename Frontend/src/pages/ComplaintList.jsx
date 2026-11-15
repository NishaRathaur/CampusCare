import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import ExportReportModal from "../components/ExportReportModal";
import "../styles/ComplainList.css";

const PRIORITY_LABEL = { high: "High", medium: "Medium", low: "Low" };

const STATUS_LABEL = {
  pending: "Pending",
  assigned: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Completed",
  reopened: "Reopened",
};

const STATUS_BADGE_CLASS = {
  pending: "pending",
  assigned: "pending",
  in_progress: "in_progress",
  resolved: "resolved",
  closed: "resolved",
  reopened: "reopened",
};

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function ComplaintList() {
  const [complaints, setComplaints] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [assigningId, setAssigningId] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null); // { url, title } or null
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [complaintsRes, supervisorsRes] = await Promise.all([
          api.get("/complaints"),
          api.get("/users?role=supervisor"),
        ]);
        setComplaints(complaintsRes.data.complaints || []);
        setSupervisors(supervisorsRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't load complaints.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;
      const matchesSearch =
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.raisedBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c._id?.toLowerCase().includes(search.toLowerCase());
      return matchesPriority && matchesSearch;
    });
  }, [complaints, priorityFilter, search]);

  // Derived from `complaints`, not a separate copy — so any update (assigning
  // a supervisor, etc.) is reflected in the open drawer immediately.
  const selectedComplaint = useMemo(
    () => complaints.find((c) => c._id === selectedId) || null,
    [complaints, selectedId]
  );

  const resolvePhotoUrl = (url) =>
    url?.startsWith("http") ? url : `${import.meta.env.VITE_API_URL}${url}`;

  const handleAssign = async (id, supervisorId) => {
    setAssigningId(id);
    try {
      const res = await api.patch(`/complaints/${id}/assign`, { supervisorId });
      const updated = res.data.complaint;
      setComplaints((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, assignedTo: updated.assignedTo, status: updated.status } : c
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign supervisor.");
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <AdminLayout activePath="/admin/complaints">
      <div className="admin-section-card">
        <div className="admin-list-header">
          <h2 className="admin-section-title">New Complaints & Assignments</h2>

          <div className="admin-list-controls">
            <input
              className="admin-form-input admin-search-input"
              placeholder="Search by ID, user, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="admin-priority-filters">
              {["all", "high", "medium", "low"].map((p) => (
                <button
                  key={p}
                  className={`admin-filter-chip ${priorityFilter === p ? "active" : ""} ${p !== "all" ? p : ""}`}
                  onClick={() => setPriorityFilter(p)}
                >
                  {p === "all" ? "All" : PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="admin-export-btn"
              onClick={() => setShowExportModal(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12m0 0-4-4m4 4 4-4" />
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
              Export Report
            </button>
          </div>
        </div>

        {loading && <p className="admin-table-empty">Loading complaints...</p>}
        {error && <p className="admin-form-status error">{error}</p>}

        {!loading && !error && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Registered On</th>
                  <th>Info</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="admin-table-empty">
                      No complaints match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((c) => (
                  <tr
                    key={c._id}
                    className="admin-table-row-clickable"
                    onClick={() => setSelectedId(c._id)}
                  >
                    <td className="admin-table-id">{c._id.slice(-6).toUpperCase()}</td>
                    <td>{c.title}</td>
                    <td>
                      <span className={`admin-priority-badge ${c.priority}`}>
                        {PRIORITY_LABEL[c.priority]}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${STATUS_BADGE_CLASS[c.status] || ""}`}>
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </td>
                    <td>{formatDate(c.createdAt)}</td>
                    <td>
                      <div className="admin-info-dots">
                        <span
                          className={`admin-info-dot ${c.photoUrl ? "active" : ""}`}
                          title={c.photoUrl ? "Original photo attached" : "No original photo"}
                        />
                        <span
                          className={`admin-info-dot resolved ${c.resolvedPhotoUrl ? "active" : ""}`}
                          title={c.resolvedPhotoUrl ? "Resolved photo attached" : "No resolved photo yet"}
                        />
                        <span
                          className={`admin-info-dot feedback ${c.feedback?.rating ? "active" : ""}`}
                          title={c.feedback?.rating ? `Feedback: ${c.feedback.rating}★` : "No feedback yet"}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------- Detail drawer ---------- */}
      {selectedComplaint && (
        <div className="admin-drawer-overlay" onClick={() => setSelectedId(null)}>
          <div className="admin-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <div>
                <h3 className="admin-drawer-title">{selectedComplaint.title}</h3>
                <span className={`admin-priority-badge ${selectedComplaint.priority}`}>
                  {PRIORITY_LABEL[selectedComplaint.priority]}
                </span>
              </div>
              <button
                type="button"
                className="admin-drawer-close"
                onClick={() => setSelectedId(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="admin-drawer-body">
              <section className="admin-drawer-section">
                <h4>Details</h4>
                <div className="admin-drawer-row">
                  <span>Complaint ID</span>
                  <span>{selectedComplaint._id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="admin-drawer-row">
                  <span>Raised By</span>
                  <span>
                    {selectedComplaint.isAnonymous
                      ? "Anonymous"
                      : selectedComplaint.raisedBy?.name || "—"}
                  </span>
                </div>
                <div className="admin-drawer-row">
                  <span>Category</span>
                  <span>{selectedComplaint.category}</span>
                </div>
                <div className="admin-drawer-row">
                  <span>Location</span>
                  <span>{selectedComplaint.location}</span>
                </div>
                <div className="admin-drawer-row">
                  <span>Status</span>
                  <span className={`admin-status-badge ${STATUS_BADGE_CLASS[selectedComplaint.status] || ""}`}>
                    {STATUS_LABEL[selectedComplaint.status] || selectedComplaint.status}
                  </span>
                </div>
                <div className="admin-drawer-row">
                  <span>Registered On</span>
                  <span>{formatDate(selectedComplaint.createdAt)}</span>
                </div>
                <div className="admin-drawer-row">
                  <span>Resolved On</span>
                  <span>
                    {selectedComplaint.status === "resolved" || selectedComplaint.status === "closed"
                      ? formatDate(selectedComplaint.resolvedAt)
                      : "Not yet"}
                  </span>
                </div>
                <div className="admin-drawer-row">
                  <span>Description</span>
                  <span className="admin-drawer-description">{selectedComplaint.description}</span>
                </div>
              </section>

              <section className="admin-drawer-section">
                <h4>Photos</h4>
                <div className="admin-drawer-row">
                  <span>Original Photo</span>
                  {selectedComplaint.photoUrl ? (
                    <button
                      type="button"
                      className="admin-view-btn"
                      onClick={() =>
                        setViewingPhoto({
                          url: resolvePhotoUrl(selectedComplaint.photoUrl),
                          title: selectedComplaint.title,
                        })
                      }
                    >
                      View
                    </button>
                  ) : (
                    <span className="admin-table-muted">Not attached</span>
                  )}
                </div>
                <div className="admin-drawer-row">
                  <span>Resolved Photo</span>
                  {selectedComplaint.resolvedPhotoUrl ? (
                    <button
                      type="button"
                      className="admin-view-btn"
                      onClick={() =>
                        setViewingPhoto({
                          url: resolvePhotoUrl(selectedComplaint.resolvedPhotoUrl),
                          title: `${selectedComplaint.title} — Resolved`,
                        })
                      }
                    >
                      View
                    </button>
                  ) : (
                    <span className="admin-table-muted">Not yet uploaded</span>
                  )}
                </div>
              </section>

              <section className="admin-drawer-section">
                <h4>Assignment</h4>
                <div className="admin-drawer-row admin-drawer-row-stack">
                  <span>Assign Supervisor</span>
                  <select
                    className="admin-form-input admin-assign-select"
                    value={selectedComplaint.assignedTo?._id || selectedComplaint.assignedTo || ""}
                    disabled={assigningId === selectedComplaint._id}
                    onChange={(e) => handleAssign(selectedComplaint._id, e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {supervisors.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-drawer-row">
                  <span>Assigned Worker</span>
                  {selectedComplaint.assignedWorker ? (
                    <span className="admin-worker-badge">
                      {selectedComplaint.assignedWorker.name}
                      {selectedComplaint.assignedWorker.trade && (
                        <span className="admin-worker-trade">
                          {" "}
                          ({selectedComplaint.assignedWorker.trade})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="admin-table-muted">Not yet assigned</span>
                  )}
                </div>
              </section>

              <section className="admin-drawer-section">
                <h4>Feedback</h4>
                {selectedComplaint.feedback?.rating ? (
                  <>
                    <p className="admin-feedback-stars">
                      {"★".repeat(selectedComplaint.feedback.rating)}
                      {"☆".repeat(5 - selectedComplaint.feedback.rating)}
                    </p>
                    <p className="admin-feedback-comment">
                      {selectedComplaint.feedback.comment || "No comment left."}
                    </p>
                  </>
                ) : (
                  <p className="admin-table-muted">No feedback submitted yet.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {viewingPhoto && (
        <div className="admin-image-modal-overlay" onClick={() => setViewingPhoto(null)}>
          <div className="admin-image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-image-modal-header">
              <span className="admin-image-modal-title">{viewingPhoto.title}</span>
              <button
                type="button"
                className="admin-image-modal-close"
                onClick={() => setViewingPhoto(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <img
              src={viewingPhoto.url}
              alt={viewingPhoto.title}
              className="admin-image-modal-img"
            />
          </div>
        </div>
      )}

      {showExportModal && (
        <ExportReportModal
          complaints={complaints}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </AdminLayout>
  );
}