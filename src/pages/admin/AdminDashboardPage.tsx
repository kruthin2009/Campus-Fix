import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminDashboardCounts,
  syncCampusPublicSnapshot,
  type AdminDashboardCounts,
} from "../../services/dashboardService";
import { Skeleton, ErrorState } from "../../components/common/Common";

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
    </div>
  );
}

function CardWrapper({
  link,
  children,
}: {
  link?: string;
  children: React.ReactNode;
}) {
  if (!link) return <>{children}</>;
  return (
    <Link to={link} className="stat-card-link">
      {children}
    </Link>
  );
}
