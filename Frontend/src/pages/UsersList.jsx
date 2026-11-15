import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/UsersList.css";

const ROLE_TABS = [
  { key: "student", label: "Students" },
  { key: "faculty", label: "Faculty" },
  { key: "supervisor", label: "Supervisors" },
  //{ key: "worker", label: "Workers" },
];

export default function UsersList() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!selectedRole) return;

    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/users?role=${selectedRole}`);
        setUsers(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [selectedRole]);

  const filtered = useMemo(() => {
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/users/${id}/status`, { isActive: !currentStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isActive: !currentStatus } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user permanently? This can't be undone.")) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  // Step 1: ask which list to view
  if (!selectedRole) {
    return (
      <AdminLayout activePath="/admin/users">
        <div className="admin-section-card">
          <h2 className="admin-section-title">Users List</h2>
          <p className="admin-role-prompt">Which user list would you like to see?</p>

          <div className="admin-role-grid">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.key}
                className="admin-role-card"
                onClick={() => setSelectedRole(tab.key)}
              >
                <span className="admin-role-card-label">{tab.label}</span>
                <span className="admin-role-card-arrow">→</span>
              </button>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const currentLabel = ROLE_TABS.find((t) => t.key === selectedRole)?.label;

  return (
    <AdminLayout activePath="/admin/users">
      <button className="admin-back-btn" onClick={() => setSelectedRole(null)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Choose a different list
      </button>

      <div className="admin-section-card">
        <div className="admin-list-header">
          <div className="admin-list-title-row">
            <h2 className="admin-section-title">{currentLabel}</h2>
            <button
              className="admin-add-btn"
              onClick={() => navigate(`/admin/users/add?role=${selectedRole}`)}
            >
              + Add {selectedRole === "student" ? "User" : currentLabel.replace(/s$/, "")}
            </button>
          </div>

          <input
            className="admin-form-input admin-search-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p className="admin-table-empty">Loading {currentLabel.toLowerCase()}...</p>}
        {error && <p className="admin-form-status error">{error}</p>}

        {!loading && !error && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>{selectedRole === "student" || selectedRole === "faculty" ? "Department/Branch" : "Designation"}</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="admin-table-empty">
                      No {currentLabel.toLowerCase()} found.
                    </td>
                  </tr>
                )}
                {filtered.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.mobile || "—"}</td>
                    <td>{u.department || u.designation || "—"}</td>
                    <td>
                      <span className={`admin-status-badge ${u.isActive ? "resolved" : "pending"}`}>
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-cell">
                        <button
                          className="admin-icon-action edit"
                          title="Edit"
                          onClick={() => navigate(`/admin/users/${u._id}/edit`)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>

                        <button
                          className={`admin-status-toggle ${u.isActive ? "deactivate" : "activate"}`}
                          onClick={() => handleToggleStatus(u._id, u.isActive)}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          className="admin-icon-action danger"
                          title="Delete"
                          onClick={() => handleDelete(u._id)}
                        >
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