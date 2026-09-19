import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { subscribeToWorkerReports } from "../../services/reportService";
import { getUserProfile } from "../../services/userService";
import { EmptyState, ErrorState, PriorityBadge, SkeletonCard, StatusBadge } from "../../components/common/Common";
import type { Report, WorkerProfile } from "../../types/models";

type BucketKey = "new" | "in_progress" | "urgent" | "today" | "completed" | "all";

const BUCKETS: { key: BucketKey; label: string }[] = [
  { key: "new", label: "New Assignments" },
  { key: "in_progress", label: "In Progress" },
  { key: "urgent", label: "Urgent" },
  { key: "today", label: "Today's Tasks" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "Assigned to Me" },
];

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function WorkerDashboardPage() {
  const { profile } = useAuth();
  const worker = profile as WorkerProfile | null;
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bucket, setBucket] = useState<BucketKey>("new");

  useEffect(() => {
    if (!worker) return;

    const currentWorker = worker;
    let unsubscribe = () => {};
    let cancelled = false;

    async function startAssignmentListener() {
      try {
        // Always re-read the worker profile before subscribing. Team assignment
        // can be changed by an admin while the worker is already signed in,
        // so the AuthContext copy may otherwise contain an old/null teamId.
        const freshProfile = await getUserProfile(currentWorker.uid);
        if (cancelled) return;
        const freshWorker: WorkerProfile =
          freshProfile?.role === "operations"
            ? (freshProfile as WorkerProfile)
            : currentWorker;

        unsubscribe = subscribeToWorkerReports(
          freshWorker.uid,
          freshWorker.teamId ?? null,
          setReports,
          (err) =>
            setError(
              err instanceof Error ? err.message : "Unable to load assignments."
            )
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load worker profile."
          );
        }
      }
    }

    startAssignmentListener();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [worker]);

  const filtered = useMemo(() => {
    if (!reports) return [];
    switch (bucket) {
      case "new":
        return reports.filter((r) => r.status === "assigned");
      case "in_progress":
        return reports.filter((r) => r.status === "in_progress");
      case "urgent":
        return reports.filter(
          (r) => r.priority === "urgent" && r.status !== "completed" && r.status !== "closed"
        );
      case "today":
        return reports.filter((r) => r.createdAt?.toDate && isToday(r.createdAt.toDate()));
      case "completed":
        return reports.filter((r) => r.status === "completed" || r.status === "closed");
      case "all":
      default:
        return reports.filter((r) => r.status !== "closed" && r.status !== "rejected");
    }
  }, [reports, bucket]);

  return (
    <div>
      <div className="page-header">
        <h1>My Work</h1>
        <p>Complaints assigned to you{worker?.teamName ? ` and ${worker.teamName}` : ""}.</p>
      </div>

      <div className="tab-bar">
        {BUCKETS.map((b) => (
          <button
            key={b.key}
            className={`tab-bar__tab ${bucket === b.key ? "is-active" : ""}`}
            onClick={() => setBucket(b.key)}
          >
            {b.label}
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} />}

      {reports === null && !error ? (
        <div className="card-grid">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Nothing here" description="Check back later or select another view." />
      ) : (
        <div className="card-grid">
          {filtered.map((r) => (
            <Link key={r.id} to={`/worker/complaints/${r.id}`} className="card complaint-card">
              <div className="complaint-card__header">
                <h3>{r.title}</h3>
                <StatusBadge status={r.status} />
              </div>
              <p className="muted">
                {r.towerName} / Room {r.roomNumber} • {r.departmentName}
              </p>
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                Reported by {r.studentName}
              </p>
              <div className="complaint-card__footer">
                <PriorityBadge priority={r.priority} />
                <span className="muted" style={{ fontSize: "0.8rem" }}>
                  {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
