import { useState, useEffect } from "react";
import api from "../api/axios";
import SupervisorLayout from "../components/SupervisorLayout";
import "../styles/SupervisorDashboard.css";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

export default function SupervisorComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [myWorkers, setMyWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null); // { url, title } or null

  // Resolved-photo upload state, keyed by complaint id.
  const [resolvedFile, setResolvedFile] = useState({});
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [complaintsRes, workersRes] = await Promise.all([
        api.get("/complaints/supervisor"),
        api.get("/workers/mine"),
      ]);
      setComplaints(complaintsRes.data);
      setMyWorkers(workersRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setViewingPhoto(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const resolvePhotoUrl = (photoUrl) =>
    photoUrl?.startsWith("http") ? photoUrl : `${import.meta.env.VITE_API_URL}${photoUrl}`;

  const handleStatusChange = async (complaintId, newStatus) => {
    setUpdatingId(complaintId);
    try {
      const res = await api.patch(`/complaints/${complaintId}/supervisor-status`, {
        status: newStatus,
      });
      setComplaints((prev) =>
        prev.map((c) => (c._id === complaintId ? res.data.complaint : c))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignWorker = async (complaintId, workerId) => {
    if (!workerId) return;
    setUpdatingId(complaintId);
    try {
      const res = await api.patch(`/complaints/${complaintId}/assign-worker`, {
        workerId,
      });
      setComplaints((prev) =>
        prev.map((c) => (c._id === complaintId ? res.data.complaint : c))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign worker");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResolvedPhotoUpload = async (complaintId) => {
    const file = resolvedFile[complaintId];
    if (!file) return;

    setUploadingPhotoId(complaintId);
    try {
      const formData = new FormData();
      formData.append("resolvedPhoto", file);

      const res = await api.patch(`/complaints/${complaintId}/resolved-photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setComplaints((prev) =>
        prev.map((c) => (c._id === complaintId ? res.data.complaint : c))
      );
      setResolvedFile((prev) => ({ ...prev, [complaintId]: null }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload resolved photo");
    } finally {
      setUploadingPhotoId(null);
    }
  };

  return (
    <SupervisorLayout>
      <div className="sv-section-card">
        <h2 className="sv-section-title">Complaints Assigned To You</h2>
        <p className="sv-section-subtitle">
          Update the status and assign a worker from your team for each complaint.
        </p>

        {error && <p className="sv-status-error">{error}</p>}
        {loading && <p className="sv-empty">Loading complaints...</p>}

        {!loading && !error && complaints.length === 0 && (
          <p className="sv-empty">No complaints have been assigned to you yet.</p>
        )}

        {!loading && complaints.length > 0 && (
          <div className="sv-complaint-list">
            {complaints.map((c) => (
              <div key={c._id} className="sv-complaint-card">
                <div className="sv-complaint-header">
                  <h3>{c.title}</h3>
                  <span className={`sv-priority-badge ${c.priority}`}>{c.priority}</span>
                </div>

                <p className="sv-complaint-desc">{c.description}</p>

                <div className="sv-complaint-meta">
                  <span><strong>Category:</strong> {c.category}</span>
                  <span><strong>Location:</strong> {c.location}</span>
                  {!c.isAnonymous && c.raisedBy && (
                    <span><strong>Raised by:</strong> {c.raisedBy.name}</span>
                  )}
                </div>

                <div className="sv-photo-row">
                  {c.photoUrl ? (
                    <button
                      type="button"
                      className="sv-view-btn"
                      onClick={() =>
                        setViewingPhoto({ url: resolvePhotoUrl(c.photoUrl), title: c.title })
                      }
                    >
                      View Photo
                    </button>
                  ) : (
                    <span className="sv-photo-none">No photo attached</span>
                  )}
                </div>

                <div className="sv-complaint-controls">
                  <div className="sv-control-group">
                    <label>Status</label>
                    <select
                      value={c.status}
                      disabled={updatingId === c._id}
                      onChange={(e) => handleStatusChange(c._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sv-control-group">
                    <label>Assign Worker</label>
                    <select
                      value={c.assignedWorker?._id || ""}
                      disabled={updatingId === c._id}
                      onChange={(e) => handleAssignWorker(c._id, e.target.value)}
                    >
                      <option value="" disabled>
                        {myWorkers.length === 0 ? "No workers in your group" : "Select a worker"}
                      </option>
                      {myWorkers.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.name} — {w.trade}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {c.assignedWorker && (
                  <p className="sv-assigned-note">
                    Currently assigned to <strong>{c.assignedWorker.name}</strong> ({c.assignedWorker.trade})
                  </p>
                )}

                {/* Proof-of-resolution photo — only relevant once marked resolved */}
                {(c.status === "resolved" || c.status === "closed") && (
                  <div className="sv-resolved-photo-section">
                    <label className="sv-resolved-photo-label">Proof of Resolution</label>

                    {c.resolvedPhotoUrl ? (
                      <div className="sv-resolved-photo-row">
                        <button
                          type="button"
                          className="sv-view-btn"
                          onClick={() =>
                            setViewingPhoto({
                              url: resolvePhotoUrl(c.resolvedPhotoUrl),
                              title: `${c.title} — Resolved`,
                            })
                          }
                        >
                          View Resolved Photo
                        </button>

                        <label className="sv-resolved-replace-label">
                          Replace
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) =>
                              setResolvedFile((prev) => ({
                                ...prev,
                                [c._id]: e.target.files[0],
                              }))
                            }
                          />
                        </label>

                        {resolvedFile[c._id] && (
                          <button
                            type="button"
                            className="sv-view-btn"
                            disabled={uploadingPhotoId === c._id}
                            onClick={() => handleResolvedPhotoUpload(c._id)}
                          >
                            {uploadingPhotoId === c._id ? "Uploading..." : "Save New Photo"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="sv-resolved-photo-row">
                        <input
                          type="file"
                          accept="image/*"
                          className="sv-resolved-file-input"
                          onChange={(e) =>
                            setResolvedFile((prev) => ({ ...prev, [c._id]: e.target.files[0] }))
                          }
                        />
                        <button
                          type="button"
                          className="sv-view-btn"
                          disabled={!resolvedFile[c._id] || uploadingPhotoId === c._id}
                          onClick={() => handleResolvedPhotoUpload(c._id)}
                        >
                          {uploadingPhotoId === c._id ? "Uploading..." : "Upload Proof Photo"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingPhoto && (
        <div className="sv-image-modal-overlay" onClick={() => setViewingPhoto(null)}>
          <div className="sv-image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sv-image-modal-header">
              <span className="sv-image-modal-title">{viewingPhoto.title}</span>
              <button
                type="button"
                className="sv-image-modal-close"
                onClick={() => setViewingPhoto(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <img
              src={viewingPhoto.url}
              alt={viewingPhoto.title}
              className="sv-image-modal-img"
            />
          </div>
        </div>
      )}
    </SupervisorLayout>
  );
}