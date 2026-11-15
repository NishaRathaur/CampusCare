import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "../api/axios";
import "../styles/StudentDashboard.css";
import "../styles/RaiseComplaint.css";

const initialForm = {
  title: "",
  category: "",
  location: "",
  description: "",
  isAnonymous: false,
};

export default function RaiseComplaint() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Categories now come from the database, managed by the admin.
  
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Live AI suggestion state — checked WHILE typing, before submit.
  const [liveSuggestion, setLiveSuggestion] = useState(null);
  const [willBeHighPriority, setWillBeHighPriority] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const { data } = await axios.get("/categories");
        setCategories(data);
        // Default the form to the first real category once loaded.
        if (data.length > 0) {
          setForm((f) => ({ ...f, category: f.category || data[0].name }));
        }
      } catch {
        // If this fails, the dropdown just stays empty — the submit
        // validation below already requires a category to be chosen.
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleFileChange = (e) => {
    setPhoto(e.target.files[0] || null);
  };

  // Debounced live check: fires 600ms after the student stops typing
  // in title/description, or changes category. Doesn't save anything —
  // just asks the backend "does this text match this category?"
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (form.description.trim().length < 10) {
      setLiveSuggestion(null);
      setWillBeHighPriority(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await axios.post("/complaints/suggest", {
          title: form.title,
          description: form.description,
          category: form.category,
        });
        setLiveSuggestion(data.aiSuggestion || null);
        setWillBeHighPriority(!!data.willBeHighPriority);
      } catch {
        // Silent fail — live suggestions are a nice-to-have, never block typing.
        setLiveSuggestion(null);
      }
    }, 600);

    return () => clearTimeout(debounceRef.current);
  }, [form.title, form.description, form.category]);

  // One click: accept the AI's suggested category, then it re-checks
  // automatically (via the effect above) and the banner clears.
  const applySuggestedCategory = () => {
    if (liveSuggestion?.suggestedCategory) {
      setForm((f) => ({ ...f, category: liveSuggestion.suggestedCategory }));
      setLiveSuggestion(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title || !form.category || !form.location || !form.description) {
      setError("Fill in the title, category, location, and description.");
      return;
    }

    // Soft guardrail: if there's still an unresolved AI mismatch when they
    // hit submit, make them confirm rather than silently saving the wrong category.
    if (liveSuggestion) {
      const proceedAnyway = window.confirm(
        `${liveSuggestion.note}\n\nSubmit anyway with "${form.category}"?`
      );
      if (!proceedAnyway) return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("category", form.category);
      payload.append("location", form.location);
      payload.append("description", form.description);
      payload.append("isAnonymous", form.isAnonymous);
      if (photo) payload.append("photo", photo);

      await axios.post("/complaints", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Complaint submitted. You can track its status from My Complaints.");
      setForm({ ...initialForm, category: categories[0]?.name || "" });
      setPhoto(null);
      setLiveSuggestion(null);
      setWillBeHighPriority(false);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit your complaint. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`dashboard-page ${darkMode ? "dashboard-dark" : ""}`}>
      <Navbar
        activePath="/dashboard/raise"
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
      />

      <main className="dashboard-content">
        <div className="rc-card">
          <h1 className="rc-title">Raise a Complaint</h1>
          <p className="rc-subtitle">
            Report a hygiene, infrastructure, or facility issue on campus.
          </p>

          {error && <div className="auth-banner error">{error}</div>}
          {success && <div className="auth-banner success">{success}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="rc-row">
              <div>
                <label className="rc-label" htmlFor="title">
                  Complaint title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="rc-input"
                  placeholder="e.g. Broken tap in hostel washroom"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="rc-label" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  className="rc-input"
                  value={form.category}
                  onChange={handleChange}
                  disabled={categoriesLoading}
                >
                  {categoriesLoading && <option value="">Loading categories...</option>}
                  {!categoriesLoading && categories.length === 0 && (
                    <option value="">No categories available</option>
                  )}
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rc-field">
              <label className="rc-label" htmlFor="location">
                Location of issue
              </label>
              <input
                id="location"
                name="location"
                type="text"
                className="rc-input"
                placeholder="e.g. Block B, 2nd Floor, Room 214"
                value={form.location}
                onChange={handleChange}
              />
            </div>

            <div className="rc-field">
              <label className="rc-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className="rc-textarea"
                placeholder="Describe the issue in detail..."
                rows={5}
                value={form.description}
                onChange={handleChange}
              />

              {/* Live AI banner — appears WHILE typing, before submit */}
              {liveSuggestion && (
                <div className="rc-ai-banner">
                  <div className="rc-ai-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 2 9.5 8.5 3 12l6.5 3.5L12 22l2.5-6.5L21 12l-6.5-3.5Z" />
                    </svg>
                  </div>
                  <div className="rc-ai-body">
                    <p className="rc-ai-title">AI suggestion</p>
                    <p className="rc-ai-text">{liveSuggestion.note}</p>
                  </div>
                  <button type="button" className="rc-ai-apply" onClick={applySuggestedCategory}>
                    Switch to {liveSuggestion.suggestedCategory}
                  </button>
                  <button
                    type="button"
                    className="rc-ai-dismiss"
                    onClick={() => setLiveSuggestion(null)}
                    aria-label="Dismiss suggestion"
                  >
                    ×
                  </button>
                </div>
              )}

              {willBeHighPriority && (
                <div className="rc-priority-note">
                  ⚠ This will be marked <strong>high priority</strong> based on the wording used.
                </div>
              )}
            </div>

            <div className="rc-field">
              <label className="rc-label" htmlFor="photo">
                Upload photo (optional)
              </label>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                className="rc-file"
                onChange={handleFileChange}
              />
              {photo && <p className="rc-file-name">{photo.name}</p>}
            </div>

            <label className="rc-checkbox-row">
              <input
                type="checkbox"
                name="isAnonymous"
                checked={form.isAnonymous}
                onChange={handleChange}
              />
              Submit this complaint anonymously
            </label>

            <button type="submit" className="rc-submit" disabled={loading || categoriesLoading}>
              {loading ? "Submitting…" : "Submit report"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}