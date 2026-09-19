import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginWithEmail } from "../../services/authService";
import { portalHomeForRole } from "../../routes/ProtectedRoute";
import { LoadingScreen } from "../../components/common/Common";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { useEffect } from "react";

export function LoginPage() {
  const { firebaseUser, profile, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginAnimation, setShowLoginAnimation] = useState(false);

  useEffect(() => {
    if (!showLoginAnimation) return;
    const timer = window.setTimeout(() => setShowLoginAnimation(false), 1600);
    return () => window.clearTimeout(timer);
  }, [showLoginAnimation]);

  if (status === "loading" && firebaseUser) {
    return <LoadingScreen label="Loading your account..." />;
  }

  if (firebaseUser && status === "ready" && profile) {
    return <Navigate to={portalHomeForRole(profile.role)} replace />;
  }

  if (firebaseUser && status === "profile-missing") {
    return <Navigate to="/profile-missing" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      setShowLoginAnimation(true);
      // AuthContext listener will pick up the new session and this component
      // will redirect automatically once the profile loads.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen auth-screen--animated">
      <div className="auth-theme-toggle"><ThemeToggle /></div>
      {showLoginAnimation && (
        <div className="login-transition" aria-live="polite">
          <div className="login-transition__core"><span>CF</span></div>
          <div className="login-transition__ring login-transition__ring--one" />
          <div className="login-transition__ring login-transition__ring--two" />
          <strong>Entering CampusFix</strong>
          <small>Securely loading your workspace…</small>
        </div>
      )}
      <div className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-card__logo">CF</span>
          <h1>CampusFix</h1>
        </div>
        <p className="auth-card__subtitle">
          Campus Complaint &amp; Maintenance Management
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@campus.edu"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--block login-submit"
            disabled={submitting}
          >
            <span className="login-submit__shine" />
            {submitting ? <><span className="button-spinner" /> Signing in...</> : "Sign In →"}
          </button>
        </form>

        <div className="auth-card__links">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/signup">Create a student account</Link>
        </div>

        <p className="auth-card__note">
          Worker and admin accounts are created by the administrator and
          cannot be self-registered.
        </p>
      </div>
    </div>
  );
}
