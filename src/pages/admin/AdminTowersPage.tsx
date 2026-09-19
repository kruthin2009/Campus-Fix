import { useEffect, useState, type FormEvent } from "react";
import {
  createTower,
  deleteTower,
  listAllTowers,
  setTowerActive,
  updateTower,
} from "../../services/towerService";
import { isMediaUploadEnabled } from "../../services/mediaService";
import {
  EmptyState,
  ErrorState,
  SkeletonCard,
  useConfirm,
} from "../../components/common/Common";
import { useToast } from "../../context/ToastContext";
import type { Tower } from "../../types/models";

const emptyForm = { name: "", number: "", description: "" };

export function AdminTowersPage() {
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [towers, setTowers] = useState<Tower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tower | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setTowers(await listAllTowers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load towers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(tower: Tower) {
    setEditing(tower);
    setForm({
      name: tower.name,
      number: String(tower.number),
      description: tower.description ?? "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.number.trim()) {
      showToast("Name and number are required.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateTower(editing.id, {
          name: form.name,
          number: Number(form.number),
          description: form.description,
        });
        showToast("Tower updated.", "success");
      } else {
        await createTower({
          name: form.name,
          number: Number(form.number),
          description: form.description,
        });
        showToast("Tower created.", "success");
      }
      setShowForm(false);
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to save tower.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(tower: Tower) {
    try {
      await setTowerActive(tower.id, !tower.isActive);
      showToast(
        `Tower ${tower.isActive ? "deactivated" : "activated"}.`,
        "success"
      );
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to update tower.",
        "error"
      );
    }
  }

  async function handleDelete(tower: Tower) {
    const ok = await confirm({
      title: "Delete Tower",
      message: `Delete "${tower.name}"? This cannot be undone. Existing complaints will keep the tower's name on record.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteTower(tower.id);
      showToast("Tower deleted.", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to delete tower.",
        "error"
      );
    }
  }

  return (
    <div>
      <div className="page-header page-header--row">
        <div>
          <h1>Towers</h1>
          <p>Manage campus residential/academic towers.</p>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          + Add Tower
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? (
        <div className="card-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : towers.length === 0 ? (
        <EmptyState
          title="No towers yet"
          description="Add your first tower to let students start raising complaints."
          action={
            <button className="btn btn--primary" onClick={openCreate}>
              + Add Tower
            </button>
          }
        />
      ) : (
        <div className="card-grid">
          {towers.map((tower) => (
            <div key={tower.id} className="card tower-admin-card">
              <div className="tower-admin-card__image">
                {tower.imageUrl ? (
                  <img src={tower.imageUrl} alt={tower.name} />
                ) : (
                  <div className="tower-placeholder">🏢</div>
                )}
              </div>
              <div className="tower-admin-card__body">
                <div className="tower-admin-card__title-row">
                  <h3>{tower.name}</h3>
                  <span
                    className={`badge ${
                      tower.isActive ? "badge--active" : "badge--inactive"
                    }`}
                  >
                    {tower.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="muted">Tower #{tower.number}</p>
                {tower.description && <p>{tower.description}</p>}
                <div className="card__actions">
                  <button className="btn btn--secondary btn--sm" onClick={() => openEdit(tower)}>
                    Edit
                  </button>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => handleToggleActive(tower)}
                  >
                    {tower.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => handleDelete(tower)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Edit Tower" : "Add Tower"}</h3>
            <form onSubmit={handleSubmit} className="stacked-form">
              <label className="field">
                <span>Tower Name *</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tower 1"
                />
              </label>
              <label className="field">
                <span>Tower Number *</span>
                <input
                  required
                  type="number"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                />
              </label>
              {!isMediaUploadEnabled() && (
                <p className="muted" style={{ fontSize: "0.85rem" }}>
                  Photo upload is currently unavailable (Firebase Storage is
                  not enabled). Towers can be created without a photo.
                </p>
              )}
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create Tower"}
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
