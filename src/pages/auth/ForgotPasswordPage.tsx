import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { sendResetEmail } from "../../services/authService";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await sendResetEmail(email);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to send reset email."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen auth-screen--animated">
      <div className="auth-theme-toggle"><ThemeToggle /></div>
      <div className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-card__logo">CF</span>
          <h1>Forgot Password?</h1>
        </div>
        <p className="auth-card__subtitle">Enter the email address linked to your CampusFix account. Firebase will email you a secure password-reset link.</p>

        {sent ? (
          <div className="form-success">
            If an account exists for that email, Firebase has sent a password-reset link. Check your inbox and spam folder, then follow the link to choose a new password.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="auth-card__links">
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
