import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/common/Common";
import type { UserRole } from "../types/models";

/**
 * Wrap any route that requires the user to be signed in AND hold one of the
 * given roles. If the user is signed in with a different role, they are
 * redirected to their own portal rather than seeing an error — a student who
 * types /admin in the URL bar is simply bounced to /student, never shown the
 * admin UI even momentarily.
 */
export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: ReactNode;
}) {
  const { firebaseUser, profile, status } = useAuth();

  if (status === "loading") {
    return <LoadingScreen label="Checking your session..." />;
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  if (status === "profile-missing") {
    return <Navigate to="/profile-missing" replace />;
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to={portalHomeForRole(profile?.role)} replace />;
  }

  return <>{children}</>;
}

export function portalHomeForRole(role?: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "operations":
      return "/worker";
    case "student":
      return "/student";
    default:
      return "/login";
  }
}
