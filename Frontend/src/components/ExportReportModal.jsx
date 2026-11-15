import { useState, useMemo } from "react";
import * as XLSX from "xlsx";

// Each field: key (internal), label (Excel column header), and how to pull
// the value out of a complaint object — some are simple, some need
// formatting or fall back to a placeholder when the data isn't there yet.
const FIELD_DEFINITIONS = [
  { key: "id", label: "Complaint ID", get: (c) => c._id.slice(-6).toUpperCase() },
  {
    key: "user",
    label: "Raised By",
    get: (c) => (c.isAnonymous ? "Anonymous" : c.raisedBy?.name || "—"),
  },
  { key: "title", label: "Title", get: (c) => c.title },
  { key: "description", label: "Description", get: (c) => c.description },
  { key: "category", label: "Category", get: (c) => c.category },
  { key: "location", label: "Location", get: (c) => c.location },
  { key: "priority", label: "Priority", get: (c) => c.priority },
  { key: "status", label: "Status", get: (c) => c.status },
  {
    key: "createdAt",
    label: "Registered On",
    get: (c) => (c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB") : "—"),
  },
  {
    key: "resolvedAt",
    label: "Resolved On",
    get: (c) => (c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString("en-GB") : "Not yet"),
  },
  {
    key: "supervisor",
    label: "Assigned Supervisor",
    get: (c) => c.assignedTo?.name || "Unassigned",
  },
  {
    key: "worker",
    label: "Assigned Worker",
    get: (c) =>
      c.assignedWorker ? `${c.assignedWorker.name} (${c.assignedWorker.trade || "—"})` : "Not yet assigned",
  },
  {
    key: "feedbackRating",
    label: "Feedback Rating",
    get: (c) => c.feedback?.rating || "—",
  },
  {
    key: "feedbackComment",
    label: "Feedback Comment",
    get: (c) => c.feedback?.comment || "—",
  },
];

const DEFAULT_SELECTED = FIELD_DEFINITIONS.reduce((acc, f) => {
  acc[f.key] = true;
  return acc;
}, {});

export default function ExportReportModal({ complaints, onClose }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedFields, setSelectedFields] = useState(DEFAULT_SELECTED);
  const [error, setError] = useState("");

  const allSelected = FIELD_DEFINITIONS.every((f) => selectedFields[f.key]);

  const toggleField = (key) => {
    setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    const next = {};
    FIELD_DEFINITIONS.forEach((f) => {
      next[f.key] = !allSelected;
    });
    setSelectedFields(next);
  };

  // Preview count so admin knows how many rows will be in the file
  // before they generate it.
  const matchingCount = useMemo(() => {
    return complaints.filter((c) => isWithinRange(c.createdAt, dateFrom, dateTo)).length;
  }, [complaints, dateFrom, dateTo]);

  function isWithinRange(dateStr, from, to) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (from && date < new Date(from + "T00:00:00")) return false;
    if (to && date > new Date(to + "T23:59:59")) return false;
    return true;
  }

  const handleGenerate = () => {
    setError("");

    const activeFields = FIELD_DEFINITIONS.filter((f) => selectedFields[f.key]);
    if (activeFields.length === 0) {
      setError("Select at least one field to include in the report.");
      return;
    }

    const rows = complaints
      .filter((c) => isWithinRange(c.createdAt, dateFrom, dateTo))
      .map((c) => {
        const row = {};
        activeFields.forEach((f) => {
          row[f.label] = f.get(c);
        });
        return row;
      });

    if (rows.length === 0) {
      setError("No complaints were registered in that date range.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Complaints");

    const fromLabel = dateFrom || "all-time";
    const toLabel = dateTo || "present";
    const filename = `CampusCare_Complaints_${fromLabel}_to_${toLabel}.xlsx`;

    XLSX.writeFile(workbook, filename);
    onClose();
  };

  return (
    <div className="admin-image-modal-overlay" onClick={onClose}>
      <div
        className="admin-export-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-image-modal-header">
          <span className="admin-image-modal-title">Export Complaint Report</span>
          <button
            type="button"
            className="admin-image-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="admin-export-body">
          <div className="admin-export-date-row">
            <div className="admin-form-group">
              <label className="admin-form-label">From date</label>
              <input
                type="date"
                className="admin-form-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">To date</label>
              <input
                type="date"
                className="admin-form-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <p className="admin-export-count">
            {matchingCount} complaint{matchingCount === 1 ? "" : "s"} match
            {dateFrom || dateTo ? " this date range" : " (leave dates blank for all-time)"}.
          </p>

          <div className="admin-export-fields-header">
            <span className="admin-form-label">Fields to include</span>
            <button type="button" className="admin-export-select-all" onClick={toggleAll}>
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="admin-export-fields-grid">
            {FIELD_DEFINITIONS.map((f) => (
              <label key={f.key} className="admin-export-field-checkbox">
                <input
                  type="checkbox"
                  checked={!!selectedFields[f.key]}
                  onChange={() => toggleField(f.key)}
                />
                {f.label}
              </label>
            ))}
          </div>

          {error && <p className="admin-form-status error">{error}</p>}

          <button className="admin-form-submit" onClick={handleGenerate}>
            Generate Excel Report
          </button>
        </div>
      </div>
    </div>
  );
}