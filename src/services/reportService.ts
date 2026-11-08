import {
  addDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { typedCollection, typedDoc, typedSubcollection } from "../firebase/firestore";
import { toAppError } from "../utils/errors";
import { createNotification } from "./notificationService";
import { isMediaUploadEnabled, uploadImage } from "./mediaService";
import type {
  Report,
  ReportPriority,
  ReportStatus,
  ReportUpdate,
  UserRole,
} from "../types/models";

const REPORTS = "reports";
const UPDATES = "updates";

export interface ReportFilters {
  towerId?: string;
  departmentId?: string;
  assignedTeamId?: string;
  status?: ReportStatus;
  priority?: ReportPriority;
  studentId?: string;
}

function reportUpdatesRef(reportId: string) {
  return typedSubcollection<ReportUpdate>(REPORTS, reportId, UPDATES);
}


/**
 * Advisory duplicate check: only checks the student's active reports for the
 * same tower, room and department. It warns but never blocks submission.
 */
export async function findPotentialDuplicateReports(input: {
  studentId: string; towerId: string; roomNumber: string;
  departmentId: string; title: string; description: string;
}): Promise<Report[]> {
  try {
    const q = query(typedCollection<Report>(REPORTS), where("studentId", "==", input.studentId));
    const snapshot = await getDocs(q);
    const active: ReportStatus[] = ["submitted", "assigned", "in_progress"];
    const words = [...new Set(`${input.title} ${input.description}`.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3))];
    return snapshot.docs.map(d => d.data()).filter(r => {
      if (!active.includes(r.status) || r.towerId !== input.towerId ||
          r.roomNumber.trim().toLowerCase() !== input.roomNumber.trim().toLowerCase() ||
          r.departmentId !== input.departmentId) return false;
      const existing = `${r.title} ${r.description}`.toLowerCase();
      const overlap = words.filter(w => existing.includes(w)).length;
      return words.length > 0 && overlap >= Math.min(2, words.length);
    }).slice(0, 3);
  } catch (error) {
    console.warn("Duplicate check unavailable; allowing complaint submission.", error);
    return [];
  }
}

export interface ReopenRequest {
  id: string;
  message: string;
  status: "pending" | "approved" | "declined";
  requestedBy: string;
  requestedAt?: import("firebase/firestore").Timestamp;
  reviewedBy?: string;
  reviewedAt?: import("firebase/firestore").Timestamp;
}

export async function requestReportReopen(report: Report, studentId: string, message: string): Promise<void> {
  if (report.studentId !== studentId) throw new Error("You can only request reopening your own complaint.");
  if (!["closed", "rejected"].includes(report.status)) throw new Error("Only closed or rejected complaints can be reopened.");
  const requests = typedSubcollection<ReopenRequest>(REPORTS, report.id, "reopenRequests");
  const existing = await getDocs(query(requests, where("status", "==", "pending")));
  if (!existing.empty) throw new Error("A reopening request is already pending.");
  await addDoc(requests, {
    id: "",
    message: message.trim(),
    status: "pending",
    requestedBy: studentId,
    requestedAt: serverTimestamp() as unknown as ReopenRequest["requestedAt"],
  });
}

export async function listReopenRequests(reportId: string): Promise<ReopenRequest[]> {
  const snapshot = await getDocs(typedSubcollection<ReopenRequest>(REPORTS, reportId, "reopenRequests"));
  return snapshot.docs.map(d => d.data()).filter(r => r.status === "pending");
}

export async function reviewReopenRequest(
  report: Report, requestId: string, decision: "approved" | "declined",
  actor: { id: string; name: string; role: UserRole }
): Promise<void> {
  const requestRef = doc(typedSubcollection<ReopenRequest>(REPORTS, report.id, "reopenRequests"), requestId);
  const batch = writeBatch(db);
  batch.update(requestRef, { status: decision, reviewedBy: actor.id, reviewedAt: serverTimestamp() });
  if (decision === "approved") {
    batch.update(doc(db, REPORTS, report.id), { status: "submitted", updatedAt: serverTimestamp() });
    const updateRef = doc(reportUpdatesRef(report.id));
    batch.set(updateRef, {
      id: updateRef.id, message: "Complaint reopened after student request",
      statusAtUpdate: "submitted", authorId: actor.id, authorName: actor.name,
      authorRole: actor.role, createdAt: serverTimestamp(),
    });
  }
  await batch.commit();
  await createNotification({
    userId: report.studentId, type: "report_updated",
    title: decision === "approved" ? "Complaint reopened" : "Reopening request declined",
    message: decision === "approved"
      ? `Your complaint "${report.title}" has been reopened for review.`
      : `Your request to reopen "${report.title}" was declined.`,
    reportId: report.id,
  });
}

// ============================================================
// Submission (student)
// ============================================================

export async function submitReport(input: {
  studentId: string;
  studentName: string;
  studentRoomNumber: string;
  towerId: string;
  towerName: string;
  roomNumber: string;
  departmentId: string;
  departmentName: string;
  title: string;
  description: string;
  priority: ReportPriority;
  photoFile?: File | null;
}): Promise<string> {
  try {
    // Photo upload is best-effort and NEVER blocks submission. If Storage is
    // disabled (v1 default) or the upload fails for any reason, we simply
    // submit without a photo.
    let photoUrl: string | null = null;
    if (input.photoFile && isMediaUploadEnabled()) {
      try {
        const path = `reports/${input.studentId}/${Date.now()}-${input.photoFile.name}`;
        const result = await uploadImage(input.photoFile, path);
        photoUrl = result.url;
      } catch {
        photoUrl = null;
      }
    }

    const ref = await addDoc(typedCollection<Report>(REPORTS), {
      id: "",
      studentId: input.studentId,
      studentName: input.studentName,
      studentRoomNumber: input.studentRoomNumber,
      towerId: input.towerId,
      towerName: input.towerName,
      roomNumber: input.roomNumber.trim(),
      departmentId: input.departmentId,
      departmentName: input.departmentName,
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority,
      status: "submitted",
      photoUrl,
      assignedTeamId: null,
      assignedTeamName: null,
      assignedWorkerId: null,
      assignedWorkerName: null,
      resolution: null,
      review: null,
      createdAt: serverTimestamp() as unknown as Report["createdAt"],
      updatedAt: serverTimestamp() as unknown as Report["updatedAt"],
    });

    await createNotification({
      userId: input.studentId,
      type: "report_submitted",
      title: "Complaint submitted",
      message: `Your complaint "${input.title.trim()}" has been submitted and is awaiting review.`,
      reportId: ref.id,
    });

    return ref.id;
  } catch (error) {
    throw toAppError(
      error,
      "Your complaint could not be submitted. Please try again."
    );
  }
}

// ============================================================
// Reads
// ============================================================

export async function getReport(reportId: string): Promise<Report | null> {
  try {
    const snapshot = await getDoc(typedDoc<Report>(REPORTS, reportId));
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    throw toAppError(error, "Unable to load complaint.");
  }
}

export function subscribeToReport(
  reportId: string,
  onChange: (report: Report | null) => void,
  onError: (error: unknown) => void
): () => void {
  return onSnapshot(
    typedDoc<Report>(REPORTS, reportId),
    (snapshot) => onChange(snapshot.exists() ? snapshot.data() : null),
    onError
  );
}

export function subscribeToStudentReports(
  studentId: string,
  onChange: (reports: Report[]) => void,
  onError: (error: unknown) => void
): () => void {
  // Query by the owner field only. Sorting client-side avoids requiring a
  // composite Firestore index for studentId + createdAt.
  const q = query(typedCollection<Report>(REPORTS), where("studentId", "==", studentId));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => d.data())),
    onError
  );
}

export function subscribeToWorkerReports(
  workerId: string,
  teamId: string | null,
  onChange: (reports: Report[]) => void,
  onError: (error: unknown) => void
): () => void {
  // A worker sees complaints assigned directly to them. Complaints assigned
  // only to their team (not yet to a specific worker) are fetched
  // separately and merged client-side, since Firestore cannot OR two
  // different fields in one query without duplicating listeners.
  // Query only by assignment. Sort after merging so this works without a
  // composite assignedWorkerId + createdAt index.
  const directQuery = query(
    typedCollection<Report>(REPORTS),
    where("assignedWorkerId", "==", workerId)
  );

  let teamReports: Report[] = [];
  let directReports: Report[] = [];
  const emit = () => {
    const merged = new Map<string, Report>();
    [...teamReports, ...directReports].forEach((r) => merged.set(r.id, r));
    onChange(
      Array.from(merged.values()).sort(
        (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
      )
    );
  };

  const unsubDirect = onSnapshot(
    directQuery,
    (snapshot) => {
      directReports = snapshot.docs.map((d) => d.data());
      emit();
    },
    onError
  );

  let unsubTeam = () => {};
  if (teamId) {
    const teamQuery = query(
      typedCollection<Report>(REPORTS),
      where("assignedTeamId", "==", teamId)
    );
    unsubTeam = onSnapshot(
      teamQuery,
      (snapshot) => {
        teamReports = snapshot.docs.map((d) => d.data());
        emit();
      },
      onError
    );
  }

  return () => {
    unsubDirect();
    unsubTeam();
  };
}

export async function listAllReports(filters: ReportFilters = {}): Promise<Report[]> {
  try {
    // Admins can read all reports. Fetch the collection without compound
    // filters/orderBy, then apply filters and sorting in the app. This avoids
    // requiring a new composite index for every filter combination.
    const snapshot = await getDocs(typedCollection<Report>(REPORTS));
    return snapshot.docs
      .map((d) => ({ ...d.data(), id: d.id }))
      .filter((report) =>
        (!filters.towerId || report.towerId === filters.towerId) &&
        (!filters.departmentId || report.departmentId === filters.departmentId) &&
        (!filters.assignedTeamId || report.assignedTeamId === filters.assignedTeamId) &&
        (!filters.status || report.status === filters.status) &&
        (!filters.priority || report.priority === filters.priority) &&
        (!filters.studentId || report.studentId === filters.studentId)
      )
      .sort((a, b) =>
        (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
      );
  } catch (error) {
    throw toAppError(
      error,
      "Unable to load complaints. If you just added a new filter combination, Firestore may need a composite index — check the browser console for a direct link to create it."
    );
  }
}

export function subscribeToAllReports(
  onChange: (reports: Report[]) => void,
  onError: (error: unknown) => void
): () => void {
  const q = query(typedCollection<Report>(REPORTS));
  return onSnapshot(
    q,
    (snapshot) =>
      onChange(
        snapshot.docs
          .map((d) => ({ ...d.data(), id: d.id }))
          .sort((a, b) =>
            (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
          )
      ),
    onError
  );
}

export function subscribeToReportUpdates(
  reportId: string,
  onChange: (updates: ReportUpdate[]) => void,
  onError: (error: unknown) => void
): () => void {
  return onSnapshot(
    reportUpdatesRef(reportId),
    (snapshot) =>
      onChange(
        snapshot.docs
          .map((d) => d.data())
          .sort(
            (a, b) =>
              (a.createdAt?.toMillis?.() ?? 0) -
              (b.createdAt?.toMillis?.() ?? 0)
          )
      ),
    onError
  );
}

// ============================================================
// Internal helper: write a timeline entry + bump updatedAt atomically
// ============================================================

async function appendTimelineEntry(
  reportId: string,
  entry: {
    message: string;
    statusAtUpdate: ReportStatus;
    authorId: string;
    authorName: string;
    authorRole: UserRole;
  },
  extraReportFields: Record<string, unknown> = {}
): Promise<void> {
  const batch = writeBatch(db);
  const updateRef = doc(reportUpdatesRef(reportId));
  batch.set(updateRef, {
    id: updateRef.id,
    message: entry.message,
    statusAtUpdate: entry.statusAtUpdate,
    authorId: entry.authorId,
    authorName: entry.authorName,
    authorRole: entry.authorRole,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, REPORTS, reportId), {
    ...extraReportFields,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

// ============================================================
// Admin actions
// ============================================================

export async function assignReportDepartment(
  report: Report,
  departmentId: string,
  departmentName: string,
  actor: { id: string; name: string; role: UserRole }
): Promise<void> {
  try {
    await appendTimelineEntry(
      report.id,
      {
        message: `Assigned to department: ${departmentName}`,
        statusAtUpdate: report.status,
        authorId: actor.id,
        authorName: actor.name,
        authorRole: actor.role,
      },
      { departmentId, departmentName }
    );
  } catch (error) {
    throw toAppError(error, "Unable to assign department.");
  }
}

export async function assignReportTeamAndWorker(
  report: Report,
  assignment: {
    teamId: string | null;
    teamName: string | null;
    workerId: string | null;
    workerName: string | null;
  },
  actor: { id: string; name: string; role: UserRole }
): Promise<void> {
  try {
    const nextStatus: ReportStatus =
      report.status === "submitted" ? "assigned" : report.status;

    // Save the assignment on the parent report first. This is the critical
    // operation used by the worker portal. Keeping it separate from the
    // optional timeline entry means a timeline-rule/network problem cannot
    // prevent the worker from receiving the assignment.
    await updateDoc(doc(db, REPORTS, report.id), {
      assignedTeamId: assignment.teamId,
      assignedTeamName: assignment.teamName,
      assignedWorkerId: assignment.workerId,
      assignedWorkerName: assignment.workerName,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });


    try {
      const timelineRef = doc(reportUpdatesRef(report.id));
      const timelineBatch = writeBatch(db);
      timelineBatch.set(timelineRef, {
        id: timelineRef.id,
        message: assignment.workerId
          ? `Assigned to ${assignment.workerName} (${assignment.teamName ?? "no team"})`
          : `Assigned to team: ${assignment.teamName}`,
        statusAtUpdate: nextStatus,
        authorId: actor.id,
        authorName: actor.name,
        authorRole: actor.role,
        createdAt: serverTimestamp(),
      });
      await timelineBatch.commit();
    } catch (timelineError) {
      // The assignment has already been saved. Keep the main workflow
      // successful and report the timeline problem in the browser console.
      console.error("Assignment saved, but timeline entry failed:", timelineError);
    }

    await createNotification({
      userId: report.studentId,
      type: "report_assigned",
      title: "Complaint assigned",
      message: `Your complaint "${report.title}" has been assigned to ${
        assignment.teamName ?? "our team"
      }.`,
      reportId: report.id,
    });

    if (assignment.workerId) {
      await createNotification({
        userId: assignment.workerId,
        type: "report_assigned",
        title: "New assignment",
        message: `You've been assigned a new complaint: "${report.title}".`,
        reportId: report.id,
      });
    }
  } catch (error) {
    throw toAppError(error, "Unable to assign complaint.");
  }
}

export async function changeReportPriority(
  report: Report,
  priority: ReportPriority,
  actor: { id: string; name: string; role: UserRole }
): Promise<void> {
  try {
    await appendTimelineEntry(
      report.id,
      {
        message: `Priority changed to ${priority}`,
        statusAtUpdate: report.status,
        authorId: actor.id,
        authorName: actor.name,
        authorRole: actor.role,
      },
      { priority }
    );

    if (report.assignedWorkerId) {
      await createNotification({
        userId: report.assignedWorkerId,
        type: "priority_changed",
        title: "Priority updated",
        message: `Priority for "${report.title}" is now ${priority}.`,
        reportId: report.id,
      });
    }
  } catch (error) {
    throw toAppError(error, "Unable to change priority.");
  }
}

export async function rejectReport(
  report: Report,
  reason: string,
  actor: { id: string; name: string; role: UserRole }
): Promise<void> {
  try {
    await appendTimelineEntry(
      report.id,
      {
        message: `Complaint rejected: ${reason}`,
        statusAtUpdate: "rejected",
        authorId: actor.id,
        authorName: actor.name,
        authorRole: actor.role,
      },
      { status: "rejected" }
    );
    await createNotification({
      userId: report.studentId,
      type: "admin_update",
      title: "Complaint rejected",
      message: `Your complaint "${report.title}" was rejected: ${reason}`,
      reportId: report.id,
    });
  } catch (error) {
    throw toAppError(error, "Unable to reject complaint.");
  }
}

export async function closeReport(
  report: Report,
  actor: { id: string; name: string; role: UserRole }
): Promise<void> {
  try {
    // Persist the actual workflow state first. This is the critical operation
    // for the student/admin portals. Timeline + notification are secondary
    // and must never prevent a successful close.
    await updateDoc(doc(db, REPORTS, report.id), {
      status: "closed",
      updatedAt: serverTimestamp(),
    });

    try {
      const updateRef = doc(reportUpdatesRef(report.id));
      await writeBatch(db).set(updateRef, {
        id: updateRef.id,
        message: "Complaint closed",
        statusAtUpdate: "closed",
        authorId: actor.id,
        authorName: actor.name,
        authorRole: actor.role,
        createdAt: serverTimestamp(),
      }).commit();
    } catch (timelineError) {
      console.error("Complaint closed, but timeline entry failed:", timelineError);
    }

    await createNotification({
      userId: report.studentId,
      type: "report_closed",
      title: "Complaint resolved",
      message: `Your complaint "${report.title}" has been resolved and closed.`,
      reportId: report.id,
    });
  } catch (error) {
    throw toAppError(error, "Unable to close complaint.");
  }
}

export async function addAdminUpdate(
  report: Report,
  message: string,
  actor: { id: string; name: string; role: UserRole }
): Promise<void> {
  try {
    await appendTimelineEntry(report.id, {
      message,
      statusAtUpdate: report.status,
      authorId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
    });
    await createNotification({
      userId: report.studentId,
      type: "admin_update",
      title: "Update on your complaint",
      message,
      reportId: report.id,
    });
  } catch (error) {
    throw toAppError(error, "Unable to add update.");
  }
}

// ============================================================
// Worker actions
// ============================================================

export async function acceptAssignment(
  report: Report,
  actor: { id: string; name: string; role: UserRole }
): Promise<void> {
  try {
    await appendTimelineEntry(report.id, {
      message: `${actor.name} accepted the assignment`,
      statusAtUpdate: report.status,
      authorId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
    });
  } catch (error) {
    throw toAppError(error, "Unable to accept assignment.");
  }
}

export async function startWork(
  report: Report,
  actor: { id: string; name: string; role: UserRole }
): Promise<void> {
  try {
    await appendTimelineEntry(
      report.id,
      {
        message: `${actor.name} started work on this complaint`,
        statusAtUpdate: "in_progress",
        authorId: actor.id,
        authorName: actor.name,
        authorRole: actor.role,
      },
      { status: "in_progress" }
    );
    await createNotification({
      userId: report.studentId,
      type: "work_started",
      title: "Work started",
      message: `Work has started on your complaint "${report.title}".`,
      reportId: report.id,
    });
  } catch (error) {
    throw toAppError(error, "Unable to update status.");
  }
}

export async function addProgressUpdate(
  report: Report,
  message: string,
  actor: { id: string; name: string; role: UserRole }
): Promise<void> {
  try {
    await appendTimelineEntry(report.id, {
      message,
      statusAtUpdate: report.status,
      authorId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
    });
    await createNotification({
      userId: report.studentId,
      type: "report_updated",
      title: "Progress update",
      message,
      reportId: report.id,
    });
  } catch (error) {
    throw toAppError(error, "Unable to add progress update.");
  }
}

export async function markCompleted(
  report: Report,
  input: {
    workSummary: string;
    resolutionDescription: string;
    photoFile?: File | null;
    completedBy: string;
    completedByName: string;
    checklist?: string[];
  }
): Promise<void> {
  try {
    // As with submission, a completion photo is optional and its absence or
    // upload failure must never block marking the work as completed.
    let photoUrl: string | null = null;
    if (input.photoFile && isMediaUploadEnabled()) {
      try {
        const path = `reports/${report.id}/completion-${Date.now()}-${input.photoFile.name}`;
        const result = await uploadImage(input.photoFile, path);
        photoUrl = result.url;
      } catch {
        photoUrl = null;
      }
    }

    const batch = writeBatch(db);
    const updateRef = doc(reportUpdatesRef(report.id));
    batch.set(updateRef, {
      id: updateRef.id,
      message: `Work completed: ${input.workSummary}`,
      statusAtUpdate: "completed",
      authorId: input.completedBy,
      authorName: input.completedByName,
      authorRole: "operations",
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, REPORTS, report.id), {
      status: "completed",
      resolution: {
        workSummary: input.workSummary.trim(),
        resolutionDescription: input.resolutionDescription.trim(),
        photoUrl,
        completedBy: input.completedBy,
        completedByName: input.completedByName,
        completedAt: serverTimestamp(),
        checklist: input.checklist ?? [],
      },
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    await createNotification({
      userId: report.studentId,
      type: "report_completed",
      title: "Complaint resolved",
      message: `Your complaint "${report.title}" has been marked as completed. Please review the resolution.`,
      reportId: report.id,
    });
  } catch (error) {
    throw toAppError(error, "Unable to mark complaint as completed.");
  }
}

// ============================================================
// Student review
// ============================================================

export async function submitReview(
  report: Report,
  input: { rating: number; feedback?: string; reviewedBy: string }
): Promise<void> {
  if (input.rating < 1 || input.rating > 5) {
    throw toAppError(new Error("invalid rating"), "Rating must be between 1 and 5.");
  }
  try {
    await updateDoc(doc(db, REPORTS, report.id), {
      review: {
        rating: input.rating,
        feedback: input.feedback?.trim() || "",
        reviewedBy: input.reviewedBy,
        reviewedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toAppError(error, "Unable to submit your review. Please try again.");
  }
}
