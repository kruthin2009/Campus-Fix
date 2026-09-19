import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import { ThemeToggle } from "../../components/common/ThemeToggle";

export function ProfileMissingPage() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="auth-screen auth-screen--animated">
      <div className="auth-theme-toggle"><ThemeToggle /></div>
      <div className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-card__logo">CF</span>
          <h1>Account Not Set Up</h1>
        </div>
        <p>
          You're signed in, but we couldn't find a profile for your account.
          This usually means your account is still being set up.
        </p>
        <p>
          Please contact the administrator to complete your account setup, or
          sign out and try again.
        </p>
        <button className="btn btn--secondary btn--block" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
