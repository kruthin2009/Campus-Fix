import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { subscribeToAllReports, type ReportFilters } from "../../services/reportService";
import { listAllTowers } from "../../services/towerService";
import { listAllDepartments } from "../../services/departmentService";
import { listActiveTeams } from "../../services/teamService";
import {
  EmptyState,
  ErrorState,
  PriorityBadge,
  SkeletonCard,
  StatusBadge,
} from "../../components/common/Common";
import type {
  Department,
  Report,
  ReportPriority,
  ReportStatus,
  Tower,
  WorkerTeam,
} from "../../types/models";

const STATUSES: ReportStatus[] = [
  "submitted",
  "assigned",
  "in_progress",
  "completed",
  "closed",
  "rejected",
];
const PRIORITIES: ReportPriority[] = ["low", "medium", "high", "urgent"];

export function AdminComplaintsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<WorkerTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters: ReportFilters = useMemo(
    () => ({
      towerId: searchParams.get("towerId") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      assignedTeamId: searchParams.get("assignedTeamId") || undefined,
      status: (searchParams.get("status") as ReportStatus) || undefined,
      priority: (searchParams.get("priority") as ReportPriority) || undefined,
    }),
    [searchParams]
  );

  async function loadFilterOptions() {
    try {
      const [t, d, tm] = await Promise.all([
        listAllTowers(),
        listAllDepartments(),
        listActiveTeams(),
      ]);
      setTowers(t);
      setDepartments(d);
      setTeams(tm);
    } catch {
      /* filter dropdowns are non-critical; ignore failure */
    }
  }

  function loadReports() {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToAllReports(
      (allReports) => {
        const filtered = allReports.filter((report) =>
          (!filters.towerId || report.towerId === filters.towerId) &&
          (!filters.departmentId || report.departmentId === filters.departmentId) &&
          (!filters.assignedTeamId || report.assignedTeamId === filters.assignedTeamId) &&
          (!filters.status || report.status === filters.status) &&
          (!filters.priority || report.priority === filters.priority)
        );
        setReports(filtered);
        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err.message : "Unable to load complaints.");
        setLoading(false);
      }
    );
    return unsubscribe;
  }

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    const unsubscribe = loadReports();
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Complaints</h1>
        <p>All complaints across campus.</p>
      </div>

      <div className="filter-bar">
        <select value={filters.towerId ?? ""} onChange={(e) => updateFilter("towerId", e.target.value)}>
          <option value="">All Towers</option>
          {towers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={filters.departmentId ?? ""}
          onChange={(e) => updateFilter("departmentId", e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={filters.assignedTeamId ?? ""}
          onChange={(e) => updateFilter("assignedTeamId", e.target.value)}
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select value={filters.status ?? ""} onChange={(e) => updateFilter("status", e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={filters.priority ?? ""}
          onChange={(e) => updateFilter("priority", e.target.value)}
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {searchParams.toString() && (
          <button className="btn btn--secondary btn--sm" onClick={() => setSearchParams({})}>
            Clear filters
          </button>
        )}
      </div>

      {error && <ErrorState message={error} onRetry={loadReports} />}

      {loading ? (
        <div className="card-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState title="No complaints match these filters" />
      ) : (
        <div className="simple-table-wrapper">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Complaint</th>
                <th>Student</th>
                <th>Tower / Room</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/admin/complaints/${r.id}`} className="table-link">
                      {r.title}
                    </Link>
                  </td>
                  <td>{r.studentName}</td>
                  <td>
                    {r.towerName} / {r.roomNumber}
                  </td>
                  <td>{r.departmentName}</td>
                  <td>
                    <PriorityBadge priority={r.priority} />
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="muted">
                    {r.createdAt?.toDate
                      ? r.createdAt.toDate().toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
