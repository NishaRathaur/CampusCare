import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import SupervisorComplaints from "./pages/SupervisorComplaints";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RaiseComplaint from "./pages/RaiseComplaint";
import MyComplaints from "./pages/MyComplaints";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import SetPassword from "./pages/SetPassword";
import CreateStaffAccount from "./pages/CreateStaffAccount";
import AddSupervisor from "./pages/AddSupervisor";
import ComplaintList from "./pages/ComplaintList";
import UsersList from "./pages/UsersList";
import AddUser from "./pages/AddUser";
import Categories from "./pages/Categories";
import UserReviews from "./pages/UserReviews";
import ReviewsPage from "./pages/ReviewsPage";
import WorkersList from "./pages/WorkersList";
import AddWorker from "./pages/AddWorker";
import WorkerGroups from "./pages/WorkerGroups";
import MyWorkers from "./pages/MyWorkers";
import SupervisorChangePassword from "./pages/SupervisorChangePassword";
import SupervisorProfile from "./pages/SupervisorProfile";
import Reports from "./pages/Reports";
import AdminChangePassword from "./pages/AdminChangePassword";
import ChangePassword from "./pages/ChangePassword";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route -> send everyone to login first */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes — only reachable with a valid token + matching role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student", "faculty"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor"
          element={
            <ProtectedRoute allowedRoles={["supervisor"]}>
              <SupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/raise"
          element={
            <ProtectedRoute allowedRoles={["student", "faculty"]}>
              <RaiseComplaint />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/complaints"
          element={
            <ProtectedRoute allowedRoles={["student", "faculty"]}>
              <MyComplaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute allowedRoles={["student", "faculty", "supervisor", "admin"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/set-password" element={<SetPassword />} />

        <Route
          path="/admin/supervisors"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CreateStaffAccount />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/supervisors/add" element={<AddSupervisor />} />
        <Route path="/admin/complaints" element={<ComplaintList />} />
        <Route path="/admin/users" element={<UsersList />} />
        <Route path="/admin/users/add" element={<AddUser />} />
        <Route path="/admin/categories" element={<Categories />} />
        <Route path="/admin/reviews" element={<UserReviews />} />
        <Route path="/dashboard/reviews" element={<ReviewsPage />} />
        <Route path="/admin/workers" element={<WorkersList />} />
        <Route path="/admin/workers/add" element={<AddWorker />} />
        <Route path="/admin/worker-groups" element={<WorkerGroups />} />
        <Route path="/supervisor/complaints" element={<SupervisorComplaints />} />
        <Route path="/supervisor/workers" element={<MyWorkers />} />
        <Route path="/supervisor/change-password" element={<SupervisorChangePassword />} />
        <Route path="/supervisor/profile" element={<SupervisorProfile />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/change-password" element={<AdminChangePassword />} />
        <Route path="/dashboard/change-password" element={<ChangePassword />} />
      </Routes>
    </BrowserRouter>
  );
}
