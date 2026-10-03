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
          <h1>Reset Password</h1>
        </div>

        {sent ? (
          <div className="form-success">
            If an account exists for that email, a password reset link has
            been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                required
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
