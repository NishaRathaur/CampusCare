import SupervisorNavbar from "./SupervisorNavbar";
import "../styles/SupervisorDashboard.css";

export default function SupervisorLayout({ children }) {
  return (
    <div className="sv-page">
      <SupervisorNavbar />
      <main className="sv-content">{children}</main>
    </div>
  );
}