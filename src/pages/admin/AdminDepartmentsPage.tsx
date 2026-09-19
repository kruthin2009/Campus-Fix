import { useEffect, useState, type FormEvent } from "react";
import {
  createDepartment,
  deleteDepartment,
  listAllDepartments,
  setDepartmentActive,
  updateDepartment,
} from "../../services/departmentService";
import {
  EmptyState,
  ErrorState,
  SkeletonCard,
  useConfirm,
} from "../../components/common/Common";
import { useToast } from "../../context/ToastContext";
import type { Department } from "../../types/models";

export function AdminDepartmentsPage() {
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDepartments(await listAllDepartments());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load departments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setShowForm(true);
  }

  function openEdit(department: Department) {
    setEditing(department);
    setName(department.name);
    setDescription(department.description ?? "");
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Department name is required.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDepartment(editing.id, { name, description });
        showToast("Department updated.", "success");
      } else {
        await createDepartment({ name, description });
        showToast("Department created.", "success");
      }
      setShowForm(false);
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to save department.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(department: Department) {
    try {
      await setDepartmentActive(department.id, !department.isActive);
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to update department.",
        "error"
      );
    }
  }

  async function handleDelete(department: Department) {
    const ok = await confirm({
      title: "Delete Department",
      message: `Delete "${department.name}"? Existing complaints referencing it will keep the name on record.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteDepartment(department.id);
      showToast("Department deleted.", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to delete department.",
        "error"
      );
    }
  }

  return (
    <div>
      <div className="page-header page-header--row">
        <div>
          <h1>Departments</h1>
          <p>Categories used to route complaints (Plumbing, Electrical, etc.)</p>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          + Add Department
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? (
        <div className="card-grid">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          title="No departments yet"
          description="Add departments like Plumbing, Electrical, or WiFi/Network."
          action={
            <button className="btn btn--primary" onClick={openCreate}>
              + Add Department
            </button>
          }
        />
      ) : (
        <div className="simple-table-wrapper">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td className="muted">{d.description || "—"}</td>
                  <td>
                    <span
                      className={`badge ${
                        d.isActive ? "badge--active" : "badge--inactive"
                      }`}
                    >
                      {d.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="simple-table__actions">
                    <button className="btn btn--secondary btn--sm" onClick={() => openEdit(d)}>
                      Edit
                    </button>
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => handleToggleActive(d)}
                    >
                      {d.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button className="btn btn--danger btn--sm" onClick={() => handleDelete(d)}>
                      Delete
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
            <h3>{editing ? "Edit Department" : "Add Department"}</h3>
            <form onSubmit={handleSubmit} className="stacked-form">
              <label className="field">
                <span>Name *</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Plumbing"
                />
              </label>
              <label className="field">
                <span>Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </label>
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dialog}
    </div>
  );
}
