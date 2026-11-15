import { Navigate } from "react-router-dom";

// Wrap any page with this to require login (and optionally a specific role).
// Usage: <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Logged in, but wrong role for this page — send them to their own dashboard.
    return <Navigate to="/login" replace />;
  }

  return children;
}
