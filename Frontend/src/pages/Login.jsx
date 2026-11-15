import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import "../styles/Auth.css";
import mitsLogo from "../assets/mits.png";

const ROLES = [
  { key: "student", label: "Student" },
  { key: "faculty", label: "Faculty" },
  { key: "supervisor", label: "Supervisor" },
  { key: "admin", label: "Admin" },
];

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post("/auth/login", {
        email: form.email,
        password: form.password,
        expectedRole: role,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);

      // Admin-created accounts (supervisor/admin/worker) must set their
      // own password before doing anything else.
      if (data.user.mustChangePassword) {
        navigate("/set-password");
        return;
      }

      if (data.user.role === "student" || data.user.role === "faculty") {
        navigate("/dashboard");
      } else if (data.user.role === "supervisor") {
        navigate("/supervisor");
      } else {
        navigate("/admin");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't sign in. Check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card two-col">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <img src={mitsLogo} alt="MITS College" className="auth-college-logo" />
          </div>
          <p className="auth-brand-title">Campus Care</p>
          <p className="auth-brand-subtitle">
            Hygiene, infrastructure and facility complaint portal
          </p>
          <div className="auth-brand-features">
            <div className="auth-brand-feature">
              <i className="ti ti-file-report" aria-hidden="true"></i>
              Raise and track complaints
            </div>
            <div className="auth-brand-feature">
              <i className="ti ti-chart-bar" aria-hidden="true"></i>
              Live resolution status
            </div>
          </div>
        </div>

        <div className="auth-form-panel two-col">
          <div className="auth-header">
            <p className="auth-title">Welcome back</p>
            <p className="auth-subtitle">
              Sign in with your institute email to continue.
            </p>
          </div>

          <div className="role-tabs count-4" role="tablist" aria-label="Select account type">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={role === r.key}
                className={`role-tab ${role === r.key ? "active" : ""}`}
                onClick={() => setRole(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {error && <div className="auth-banner error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label className="field-label" htmlFor="email">
                Institute email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="field-input"
                placeholder="name@student.college.edu"
                value={form.email}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label" htmlFor="password" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="field-link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/forgot-password");
                  }}
                >
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                className="field-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="field-link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/signup");
              }}
            >
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
