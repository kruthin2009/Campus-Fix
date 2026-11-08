import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  getAdminDashboardCounts,
  syncCampusPublicSnapshot,
  type AdminDashboardCounts,
} from "../../services/dashboardService";
import { Skeleton, ErrorState, StatusBadge, PriorityBadge } from "../../components/common/Common";
import { subscribeToAllReports } from "../../services/reportService";
import type { Report } from "../../types/models";

const STAT_CARDS: {
  key: keyof AdminDashboardCounts;
  label: string;
  icon: string;
  accent: string;
  link?: string;
}[] = [
  { key: "totalStudents", label: "Total Students", icon: "🎓", accent: "blue", link: "/admin/users" },
  { key: "totalWorkers", label: "Total Workers", icon: "🛠️", accent: "purple", link: "/admin/workers" },
  { key: "totalTeams", label: "Total Teams", icon: "👥", accent: "teal", link: "/admin/teams" },
  { key: "totalTowers", label: "Total Towers", icon: "🏢", accent: "orange", link: "/admin/towers" },
  { key: "openComplaints", label: "Open Complaints", icon: "📥", accent: "red", link: "/admin/complaints?status=submitted" },
  { key: "assignedComplaints", label: "Assigned", icon: "📌", accent: "amber", link: "/admin/complaints?status=assigned" },
  { key: "inProgressComplaints", label: "In Progress", icon: "⏳", accent: "indigo", link: "/admin/complaints?status=in_progress" },
  { key: "completedComplaints", label: "Completed", icon: "✅", accent: "green", link: "/admin/complaints?status=completed" },
  { key: "closedComplaints", label: "Closed", icon: "🔒", accent: "gray", link: "/admin/complaints?status=closed" },
];

export function AdminDashboardPage() {
  const [counts, setCounts] = useState<AdminDashboardCounts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsError, setReportsError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllReports(
      setReports,
      (err) => setReportsError(err instanceof Error ? err.message : "Unable to load complaint analytics.")
    );
    return unsubscribe;
  }, []);

  const towerStats = Object.values(reports.reduce<Record<string, { name: string; total: number; active: number; urgent: number }>>((acc, report) => {
    const key = report.towerId || report.towerName || "unknown";
    acc[key] ??= { name: report.towerName || "Unspecified tower", total: 0, active: 0, urgent: 0 };
    acc[key].total += 1;
    if (["submitted", "assigned", "in_progress"].includes(report.status)) acc[key].active += 1;
    if (report.priority === "urgent" && !["completed", "closed", "rejected"].includes(report.status)) acc[key].urgent += 1;
    return acc;
  }, {})).sort((a,b) => a.name.localeCompare(b.name));

  const departmentStats = Object.values(reports.reduce<Record<string, { name: string; total: number; active: number }>>((acc, report) => {
    const key = report.departmentId || report.departmentName || "unknown";
    acc[key] ??= { name: report.departmentName || "Unspecified department", total: 0, active: 0 };
    acc[key].total += 1;
    if (["submitted", "assigned", "in_progress"].includes(report.status)) acc[key].active += 1;
    return acc;
  }, {})).sort((a,b) => b.active - a.active);

  const overdueReports = reports.filter((report) => {
    if (!["submitted", "assigned", "in_progress"].includes(report.status) || !report.createdAt?.toDate) return false;
    return Date.now() - report.createdAt.toDate().getTime() > 72 * 60 * 60 * 1000;
  });

  function exportComplaintsCsv() {
    const headers = ["Complaint ID","Title","Tower","Room","Department","Priority","Status","Assigned Team","Assigned Worker","Created At"];
    const rows = reports.map((r) => [r.id,r.title,r.towerName,r.roomNumber,r.departmentName,r.priority,r.status,r.assignedTeamName ?? "",r.assignedWorkerName ?? "",r.createdAt?.toDate ? r.createdAt.toDate().toISOString() : ""]);
    const csv = [headers, ...rows].map((row) => row.map((value) => '"' + String(value ?? "").replace(/"/g, '""') + '"').join(",")).join("\\r\\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "campusfix-complaints-export.csv"; anchor.click();
    URL.revokeObjectURL(url);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDashboardCounts();
      setCounts(data);
      // Public stats are a convenience layer for the landing page. Never let
      // a public-snapshot write/query failure break the admin dashboard.
      try {
        await syncCampusPublicSnapshot(data);
      } catch (publicError) {
        console.warn("Public CampusFix snapshot could not be refreshed:", publicError);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>An overview of campus maintenance activity.</p>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <div className="stat-grid">
        {STAT_CARDS.map((card) => (
          <CardWrapper key={card.key} link={card.link}>
            <div className={`stat-card stat-card--${card.accent}`}>
              <div className="stat-card__icon">{card.icon}</div>
              <div>
                <div className="stat-card__value">
                  {loading || !counts ? (
                    <Skeleton height={28} width={48} />
                  ) : (
                    counts[card.key]
                  )}
                </div>
                <div className="stat-card__label">{card.label}</div>
              </div>
            </div>
          </CardWrapper>
        ))}
      </div>

      <div className="page-header page-header--row" style={{ marginTop: 28 }}>
        <div>
          <h2>Operations intelligence</h2>
          <p>Live breakdowns from complaints currently stored in CampusFix.</p>
        </div>
        <button className="btn btn--secondary" onClick={exportComplaintsCsv} disabled={reports.length === 0}>
          Export complaints CSV
        </button>
      </div>

      {reportsError && <ErrorState message={reportsError} />}
      <div className="stat-grid">
        <div className="stat-card"><div><div className="stat-card__value">{reports.length}</div><div className="stat-card__label">Total complaints loaded</div></div></div>
        <div className="stat-card"><div><div className="stat-card__value">{overdueReports.length}</div><div className="stat-card__label">Open over 72 hours</div></div></div>
        <div className="stat-card"><div><div className="stat-card__value">{reports.filter(r => r.priority === "urgent" && !["completed","closed","rejected"].includes(r.status)).length}</div><div className="stat-card__label">Urgent active</div></div></div>
      </div>

      <div className="detail-grid" style={{ marginTop: 20 }}>
        <section className="card">
          <h3>Complaint volume by tower</h3>
          {towerStats.length === 0 ? <p className="muted">No complaint data available yet.</p> : towerStats.map((item) => (
            <div key={item.name} style={{ padding: "10px 0", borderBottom: "1px solid var(--border-color, #ddd)" }}>
              <div className="page-header--row"><strong>{item.name}</strong><span>{item.total} total</span></div>
              <p className="muted">{item.active} active · {item.urgent} urgent</p>
            </div>
          ))}
        </section>
        <section className="card">
          <h3>Department workload</h3>
          {departmentStats.length === 0 ? <p className="muted">No complaint data available yet.</p> : departmentStats.map((item) => (
            <div key={item.name} style={{ padding: "10px 0", borderBottom: "1px solid var(--border-color, #ddd)" }}>
              <div className="page-header--row"><strong>{item.name}</strong><span>{item.active} active</span></div>
              <p className="muted">{item.total} total complaints</p>
            </div>
          ))}
        </section>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <h3>Priority queue — urgent active complaints</h3>
        {reports.filter(r => r.priority === "urgent" && !["completed","closed","rejected"].includes(r.status)).length === 0
          ? <p className="muted">No urgent active complaints.</p>
          : reports.filter(r => r.priority === "urgent" && !["completed","closed","rejected"].includes(r.status)).slice(0, 8).map((r) => (
            <Link key={r.id} to={`/admin/complaints/${r.id}`} className="list-row">
              <div><strong>{r.title}</strong><p className="muted">{r.towerName} · Room {r.roomNumber} · {r.departmentName}</p></div>
              <div className="badge-row"><PriorityBadge priority={r.priority}/><StatusBadge status={r.status}/></div>
            </Link>
          ))}
      </section>
    </div>
  );
}

function CardWrapper({
  link,
  children,
}: {
  link?: string;
  children: ReactNode;
}) {
  if (!link) return <>{children}</>;
  return (
    <Link to={link} className="stat-card-link">
      {children}
    </Link>
  );
}
