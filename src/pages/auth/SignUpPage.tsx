import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerStudent } from "../../services/authService";
import { ThemeToggle } from "../../components/common/ThemeToggle";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  studentId: "",
  rollNumber: "",
  roomNumber: "",
  className: "",
  semester: "",
  phone: "",
};

export function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof initialForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    for (const required of [
      "name",
      "email",
      "studentId",
      "rollNumber",
      "roomNumber",
      "className",
      "semester",
    ] as const) {
      if (!form[required].trim()) {
        setError("Please fill in all required fields.");
        return;
      }
    }

    setSubmitting(true);
    try {
      await registerStudent(form);
      navigate("/student", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create your account."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen auth-screen--animated">
      <div className="auth-theme-toggle"><ThemeToggle /></div>
      <div className="auth-card auth-card--wide">
        <div className="auth-card__brand">
          <span className="auth-card__logo">CF</span>
          <h1>Create Student Account</h1>
        </div>
        <p className="auth-card__subtitle">
          For students only. Admin and worker accounts are created by the
          administrator.
        </p>

        <form onSubmit={handleSubmit} className="auth-form auth-form--grid">
          <label className="field">
            <span>Full Name *</span>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Email *</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Password *</span>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Confirm Password *</span>
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Student ID *</span>
            <input
              required
              value={form.studentId}
              onChange={(e) => update("studentId", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Roll Number *</span>
            <input
              required
              value={form.rollNumber}
              onChange={(e) => update("rollNumber", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Room Number *</span>
            <input
              required
              value={form.roomNumber}
              onChange={(e) => update("roomNumber", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Class *</span>
            <input
              required
              placeholder="e.g. B.Tech CSE"
              value={form.className}
              onChange={(e) => update("className", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Semester *</span>
            <input
              required
              placeholder="e.g. 5"
              value={form.semester}
              onChange={(e) => update("semester", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Phone</span>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </label>

          {error && (
            <div className="form-error form-error--span" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--block form-error--span"
            disabled={submitting}
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-card__links">
          <Link to="/login">Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  );
}
