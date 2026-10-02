import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { subscribeToReport, submitReview } from "../../services/reportService";
import {
  ErrorState,
  LoadingScreen,
  PriorityBadge,
  StarDisplay,
  StarRatingInput,
  StatusBadge,
} from "../../components/common/Common";
import { ReportTimeline } from "../../components/common/ReportTimeline";
import type { Report } from "../../types/models";

export function StudentComplaintDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!reportId) return;
    const unsubscribe = subscribeToReport(
      reportId,
      setReport,
      (err) =>
        setError(err instanceof Error ? err.message : "Unable to load complaint.")
    );
    return unsubscribe;
  }, [reportId]);

  if (error) return <ErrorState message={error} />;
  if (report === undefined) return <LoadingScreen label="Loading complaint..." />;
  if (report === null) return <ErrorState message="Complaint not found." />;

  // Security: students may only ever view their own complaint. Firestore
  // rules enforce this server-side; this client-side check prevents even
  // rendering another student's data if a stale/incorrect id were reached.
  if (firebaseUser && report.studentId !== firebaseUser.uid) {
    return <ErrorState message="You don't have access to this complaint." />;
  }

  async function handleSubmitReview() {
    if (!firebaseUser || rating === 0 || !report) return;
    setSubmitting(true);
    try {
      await submitReview(report, { rating, feedback, reviewedBy: firebaseUser.uid });
      showToast("Thanks for your feedback!", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to submit review.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button className="link-button" onClick={() => navigate(-1)}>
        ← Back to My Complaints
      </button>

      <div className="page-header page-header--row">
        <div>
          <h1>{report.title}</h1>
          <p className="muted">Complaint ID: {report.id}</p>
        </div>
        <div className="badge-row">
          <StatusBadge status={report.status} />
          <PriorityBadge priority={report.priority} />
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-grid__main">
          <section className="card">
            <h3>Details</h3>
            <dl className="detail-list">
              <div>
                <dt>Tower / Room</dt>
                <dd>
                  {report.towerName} / {report.roomNumber}
                </dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{report.departmentName}</dd>
              </div>
              <div>
                <dt>Description</dt>
                <dd>{report.description}</dd>
              </div>
              <div>
                <dt>Assigned Team</dt>
                <dd>{report.assignedTeamName ?? "Not yet assigned"}</dd>
              </div>
              <div>
                <dt>Assigned Worker</dt>
                <dd>{report.assignedWorkerName ?? "Not yet assigned"}</dd>
              </div>
            </dl>
            {report.photoUrl && (
              <img src={report.photoUrl} alt="Complaint" className="detail-photo" />
            )}
          </section>

          {report.resolution && (
            <section className="card">
              <h3>Resolution</h3>
              <p>{report.resolution.resolutionDescription}</p>
              {report.resolution.photoUrl && (
                <img
                  src={report.resolution.photoUrl}
                  alt="Completion"
                  className="detail-photo"
                />
              )}
            </section>
          )}

          <section className="card">
            <h3>Timeline</h3>
            <ReportTimeline reportId={report.id} />
          </section>
        </div>

        <div className="detail-grid__side">
          {report.status === "completed" && !report.review && (
            <section className="card">
              <h3>Was your issue resolved?</h3>
              <StarRatingInput value={rating} onChange={setRating} />
              <label className="field">
                <span>Feedback (optional)</span>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us more about your experience..."
                />
              </label>
              <button
                className="btn btn--primary btn--block"
                disabled={rating === 0 || submitting}
                onClick={handleSubmitReview}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </section>
          )}

          {report.review && (
            <section className="card">
              <h3>Your Review</h3>
              <StarDisplay rating={report.review.rating} />
              {report.review.feedback && <p>{report.review.feedback}</p>}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
