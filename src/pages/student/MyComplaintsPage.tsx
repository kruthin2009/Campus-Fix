import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { subscribeToStudentReports } from "../../services/reportService";
import {
  EmptyState,
  ErrorState,
  PriorityBadge,
  SkeletonCard,
  StatusBadge,
} from "../../components/common/Common";
import type { Report } from "../../types/models";

export function MyComplaintsPage() {
  const { firebaseUser } = useAuth();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubscribe = subscribeToStudentReports(
      firebaseUser.uid,
      setReports,
      (err) =>
        setError(err instanceof Error ? err.message : "Unable to load complaints.")
    );
    return unsubscribe;
  }, [firebaseUser]);

  return (
    <div>
      <div className="page-header page-header--row">
        <div>
          <h1>My Complaints</h1>
          <p>Track the status of complaints you've raised.</p>
        </div>
        <Link to="/student" className="btn btn--primary">
          + Raise Complaint
        </Link>
      </div>

      {error && <ErrorState message={error} />}

      {reports === null && !error ? (
        <div className="card-grid">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : reports && reports.length === 0 ? (
        <EmptyState
          title="No complaints yet"
          description="Raise a complaint to get started."
          action={
            <Link to="/student" className="btn btn--primary">
              + Raise Complaint
            </Link>
          }
        />
      ) : (
        <div className="card-grid">
          {reports?.map((r) => (
            <Link key={r.id} to={`/student/complaints/${r.id}`} className="card complaint-card">
              <div className="complaint-card__header">
                <h3>{r.title}</h3>
                <StatusBadge status={r.status} />
              </div>
              <p className="muted">
                {r.towerName} / Room {r.roomNumber} • {r.departmentName}
              </p>
              <div className="complaint-card__footer">
                <PriorityBadge priority={r.priority} />
                <span className="muted" style={{ fontSize: "0.8rem" }}>
                  {r.createdAt?.toDate
                    ? r.createdAt.toDate().toLocaleDateString()
                    : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
