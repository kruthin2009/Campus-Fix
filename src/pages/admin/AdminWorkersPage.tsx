import { useEffect, useState, type FormEvent } from "react";
import { createWorkerAccount, listWorkers, setUserActive } from "../../services/userService";
import { listAllDepartments } from "../../services/departmentService";
import { EmptyState, ErrorState, SkeletonCard } from "../../components/common/Common";
import { useToast } from "../../context/ToastContext";
import type { Department, WorkerProfile, WorkerType } from "../../types/models";

const WORKER_TYPES: WorkerType[] = [
  "Plumber",
  "Electrician",
  "WiFi Technician",
  "Carpenter",
  "Cleaner",
  "Maintenance",
  "Other",
];

const emptyForm = {
  name: "",
  email: "",
  temporaryPassword: "",
  phone: "",
  workerId: "",
  workerType: "Plumber" as WorkerType,
  department: "",
};

export function AdminWorkersPage() {
  const { showToast } = useToast();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);

    // Load workers and departments independently. If one Firestore query fails
    // (for example because of an index or network issue), do not hide the
    // successfully loaded data from the other query.
    const [workersResult, departmentsResult] = await Promise.allSettled([
      listWorkers(),
      listAllDepartments(),
    ]);

    if (workersResult.status === "fulfilled") {
      setWorkers(workersResult.value);
    } else {
      setWorkers([]);
    }

    if (departmentsResult.status === "fulfilled") {
      const d = departmentsResult.value.filter((department) => department.isActive !== false);
      setDepartments(d);
      if (d.length > 0 && !form.department) {
        setForm((f) => ({ ...f, department: d[0].name }));
      }
    } else {
      setDepartments([]);
    }

    const errors: string[] = [];
    if (workersResult.status === "rejected") {
      errors.push(
        workersResult.reason instanceof Error
          ? workersResult.reason.message
          : "Unable to load workers."
      );
    }
    if (departmentsResult.status === "rejected") {
      errors.push(
        departmentsResult.reason instanceof Error
          ? departmentsResult.reason.message
          : "Unable to load departments."
      );
    }
    setError(errors.length > 0 ? errors.join(" ") : null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.temporaryPassword ||
      !form.workerId.trim() ||
      !form.department
    ) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    if (form.temporaryPassword.length < 6) {
      showToast("Temporary password must be at least 6 characters.", "error");
      return;
    }
    setSaving(true);
    try {
      await createWorkerAccount({
        name: form.name,
        email: form.email,
        temporaryPassword: form.temporaryPassword,
        phone: form.phone,
        workerId: form.workerId,
        workerType: form.workerType,
        department: form.department,
      });
      showToast(
        `Worker account created. Share the temporary password with ${form.name} securely.`,
        "success"
      );
      setShowForm(false);
      setForm({ ...emptyForm, department: departments[0]?.name ?? "" });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create worker.";
      showToast(message, "error");
      // Keep the modal open so the admin can correct the field or Firebase
      // configuration without losing everything they entered.

    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(worker: WorkerProfile) {
    try {
      await setUserActive(worker.uid, !worker.isActive);
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to update worker.",
        "error"
      );
    }
  }

  return (
    <div>
      <div className="page-header page-header--row">
        <div>
          <h1>Workers</h1>
          <p>Create and manage operations staff accounts.</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => setShowForm(true)}
          disabled={loading || departments.length === 0}
        >
          + Add Worker
        </button>
      </div>

      {departments.length === 0 && !loading && !error && (
        <div className="banner banner--warning">
          Create at least one department before adding workers.
        </div>
      )}

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? (
        <div className="card-grid">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : workers.length === 0 ? (
        <EmptyState
          title="No workers yet"
          description="Add worker accounts so complaints can be assigned to them."
        />
      ) : (
        <div className="simple-table-wrapper">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Worker ID</th>
                <th>Type</th>
                <th>Department</th>
                <th>Team</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.uid}>
                  <td>
                    <div>{w.name}</div>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {w.email}
                    </div>
                  </td>
                  <td>{w.workerId}</td>
                  <td>{w.workerType}</td>
                  <td>{w.department}</td>
                  <td>{w.teamName ?? "Unassigned"}</td>
                  <td>
                    <span
                      className={`badge ${
                        w.isActive ? "badge--active" : "badge--inactive"
                      }`}
                    >
                      {w.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="simple-table__actions">
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => handleToggleActive(w)}
                    >
                      {w.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Worker</h3>
            <form onSubmit={handleSubmit} className="stacked-form">
              <label className="field">
                <span>Full Name *</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Email *</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Temporary Password *</span>
                <input
                  type="text"
                  required
                  value={form.temporaryPassword}
                  onChange={(e) =>
                    setForm({ ...form, temporaryPassword: e.target.value })
                  }
                  placeholder="At least 6 characters"
                />
              </label>
              <label className="field">
                <span>Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Worker ID *</span>
                <input
                  required
                  value={form.workerId}
                  onChange={(e) =>
                    setForm({ ...form, workerId: e.target.value })
                  }
                  placeholder="W-1001"
                />
              </label>
              <label className="field">
                <span>Worker Type *</span>
                <select
                  value={form.workerType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      workerType: e.target.value as WorkerType,
                    })
                  }
                >
                  {WORKER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Department *</span>
                <select
                  required
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                Team assignment is done from the Teams page after creating the
                worker.
              </p>
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? "Creating..." : "Create Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
