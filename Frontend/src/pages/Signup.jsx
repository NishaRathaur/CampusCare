import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import "../styles/Auth.css";
import mitsLogo from "../assets/mits.png";

const STUDENT_EMAIL_DOMAIN = "@gmail.com";
const FACULTY_EMAIL_DOMAIN = "@gmail.com";

const DEPARTMENTS = [
  "Computer science",
  "Electronics",
  "Mechanical",
  "Civil",
  "Electrical",
  "AI and data science",
];

const YEARS = ["1st year", "2nd year", "3rd year", "4th year"];
const DESIGNATIONS = ["Assistant professor", "Associate professor", "Professor", "Lab staff"];

const initialForm = {
  name: "",
  email: "",
  rollNo: "",
  empId: "",
  department: DEPARTMENTS[0],
  year: YEARS[0],
  designation: DESIGNATIONS[0],
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
      return "Fill in all required fields.";
    }

    const expectedDomain = role === "student" ? STUDENT_EMAIL_DOMAIN : FACULTY_EMAIL_DOMAIN;
    if (!form.email.toLowerCase().endsWith(expectedDomain)) {
      return `Use your college ${role} email (${expectedDomain}).`;
    }

    if (role === "student" && !form.rollNo) {
      return "Enter your roll number.";
    }

    if (role === "faculty" && !form.empId) {
      return "Enter your employee ID.";
    }

    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (form.password !== form.confirmPassword) {
      return "Passwords don't match.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
        department: form.department,
        ...(role === "student"
          ? { rollNo: form.rollNo, year: form.year }
          : { empId: form.empId, designation: form.designation }),
      };

      await axios.post("/auth/signup", payload);

      setSuccess("Account created. Check your college email to verify it.");
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create your account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card single-col">
        <div className="auth-form-panel">
          <div className="auth-header">
            <div className="auth-brand-icon">
              <img src={mitsLogo} alt="MITS College" className="auth-college-logo" />
            </div>
            <p className="auth-title">Create your account</p>
            <p className="auth-subtitle">Sign up with your college email.</p>
          </div>

          <div className="role-tabs count-2" role="tablist" aria-label="Select account type">
            <button
              type="button"
              role="tab"
              aria-selected={role === "student"}
              className={`role-tab ${role === "student" ? "active" : ""}`}
              onClick={() => setRole("student")}
            >
              Student
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === "faculty"}
              className={`role-tab ${role === "faculty" ? "active" : ""}`}
              onClick={() => setRole("faculty")}
            >
              Faculty
            </button>
          </div>

          {error && <div className="auth-banner error">{error}</div>}
          {success && <div className="auth-banner success">{success}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field-row">
              <div>
                <label className="field-label" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="field-input"
                  placeholder="Aditi Sharma"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="field-label" htmlFor={role === "student" ? "rollNo" : "empId"}>
                  {role === "student" ? "Roll number" : "Employee ID"}
                </label>
                <input
                  id={role === "student" ? "rollNo" : "empId"}
                  name={role === "student" ? "rollNo" : "empId"}
                  type="text"
                  className="field-input"
                  placeholder={role === "student" ? "21CS1042" : "EMP4021"}
                  value={role === "student" ? form.rollNo : form.empId}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="email">
                College email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="field-input"
                placeholder={
                  role === "student"
                    ? `aditi${STUDENT_EMAIL_DOMAIN}`
                    : `aditi${FACULTY_EMAIL_DOMAIN}`
                }
                value={form.email}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            <div className="field-row">
              <div>
                <label className="field-label" htmlFor="department">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  className="field-select"
                  value={form.department}
                  onChange={handleChange}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor={role === "student" ? "year" : "designation"}>
                  {role === "student" ? "Year" : "Designation"}
                </label>
                <select
                  id={role === "student" ? "year" : "designation"}
                  name={role === "student" ? "year" : "designation"}
                  className="field-select"
                  value={role === "student" ? form.year : form.designation}
                  onChange={handleChange}
                >
                  {(role === "student" ? YEARS : DESIGNATIONS).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="phone">
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="field-input"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="field-row">
              <div>
                <label className="field-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="field-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="field-input"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <a
              href="/login"
              className="field-link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
