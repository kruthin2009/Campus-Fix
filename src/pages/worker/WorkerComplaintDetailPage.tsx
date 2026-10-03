import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  acceptAssignment,
  addProgressUpdate,
  markCompleted,
  startWork,
  subscribeToReport,
} from "../../services/reportService";
import { isMediaUploadEnabled } from "../../services/mediaService";
import {
  ErrorState,
  LoadingScreen,
  PriorityBadge,
  StatusBadge,
} from "../../components/common/Common";
import { ReportTimeline } from "../../components/common/ReportTimeline";
import type { Report, WorkerProfile } from "../../types/models";

export function WorkerComplaintDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const { profile } = useAuth();
  const worker = profile as WorkerProfile | null;
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [showComplete, setShowComplete] = useState(false);
  const [workSummary, setWorkSummary] = useState("");
  const [resolutionDescription, setResolutionDescription] = useState("");
  const [completionPhoto, setCompletionPhoto] = useState<File | null>(null);

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
  if (!worker) return null;

  // Client-side guard mirroring the security rules: a worker should only be
  // looking at complaints assigned to them directly or to their team.
  const hasAccess =
    report.assignedWorkerId === worker.uid ||
    (worker.teamId && report.assignedTeamId === worker.teamId);
  if (!hasAccess) {
    return <ErrorState message="This complaint is not assigned to you or your team." />;
  }

  const actor = { id: worker.uid, name: worker.name, role: worker.role };

  const handleAccept = async () => {
    if (!report) return;
    setBusy(true);
    try {
      await acceptAssignment(report, actor);
      showToast("Assignment accepted.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to accept.", "error");
    } finally {
      setBusy(false);
    }
  }

  const handleStartWork = async () => {
    if (!report) return;
    setBusy(true);
    try {
      await startWork(report, actor);
      showToast("Work started.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to update.", "error");
    } finally {
      setBusy(false);
    }
  }

  const handleAddProgress = async () => {
    if (!report || !progressMessage.trim()) return;
    setBusy(true);
    try {
      await addProgressUpdate(report, progressMessage.trim(), actor);
      setProgressMessage("");
      showToast("Progress update posted.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to post update.", "error");
    } finally {
      setBusy(false);
    }
  }

  const handleMarkCompleted = async () => {
    if (!report || !workSummary.trim() || !resolutionDescription.trim()) {
      showToast("Work summary and resolution description are required.", "error");
      return;
    }
    setBusy(true);
    try {
      await markCompleted(report, {
        workSummary,
        resolutionDescription,
        photoFile: completionPhoto,
        completedBy: worker.uid,
        completedByName: worker.name,
      });
      showToast("Complaint marked as completed.", "success");
      setShowComplete(false);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to mark as completed.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  const canWork = report.status !== "completed" && report.status !== "closed" && report.status !== "rejected";

  return (
    <div>
      <button className="link-button" onClick={() => navigate(-1)}>
        ← Back to My Work
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
            <h3>Complaint Details</h3>
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
                <dt>Reported By</dt>
                <dd>{report.studentName}</dd>
              </div>
              <div>
                <dt>Description</dt>
                <dd>{report.description}</dd>
              </div>
            </dl>
            {report.photoUrl && (
              <img src={report.photoUrl} alt="Complaint" className="detail-photo" />
            )}
          </section>

          <section className="card">
            <h3>Timeline</h3>
            <ReportTimeline reportId={report.id} />
            {canWork && report.status === "in_progress" && (
              <div className="update-composer">
                <textarea
                  placeholder="Add a progress update visible to the student..."
                  value={progressMessage}
                  onChange={(e) => setProgressMessage(e.target.value)}
                  rows={2}
                />
                <button
                  className="btn btn--primary btn--sm"
                  disabled={busy || !progressMessage.trim()}
                  onClick={handleAddProgress}
                >
                  Post Update
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="detail-grid__side">
          <section className="card">
            <h3>Actions</h3>
            <div className="stacked-buttons">
              {report.status === "assigned" && (
                <>
                  <button className="btn btn--secondary btn--block" disabled={busy} onClick={handleAccept}>
                    Accept Assignment
                  </button>
                  <button className="btn btn--primary btn--block" disabled={busy} onClick={handleStartWork}>
                    Start Work
                  </button>
                </>
              )}
              {report.status === "in_progress" && (
                <button
                  className="btn btn--primary btn--block"
                  disabled={busy}
                  onClick={() => setShowComplete(true)}
                >
                  Mark as Completed
                </button>
              )}
              {!canWork && (
                <p className="muted">
                  This complaint is {report.status} — no further action needed.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {showComplete && (
        <div className="modal-overlay" onClick={() => setShowComplete(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Mark as Completed</h3>
            <div className="stacked-form">
              <label className="field">
                <span>Work Summary *</span>
                <input
                  required
                  value={workSummary}
                  onChange={(e) => setWorkSummary(e.target.value)}
                  placeholder="e.g. Replaced faulty valve"
                />
              </label>
              <label className="field">
                <span>Resolution Description *</span>
                <textarea
                  required
                  rows={3}
                  value={resolutionDescription}
                  onChange={(e) => setResolutionDescription(e.target.value)}
                  placeholder="Describe what was done to resolve the issue..."
                />
              </label>
              <label className="field">
                <span>Completion Photo (Optional)</span>
                {isMediaUploadEnabled() ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCompletionPhoto(e.target.files?.[0] ?? null)}
                  />
                ) : (
                  <p className="muted" style={{ fontSize: "0.85rem" }}>
                    Photo upload is currently unavailable, but you can still
                    mark this complaint as completed without one.
                  </p>
                )}
              </label>
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowComplete(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={busy}
                  onClick={handleMarkCompleted}
                >
                  {busy ? "Submitting..." : "Mark as Completed"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
