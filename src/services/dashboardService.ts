import { getCountFromServer, limit, orderBy, query, where, getDocs } from "firebase/firestore";
import { typedCollection } from "../firebase/firestore";
import { toAppError } from "../utils/errors";
import type { Report, Tower, UserProfile, WorkerTeam } from "../types/models";
import { syncPublicSnapshot } from "./publicService";

export interface AdminDashboardCounts {
  totalStudents: number;
  totalWorkers: number;
  totalTeams: number;
  totalTowers: number;
  openComplaints: number;
  assignedComplaints: number;
  inProgressComplaints: number;
  completedComplaints: number;
  closedComplaints: number;
}

async function count(
  collectionPath: string,
  ...conditions: Parameters<typeof where>[]
) {
  const base = typedCollection<{ id: string }>(collectionPath);
  const q =
    conditions.length > 0
      ? query(base, ...conditions.map((c) => where(...c)))
      : base;
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

export async function getAdminDashboardCounts(): Promise<AdminDashboardCounts> {
  try {
    const [
      totalStudents,
      totalWorkers,
      totalTeams,
      totalTowers,
      openComplaints,
      assignedComplaints,
      inProgressComplaints,
      completedComplaints,
      closedComplaints,
    ] = await Promise.all([
      count("users", ["role", "==", "student"]),
      count("users", ["role", "==", "operations"]),
      count("workerTeams", ["isActive", "==", true]),
      count("towers", ["isActive", "==", true]),
      count("reports", ["status", "==", "submitted"]),
      count("reports", ["status", "==", "assigned"]),
      count("reports", ["status", "==", "in_progress"]),
      count("reports", ["status", "==", "completed"]),
      count("reports", ["status", "==", "closed"]),
    ]);

    return {
      totalStudents,
      totalWorkers,
      totalTeams,
      totalTowers,
      openComplaints,
      assignedComplaints,
      inProgressComplaints,
      completedComplaints,
      closedComplaints,
    };
  } catch (error) {
    throw toAppError(error, "Unable to load dashboard statistics.");
  }
}

// Re-exported so dashboard widgets can type their props without reaching
// into ../types/models directly.
export type { Report, Tower, UserProfile, WorkerTeam };


export async function syncCampusPublicSnapshot(counts: AdminDashboardCounts) {
  const reportsSnapshot = await getDocs(
    query(typedCollection<Report>("reports"), orderBy("updatedAt", "desc"), limit(8)),
  );
  await syncPublicSnapshot(
    {
      totalComplaints: counts.openComplaints + counts.assignedComplaints + counts.inProgressComplaints + counts.completedComplaints + counts.closedComplaints,
      activeComplaints: counts.openComplaints + counts.assignedComplaints + counts.inProgressComplaints,
      assignedComplaints: counts.assignedComplaints,
      inProgressComplaints: counts.inProgressComplaints,
      completedComplaints: counts.completedComplaints,
      closedComplaints: counts.closedComplaints,
      totalWorkers: counts.totalWorkers,
      totalTeams: counts.totalTeams,
      totalTowers: counts.totalTowers,
      resolutionRate: Math.round(((counts.completedComplaints + counts.closedComplaints) / Math.max(1, counts.openComplaints + counts.assignedComplaints + counts.inProgressComplaints + counts.completedComplaints + counts.closedComplaints)) * 100),
    },
    reportsSnapshot.docs.map((snapshot) => {
      const report = snapshot.data();
      return { id: snapshot.id, towerName: report.towerName, departmentName: report.departmentName, status: report.status, updatedAt: report.updatedAt };
    }),
  );
}
