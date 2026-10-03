import { useEffect, useState, type FormEvent } from "react";
import {
  addWorkerToTeam,
  assignTeamDepartment,
  assignTeamLeader,
  createTeam,
  listActiveTeams,
  removeWorkerFromTeam,
  renameTeam,
  setTeamActive,
} from "../../services/teamService";
import { listAllDepartments } from "../../services/departmentService";
import { listWorkers } from "../../services/userService";
import { EmptyState, ErrorState, SkeletonCard } from "../../components/common/Common";
import { useToast } from "../../context/ToastContext";
import type { Department, WorkerProfile, WorkerTeam } from "../../types/models";

export function AdminTeamsPage() {
  const { showToast } = useToast();
  const [teams, setTeams] = useState<WorkerTeam[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [teamsResult, departmentsResult, workersResult] = await Promise.allSettled([
        listActiveTeams(),
        listAllDepartments(),
        listWorkers(),
      ]);

      const loadErrors: string[] = [];
      if (teamsResult.status === "fulfilled") setTeams(teamsResult.value);
      else loadErrors.push(teamsResult.reason instanceof Error ? teamsResult.reason.message : "Unable to load teams.");

      if (departmentsResult.status === "fulfilled") {
        const d = departmentsResult.value.filter((department) => department.isActive !== false);
        setDepartments(d);
        if (d.length > 0 && !departmentId) setDepartmentId(d[0].id);
      } else {
        setDepartments([]);
        loadErrors.push(departmentsResult.reason instanceof Error ? departmentsResult.reason.message : "Unable to load departments.");
      }

      if (workersResult.status === "fulfilled") setWorkers(workersResult.value);
      else loadErrors.push(workersResult.reason instanceof Error ? workersResult.reason.message : "Unable to load workers.");

      setError(loadErrors.length ? loadErrors.join(" ") : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load teams.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const dept = departments.find((d) => d.id === departmentId);
    if (!name.trim() || !dept) {
      showToast("Team name and department are required.", "error");
      return;
    }
    setSaving(true);
    try {
      await createTeam({ name, departmentId: dept.id, departmentName: dept.name });
      showToast("Team created.", "success");
      setShowForm(false);
      setName("");
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to create team.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRename(team: WorkerTeam) {
    const newName = window.prompt("Rename team", team.name);
    if (!newName || newName.trim() === team.name) return;
    try {
      await renameTeam(team.id, newName);
      showToast("Team renamed.", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to rename team.",
        "error"
      );
    }
  }

  async function handleChangeDepartment(team: WorkerTeam, deptId: string) {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;
    try {
      await assignTeamDepartment(team.id, dept.id, dept.name);
      showToast("Department updated.", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to update department.",
        "error"
      );
    }
  }

  async function handleAddWorker(team: WorkerTeam, workerId: string) {
    const worker = workers.find((w) => w.uid === workerId);
    if (!worker) return;
    try {
      await addWorkerToTeam(team, worker.uid, worker.name);
      showToast(`${worker.name} added to ${team.name}.`, "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to add worker.",
        "error"
      );
    }
  }

  async function handleRemoveWorker(team: WorkerTeam, workerId: string) {
    try {
      await removeWorkerFromTeam(team, workerId);
      showToast("Worker removed from team.", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to remove worker.",
        "error"
      );
    }
  }

  async function handleSetLeader(team: WorkerTeam, workerId: string) {
    const worker = workers.find((w) => w.uid === workerId);
    try {
      await assignTeamLeader(team.id, worker?.uid ?? null, worker?.name ?? null);
      showToast("Team leader updated.", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to assign leader.",
        "error"
      );
    }
  }

  async function handleToggleActive(team: WorkerTeam) {
    try {
      await setTeamActive(team.id, !team.isActive);
      await load();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to update team.",
        "error"
      );
    }
  }

  return (
    <div>
      <div className="page-header page-header--row">
        <div>
          <h1>Teams</h1>
          <p>Group workers into teams and assign them to departments.</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => setShowForm(true)}
          disabled={departments.length === 0}
        >
          + Add Team
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? (
        <div className="card-grid">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : teams.length === 0 ? (
        <EmptyState title="No teams yet" description="Create a team and assign workers to it." />
      ) : (
        <div className="team-list">
          {teams.map((team) => {
            const availableWorkers = workers.filter(
              (w) => !team.workerIds.includes(w.uid)
            );
            const teamWorkers = workers.filter((w) =>
              team.workerIds.includes(w.uid)
            );
            const expanded = expandedTeamId === team.id;
            return (
              <div key={team.id} className="card team-card">
                <div className="team-card__header">
                  <div>
                    <h3>{team.name}</h3>
                    <p className="muted">
                      {team.departmentName} • {team.workerIds.length} worker(s)
                      {team.leaderName ? ` • Lead: ${team.leaderName}` : ""}
                    </p>
                  </div>
                  <div className="card__actions">
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() =>
                        setExpandedTeamId(expanded ? null : team.id)
                      }
                    >
                      {expanded ? "Collapse" : "Manage"}
                    </button>
                    <button className="btn btn--secondary btn--sm" onClick={() => handleRename(team)}>
                      Rename
                    </button>
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => handleToggleActive(team)}
                    >
                      {team.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="team-card__body">
                    <label className="field">
                      <span>Department</span>
                      <select
                        value={team.departmentId}
                        onChange={(e) =>
                          handleChangeDepartment(team, e.target.value)
                        }
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span>Team Leader</span>
                      <select
                        value={team.leaderId ?? ""}
                        onChange={(e) => handleSetLeader(team, e.target.value)}
                      >
                        <option value="">No leader</option>
                        {teamWorkers.map((w) => (
                          <option key={w.uid} value={w.uid}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="field">
                      <span>Team Members</span>
                      {teamWorkers.length === 0 && (
                        <p className="muted">No workers assigned yet.</p>
                      )}
                      <ul className="team-member-list">
                        {teamWorkers.map((w) => (
                          <li key={w.uid}>
                            <span>
                              {w.name}{" "}
                              {team.leaderId === w.uid && (
                                <span className="badge badge--active">Leader</span>
                              )}
                            </span>
                            <button
                              className="link-button link-button--danger"
                              onClick={() => handleRemoveWorker(team, w.uid)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {availableWorkers.length > 0 && (
                      <label className="field">
                        <span>Add Worker</span>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) handleAddWorker(team, e.target.value);
                          }}
                        >
                          <option value="">Select a worker to add...</option>
                          {availableWorkers.map((w) => (
                            <option key={w.uid} value={w.uid}>
                              {w.name} ({w.workerType})
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Team</h3>
            <form onSubmit={handleCreate} className="stacked-form">
              <label className="field">
                <span>Team Name *</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Plumbing Team A"
                />
              </label>
              <label className="field">
                <span>Department *</span>
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
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
                  {saving ? "Creating..." : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
