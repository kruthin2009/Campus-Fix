import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createAdministratorAccount } from "../../services/userService";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../components/common/Common";

export function AdminSettingsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreateAdministrator() {
    if (!adminName.trim() || !adminEmail.trim()) {
      showToast("Enter the administrator name and email.", "error");
      return;
    }
    const ok = await confirm({
      title: "Add Administrator",
      message: `Create an Administrative account for ${adminName.trim()}? Firebase will send a password-reset email to ${adminEmail.trim()}.`,
      confirmLabel: "Create Administrator",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await createAdministratorAccount({ name: adminName, email: adminEmail });
      showToast(`Administrative account created for ${adminName.trim()}. A password-reset email was sent.`, "success");
      setAdminName("");
      setAdminEmail("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to create administrator.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Administrative Settings</h1>
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
        <h3>Add Administrator</h3>
        <p className="muted">
          Enter only the administrator's name and email. The new account receives the Administrative role, and Firebase sends the user a password-reset email so no password needs to be shared with you.
        </p>
        <label className="field">
          <span>Name *</span>
          <input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="MVPK. Jivan" />
        </label>
        <label className="field">
          <span>Email *</span>
          <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="jivan@example.com" />
        </label>
        <button className="btn btn--danger" disabled={busy} onClick={handleCreateAdministrator}>
          {busy ? "Creating..." : "Add Administrator"}
        </button>
      </section>

      {dialog}
    </div>
  );
}
