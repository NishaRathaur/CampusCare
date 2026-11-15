import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/AdminDashboard.css";
import "../styles/WorkerGroups.css";

export default function WorkerGroups() {
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  const [allWorkers, setAllWorkers] = useState([]);
  const [groupWorkers, setGroupWorkers] = useState([]);

  const [loadingSupervisors, setLoadingSupervisors] = useState(true);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [error, setError] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState([]);

  // Load active supervisors + full worker list once
  useEffect(() => {
    const load = async () => {
      setLoadingSupervisors(true);
      setError("");
      try {
        const [supRes, workersRes] = await Promise.all([
          api.get("/users/supervisors"),
          api.get("/workers"),
        ]);
        setSupervisors(supRes.data);
        setAllWorkers(workersRes.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoadingSupervisors(false);
      }
    };
    load();
  }, []);

  const fetchGroup = async (supervisorId) => {
    setLoadingGroup(true);
    setError("");
    try {
      const res = await api.get(`/workers/by-supervisor/${supervisorId}`);
      setGroupWorkers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load workers for this supervisor");
    } finally {
      setLoadingGroup(false);
    }
  };

  const handleSelectSupervisor = (sup) => {
    setSelectedSupervisor(sup);
    setSelectedToAdd([]);
    setPickerOpen(false);
    fetchGroup(sup._id);
  };

  const handleUnassign = async (workerId) => {
    if (!window.confirm("Remove this worker from the group?")) return;
    try {
      await api.patch(`/workers/${workerId}/unassign-supervisor`);
      setGroupWorkers((prev) => prev.filter((w) => w._id !== workerId));
      setAllWorkers((prev) =>
        prev.map((w) => (w._id === workerId ? { ...w, supervisor: null } : w))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to unassign worker");
    }
  };

  const handleAssignSelected = async () => {
    if (selectedToAdd.length === 0 || !selectedSupervisor) return;
    try {
      const res = await api.patch("/workers/assign-supervisor", {
        workerIds: selectedToAdd,
        supervisorId: selectedSupervisor._id,
      });
      setGroupWorkers((prev) => [...prev, ...res.data.workers]);
      setAllWorkers((prev) =>
        prev.map((w) =>
          selectedToAdd.includes(w._id) ? { ...w, supervisor: selectedSupervisor._id } : w
        )
      );
      setSelectedToAdd([]);
      setPickerOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign workers");
    }
  };

  const eligibleWorkers = useMemo(() => {
    const groupIds = new Set(groupWorkers.map((w) => w._id));
    return allWorkers.filter(
      (w) =>
        !groupIds.has(w._id) &&
        (w.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
          w.trade.toLowerCase().includes(pickerSearch.toLowerCase()))
    );
  }, [allWorkers, groupWorkers, pickerSearch]);

  const toggleSelectToAdd = (id) => {
    setSelectedToAdd((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <AdminLayout activePath="/admin/worker-groups">
      <div className="admin-section-card">
        <h2 className="admin-section-title">Worker Groups</h2>
        <p className="admin-table-muted wg-subtitle">
          Select a supervisor to view or manage the workers assigned to them.
        </p>

        {error && <p className="admin-form-status error">{error}</p>}

        <div className="wg-layout">
          {/* Supervisors column */}
          <div className="wg-sup-column">
            <p className="admin-sidebar-section-title">Active Supervisors</p>
            {loadingSupervisors && <p className="admin-table-empty">Loading...</p>}
            {!loadingSupervisors && supervisors.length === 0 && (
              <p className="admin-table-empty">No active supervisors found.</p>
            )}
            <div className="wg-sup-list">
              {supervisors.map((sup) => (
                <button
                  key={sup._id}
                  className={`admin-sidebar-item wg-sup-btn ${
                    selectedSupervisor?._id === sup._id ? "active" : ""
                  }`}
                  onClick={() => handleSelectSupervisor(sup)}
                >
                  <span>{sup.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Group detail column */}
          <div className="wg-detail-column">
            {!selectedSupervisor && (
              <p className="admin-table-empty">
                Pick a supervisor on the left to see their assigned workers.
              </p>
            )}

            {selectedSupervisor && (
              <>
                <div className="wg-detail-header">
                  <h3>{selectedSupervisor.name}'s Workers</h3>
                  <button className="admin-add-btn" onClick={() => setPickerOpen((v) => !v)}>
                    + Add Workers
                  </button>
                </div>

                {pickerOpen && (
                  <div className="admin-section-card wg-picker-panel">
                    <input
                      className="admin-form-input admin-search-input"
                      placeholder="Search workers by name or trade..."
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                    />
                    <div className="wg-picker-list">
                      {eligibleWorkers.length === 0 && (
                        <p className="admin-table-empty">No eligible workers found.</p>
                      )}
                      {eligibleWorkers.map((w) => (
                        <label key={w._id} className="wg-picker-row">
                          <input
                            type="checkbox"
                            checked={selectedToAdd.includes(w._id)}
                            onChange={() => toggleSelectToAdd(w._id)}
                          />
                          <span>
                            {w.name} — <span className="admin-table-muted">{w.trade}</span>
                            {w.supervisor && (
                              <span className="admin-table-muted wg-picker-elsewhere">
                                {" "}
                                (currently assigned elsewhere)
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                    <button
                      className="admin-add-btn wg-assign-btn"
                      disabled={selectedToAdd.length === 0}
                      onClick={handleAssignSelected}
                    >
                      Assign {selectedToAdd.length > 0 ? `(${selectedToAdd.length})` : ""}
                    </button>
                  </div>
                )}

                {loadingGroup && <p className="admin-table-empty">Loading workers...</p>}

                {!loadingGroup && (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Full Name</th>
                          <th>Mobile</th>
                          <th>Trade</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupWorkers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="admin-table-empty">
                              No workers assigned to this supervisor yet.
                            </td>
                          </tr>
                        )}
                        {groupWorkers.map((w) => (
                          <tr key={w._id}>
                            <td>{w.name}</td>
                            <td>{w.mobile}</td>
                            <td>{w.trade}</td>
                            <td>
                              <span
                                className={`admin-status-badge ${
                                  w.isActive ? "resolved" : "pending"
                                }`}
                              >
                                {w.isActive ? "Active" : "Deactivated"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="admin-status-toggle deactivate"
                                onClick={() => handleUnassign(w._id)}
                              >
                                Remove from group
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}