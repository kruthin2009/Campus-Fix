import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  addAdminUpdate,
  assignReportDepartment,
  assignReportTeamAndWorker,
  changeReportPriority,
  closeReport,
  rejectReport,
  subscribeToReport,
} from "../../services/reportService";
import { listActiveDepartments } from "../../services/departmentService";
import { listActiveTeams } from "../../services/teamService";
import {
  ErrorState,
  LoadingScreen,
  PriorityBadge,
  StatusBadge,
  StarDisplay,
  useConfirm,
} from "../../components/common/Common";
import { ReportTimeline } from "../../components/common/ReportTimeline";
import type {
  Department,
  Report,
  ReportPriority,
  WorkerTeam,
} from "../../types/models";

const PRIORITIES: ReportPriority[] = ["low", "medium", "high", "urgent"];

export function AdminComplaintDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirm();
  const navigate = useNavigate();

  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<WorkerTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!reportId) return;
    const unsubscribe = subscribeToReport(
      reportId,
      (r) => {
        setReport(r);
        if (r?.assignedTeamId) setSelectedTeamId(r.assignedTeamId);
        if (r?.assignedWorkerId) setSelectedWorkerId(r.assignedWorkerId);
      },
      (err) =>
        setError(err instanceof Error ? err.message : "Unable to load complaint.")
    );
    return unsubscribe;
  }, [reportId]);

  useEffect(() => {
    let cancelled = false;

    async function loadAssignmentOptions() {
      const [departmentsResult, teamsResult] = await Promise.allSettled([
        listActiveDepartments(),
        listActiveTeams(),
      ]);

      if (cancelled) return;

      const errors: string[] = [];
      if (departmentsResult.status === "fulfilled") {
        setDepartments(departmentsResult.value);
      } else {
        setDepartments([]);
        errors.push(
          departmentsResult.reason instanceof Error
            ? departmentsResult.reason.message
            : "Unable to load departments."
        );
      }

      if (teamsResult.status === "fulfilled") {
        setTeams(teamsResult.value);
      } else {
        setTeams([]);
        errors.push(
          teamsResult.reason instanceof Error
            ? teamsResult.reason.message
            : "Unable to load teams."
        );
      }

      if (errors.length > 0) setError(errors.join(" "));
    }

    loadAssignmentOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorState message={error} />;
  if (report === undefined) return <LoadingScreen label="Loading complaint..." />;
  if (report === null) {
    return <ErrorState message="This complaint could not be found." />;
  }
  if (!profile) return null;

  const actor = { id: profile.uid, name: profile.name, role: profile.role };
  // Only show active teams belonging to the complaint's current department.
  // This prevents assigning a Wi-Fi complaint to a Plumbing/Electrical team.
  const departmentTeams = teams.filter(
    (team) => team.departmentId === report.departmentId && team.isActive !== false
  );
  const selectedTeam = departmentTeams.find((t) => t.id === selectedTeamId);
  const teamWorkerOptions =
    (selectedTeam?.workerIds ?? []).map((id, i) => ({
      id,
      name: selectedTeam?.workerNames?.[i] ?? "Worker",
    }));

  async function handleAssignDepartment(departmentId: string) {
    const dept = departments.find((d) => d.id === departmentId);
    if (!dept || !report) return;
    setBusy(true);
    try {
      await assignReportDepartment(report, dept.id, dept.name, actor);
      // A department change invalidates the previously selected team/worker.
      setSelectedTeamId("");
      setSelectedWorkerId("");
      showToast("Department updated. Please select the correct team.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to update.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleAssignTeamWorker() {
    if (!report) return;
    if (!selectedTeamId) {
      showToast("Please select a team before assigning this complaint.", "error");
      return;
    }
    const team = departmentTeams.find((t) => t.id === selectedTeamId) ?? null;
    if (!team) {
      showToast("The selected team is not available for this department.", "error");
      return;
    }
    const worker = teamWorkerOptions.find((w) => w.id === selectedWorkerId) ?? null;
    setBusy(true);
    try {
      await assignReportTeamAndWorker(
        report,
        {
          teamId: team?.id ?? null,
          teamName: team?.name ?? null,
          workerId: worker?.id ?? null,
          workerName: worker?.name ?? null,
        },
        actor
      );
      showToast("Assignment updated.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to assign.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handlePriorityChange(priority: ReportPriority) {
    if (!report) return;
    setBusy(true);
    try {
      await changeReportPriority(report, priority, actor);
      showToast("Priority updated.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to update.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddUpdate() {
    if (!report || !updateMessage.trim()) return;
    setBusy(true);
    try {
      await addAdminUpdate(report, updateMessage.trim(), actor);
      setUpdateMessage("");
      showToast("Update posted.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to post update.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleClose() {
    if (!report) return;
    const ok = await confirm({
      title: "Close Complaint",
      message: "Mark this complaint as closed? The student will be notified.",
      confirmLabel: "Close Complaint",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await closeReport(report, actor);
      showToast("Complaint closed.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to close.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!report || !rejectReason.trim()) {
      showToast("Please provide a reason for rejection.", "error");
      return;
    }
    setBusy(true);
    try {
      await rejectReport(report, rejectReason.trim(), actor);
      showToast("Complaint rejected.", "success");
      setShowReject(false);
      setRejectReason("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to reject.", "error");
    } finally {
      setBusy(false);
    }
  }

  const canModify = report.status !== "closed" && report.status !== "rejected";

  return (
    <div>
      <button className="link-button" onClick={() => navigate(-1)}>
        ← Back to Complaints
      </button>

      <div className="page-header page-header--row">
        <div>
          <h1>{report.title}</h1>
          <p className="muted">
            Complaint ID: {report.id} • Submitted{" "}
            {report.createdAt?.toDate
              ? report.createdAt.toDate().toLocaleString()
              : ""}
          </p>
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
                <dt>Student</dt>
                <dd>{report.studentName}</dd>
              </div>
              <div>
                <dt>Tower / Room</dt>
                <dd>
                  {report.towerName} / {report.roomNumber}
                </dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{report.departmentName}</dd>
              </div>
              <div>
                <dt>Description</dt>
                <dd>{report.description}</dd>
              </div>
            </dl>
            {report.photoUrl && (
              <img
                src={report.photoUrl}
                alt="Complaint"
                className="detail-photo"
              />
            )}
          </section>

          {report.resolution && (
            <section className="card">
              <h3>Resolution</h3>
              <dl className="detail-list">
                <div>
                  <dt>Work Summary</dt>
                  <dd>{report.resolution.workSummary}</dd>
                </div>
                <div>
                  <dt>Resolution Description</dt>
                  <dd>{report.resolution.resolutionDescription}</dd>
                </div>
                <div>
                  <dt>Completed By</dt>
                  <dd>{report.resolution.completedByName}</dd>
                </div>
              </dl>
              {report.resolution.photoUrl && (
                <img
                  src={report.resolution.photoUrl}
                  alt="Completion"
                  className="detail-photo"
                />
              )}
            </section>
          )}

          {report.review && (
            <section className="card">
              <h3>Student Review</h3>
              <StarDisplay rating={report.review.rating} />
              {report.review.feedback && <p>{report.review.feedback}</p>}
            </section>
          )}

          <section className="card">
            <h3>Timeline</h3>
            <ReportTimeline reportId={report.id} />
            {canModify && (
              <div className="update-composer">
                <textarea
                  placeholder="Post an update visible to the student..."
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  rows={2}
                />
                <button
                  className="btn btn--primary btn--sm"
                  disabled={busy || !updateMessage.trim()}
                  onClick={handleAddUpdate}
                >
                  Post Update
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="detail-grid__side">
          <section className="card">
            <h3>Assignment</h3>
            <label className="field">
              <span>Department</span>
              <select
                value={report.departmentId}
                disabled={busy || !canModify}
                onChange={(e) => handleAssignDepartment(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Team</span>
              <select
                value={selectedTeamId}
                disabled={busy || !canModify}
                onChange={(e) => {
                  setSelectedTeamId(e.target.value);
                  setSelectedWorkerId("");
                }}
              >
                <option value="">Select a team...</option>
                {departmentTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {departmentTeams.length === 0 && (
                <small className="muted">
                  No active team is available for this department. Create or activate a team first.
                </small>
              )}
            </label>
            <label className="field">
              <span>Worker</span>
              <select
                value={selectedWorkerId}
                disabled={busy || !canModify || !selectedTeamId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
              >
                <option value="">Unassigned (whole team)</option>
                {teamWorkerOptions.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="btn btn--primary btn--block"
              disabled={busy || !canModify || !selectedTeamId || departmentTeams.length === 0}
              onClick={handleAssignTeamWorker}
            >
              Save Assignment
            </button>
            {selectedTeamId && (
              <p className="muted" style={{ marginTop: 8 }}>
                {selectedWorkerId
                  ? "The complaint will be assigned to the selected team and worker."
                  : "The complaint will be assigned to the whole team."}
              </p>
            )}
          </section>

          <section className="card">
            <h3>Priority</h3>
            <div className="priority-buttons">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  className={`priority-button priority-button--${p} ${
                    report.priority === p ? "is-active" : ""
                  }`}
                  disabled={busy || !canModify}
                  onClick={() => handlePriorityChange(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <h3>Actions</h3>
            <div className="stacked-buttons">
              {report.status === "completed" && (
                <button
                  className="btn btn--primary btn--block"
                  disabled={busy}
                  onClick={handleClose}
                >
                  Close Complaint
                </button>
              )}
              {canModify && report.status === "submitted" && (
                <button
                  className="btn btn--danger btn--block"
                  disabled={busy}
                  onClick={() => setShowReject(true)}
                >
                  Reject Complaint
                </button>
              )}
              {!canModify && (
                <p className="muted">
                  This complaint is {report.status} and can no longer be
                  modified.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {showReject && (
        <div className="modal-overlay" onClick={() => setShowReject(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Complaint</h3>
            <label className="field">
              <span>Reason *</span>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Explain why this complaint is being rejected..."
              />
            </label>
            <div className="modal__actions">
              <button className="btn btn--secondary" onClick={() => setShowReject(false)}>
                Cancel
              </button>
              <button className="btn btn--danger" disabled={busy} onClick={handleReject}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog}
    </div>
  );
}
