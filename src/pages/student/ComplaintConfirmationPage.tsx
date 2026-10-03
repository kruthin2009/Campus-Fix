import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getReport } from "../../services/reportService";
import { ErrorState, LoadingScreen, StatusBadge } from "../../components/common/Common";
import type { Report } from "../../types/models";

export function ComplaintConfirmationPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;
    getReport(reportId)
      .then(setReport)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load complaint.")
      );
  }, [reportId]);

  if (error) return <ErrorState message={error} />;
  if (report === undefined) return <LoadingScreen />;
  if (report === null) return <ErrorState message="Complaint not found." />;

  return (
    <div className="confirmation-screen">
      <div className="confirmation-card">
        <div className="confirmation-card__icon">✅</div>
        <h1>Complaint Submitted</h1>
        <p className="muted">
          We've received your complaint and it's now awaiting review.
        </p>

        <dl className="detail-list detail-list--center">
          <div>
            <dt>Complaint ID</dt>
            <dd>{report.id}</dd>
          </div>
          <div>
            <dt>Tower</dt>
            <dd>{report.towerName}</dd>
          </div>
          <div>
            <dt>Room Number</dt>
            <dd>{report.roomNumber}</dd>
          </div>
          <div>
            <dt>Issue</dt>
            <dd>{report.title}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={report.status} />
            </dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>
              {report.createdAt?.toDate
                ? report.createdAt.toDate().toLocaleString()
                : ""}
            </dd>
          </div>
        </dl>

        <div className="confirmation-card__actions">
          <Link to="/student/complaints" className="btn btn--primary">
            View My Complaints
          </Link>
          <Link to="/student" className="btn btn--secondary">
            Raise Another Complaint
          </Link>
        </div>
      </div>
    </div>
  );
}
