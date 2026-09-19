import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute, portalHomeForRole } from "./routes/ProtectedRoute";
import { LoadingScreen } from "./components/common/Common";

import { LoginPage } from "./pages/auth/LoginPage";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ProfileMissingPage } from "./pages/auth/ProfileMissingPage";

import { AdminPortalLayout } from "./pages/admin/AdminPortalLayout";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminTowersPage } from "./pages/admin/AdminTowersPage";
import { AdminDepartmentsPage } from "./pages/admin/AdminDepartmentsPage";
import { AdminWorkersPage } from "./pages/admin/AdminWorkersPage";
import { AdminTeamsPage } from "./pages/admin/AdminTeamsPage";
import { AdminComplaintsPage } from "./pages/admin/AdminComplaintsPage";
import { AdminComplaintDetailPage } from "./pages/admin/AdminComplaintDetailPage";
import { AdminNotificationsPage } from "./pages/admin/AdminNotificationsPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";

import { StudentPortalLayout } from "./pages/student/StudentPortalLayout";
import { TowerSelectPage } from "./pages/student/TowerSelectPage";
import { RaiseComplaintPage } from "./pages/student/RaiseComplaintPage";
import { ComplaintConfirmationPage } from "./pages/student/ComplaintConfirmationPage";
import { MyComplaintsPage } from "./pages/student/MyComplaintsPage";
import { StudentComplaintDetailPage } from "./pages/student/StudentComplaintDetailPage";

import { WorkerPortalLayout } from "./pages/worker/WorkerPortalLayout";
import { WorkerDashboardPage } from "./pages/worker/WorkerDashboardPage";
import { WorkerComplaintDetailPage } from "./pages/worker/WorkerComplaintDetailPage";
import { PublicHomePage } from "./pages/PublicHomePage";


class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unexpected application error.",
    };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error("CampusFix runtime error:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="full-screen-center" style={{ padding: "2rem", textAlign: "center" }}>
        <h2>CampusFix encountered an error</h2>
        <p style={{ maxWidth: 640, margin: "0 auto 1rem" }}>{this.state.message}</p>
        <button className="btn btn--primary" onClick={() => window.location.reload()}>
          Reload CampusFix
        </button>
      </div>
    );
  }
}

function RootRedirect() {
  const { firebaseUser, profile, status } = useAuth();
  if (status === "loading") return <LoadingScreen label="Loading CampusFix..." />;
  if (!firebaseUser) return <PublicHomePage />;
  if (status === "profile-missing") return <Navigate to="/profile-missing" replace />;
  return <Navigate to={portalHomeForRole(profile?.role)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/profile-missing" element={<ProfileMissingPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="towers" element={<AdminTowersPage />} />
        <Route path="departments" element={<AdminDepartmentsPage />} />
        <Route path="workers" element={<AdminWorkersPage />} />
        <Route path="teams" element={<AdminTeamsPage />} />
        <Route path="complaints" element={<AdminComplaintsPage />} />
        <Route path="complaints/:reportId" element={<AdminComplaintDetailPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentPortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TowerSelectPage />} />
        <Route path="raise/:towerId" element={<RaiseComplaintPage />} />
        <Route path="confirmation/:reportId" element={<ComplaintConfirmationPage />} />
        <Route path="complaints" element={<MyComplaintsPage />} />
        <Route path="complaints/:reportId" element={<StudentComplaintDetailPage />} />
      </Route>

      <Route
        path="/worker"
        element={
          <ProtectedRoute allowedRoles={["operations"]}>
            <WorkerPortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<WorkerDashboardPage />} />
        <Route path="complaints/:reportId" element={<WorkerComplaintDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
