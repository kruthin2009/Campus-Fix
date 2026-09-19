import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { promoteToAdmin } from "../../services/userService";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../components/common/Common";

export function AdminSettingsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [targetUid, setTargetUid] = useState("");
  const [busy, setBusy] = useState(false);

  async function handlePromote() {
    if (!targetUid.trim()) {
      showToast("Enter the user's UID.", "error");
      return;
    }
    const ok = await confirm({
      title: "Grant Admin Access",
      message:
        "This will give the specified user full administrative access to CampusFix, including managing all users, towers, teams, and complaints. Only do this for someone you have verified.",
      confirmLabel: "Grant Admin Access",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await promoteToAdmin(targetUid.trim());
      showToast("User promoted to admin.", "success");
      setTargetUid("");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to update role.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Account and administrative settings.</p>
      </div>

      <section className="card">
        <h3>Your Account</h3>
        <dl className="detail-list">
          <div>
            <dt>Name</dt>
            <dd>{profile?.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{profile?.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>Administrator</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h3>Grant Admin Access</h3>
        <p className="muted">
          Promoting a user to admin is a deliberate, sensitive action. New
          sign-ups are never automatically made admins — you must explicitly
          grant access here using the target user's UID (visible on the
          Users page or in the Firebase console).
        </p>
        <label className="field">
          <span>User UID</span>
          <input
            value={targetUid}
            onChange={(e) => setTargetUid(e.target.value)}
            placeholder="Firebase Auth UID"
          />
        </label>
        <button
          className="btn btn--danger"
          disabled={busy}
          onClick={handlePromote}
        >
          {busy ? "Updating..." : "Grant Admin Access"}
        </button>
      </section>

      {dialog}
    </div>
  );
}
