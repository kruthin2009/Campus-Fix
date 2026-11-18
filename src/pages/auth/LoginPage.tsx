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
      <div className="login-experience">
        <aside className="login-showcase" aria-label="CampusFix platform overview">
          <div className="login-showcase__top"><span className="login-showcase__mark">CF</span><span>CAMPUS OPERATIONS PLATFORM</span></div>
          <div className="login-showcase__content">
            <span className="login-showcase__eyebrow"><i /> ONE CONNECTED CAMPUS</span>
            <h2>Better spaces.<br /><em>Better campus life.</em></h2>
            <p>One clear place to report issues, coordinate campus teams, and keep every update moving.</p>
            <div className="login-showcase__flow">
              <div><b>01</b><span><strong>Report</strong><small>Share an issue clearly</small></span></div>
              <div><b>02</b><span><strong>Coordinate</strong><small>Keep teams in sync</small></span></div>
              <div><b>03</b><span><strong>Resolve</strong><small>Track progress to completion</small></span></div>
            </div>
          </div>
          <div className="login-showcase__footer"><span>BUILT FOR CAMPUS COMMUNITIES</span><span>SECURE · SIMPLE · CONNECTED</span></div>
          <div className="login-showcase__orb login-showcase__orb--one" /><div className="login-showcase__orb login-showcase__orb--two" />
        </aside>
        <div className="auth-card login-card">
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
          Worker and administrative accounts are created by an administrator and
          cannot be self-registered.
        </p>

        <div className="auth-release-bar" aria-label="CampusFix release information">
          <span className="auth-release-version">V2.1.0</span>
          <span>CampusFix · Campus operations release</span>
        </div>
        <nav className="auth-policy-links" aria-label="CampusFix policies and rules">
          <Link to="/policies">Policies</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/policies/rules">Rules</Link>
        </nav>
        </div>
      </div>
    </div>
  );
}
