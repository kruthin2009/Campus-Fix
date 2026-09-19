import type { Timestamp } from "firebase/firestore";

// ============================================================
// Shared enums
// ============================================================

export type UserRole = "admin" | "operations" | "student";

export type ReportStatus =
  | "submitted"
  | "assigned"
  | "in_progress"
  | "completed"
  | "closed"
  | "rejected";

export type ReportPriority = "low" | "medium" | "high" | "urgent";

export type WorkerType =
  | "Plumber"
  | "Electrician"
  | "WiFi Technician"
  | "Carpenter"
  | "Cleaner"
  | "Maintenance"
  | "Other";

// ============================================================
// users/{uid}
// ============================================================

export interface BaseUserProfile {
  // Mirrors `uid` (the Firestore document id). Kept in sync automatically
  // by the generic Firestore converter — never set this by hand.
  id: string;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StudentProfile extends BaseUserProfile {
  role: "student";
  studentId: string;
  rollNumber: string;
  roomNumber: string;
  className: string;
  semester: string;
}

export interface WorkerProfile extends BaseUserProfile {
  role: "operations";
  workerId: string;
  workerType: WorkerType;
  teamId: string | null;
  teamName: string | null;
}

export interface AdminProfile extends BaseUserProfile {
  role: "admin";
}

export type UserProfile = StudentProfile | WorkerProfile | AdminProfile;

// ============================================================
// towers/{towerId}
// ============================================================

export interface Tower {
  id: string;
  name: string;
  number: number;
  description?: string;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================
// departments/{departmentId}
// ============================================================

export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================
// workerTeams/{teamId}
// ============================================================

export interface WorkerTeam {
  id: string;
  teamId: string;
  name: string;
  departmentId: string;
  departmentName: string;
  workerIds: string[];
  workerNames: string[];
  leaderId: string | null;
  leaderName: string | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================
// reports/{reportId}  (a "complaint")
// ============================================================

export interface Report {
  id: string;
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
  status: ReportStatus;

  photoUrl?: string | null;

  assignedTeamId?: string | null;
  assignedTeamName?: string | null;
  assignedWorkerId?: string | null;
  assignedWorkerName?: string | null;

  resolution?: {
    workSummary: string;
    resolutionDescription: string;
    photoUrl?: string | null;
    completedBy: string;
    completedByName: string;
    completedAt: Timestamp;
  } | null;

  review?: {
    rating: number; // 1-5
    feedback?: string;
    reviewedBy: string;
    reviewedAt: Timestamp;
  } | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// reports/{reportId}/updates/{updateId}
export interface ReportUpdate {
  id: string;
  message: string;
  statusAtUpdate: ReportStatus;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: Timestamp;
}

// ============================================================
// notifications/{notificationId}
// ============================================================

export type NotificationType =
  | "report_submitted"
  | "report_assigned"
  | "work_started"
  | "report_completed"
  | "report_closed"
  | "admin_update"
  | "team_assignment_changed"
  | "priority_changed"
  | "report_updated";

export interface AppNotification {
  id: string;
  userId: string; // recipient
  type: NotificationType;
  title: string;
  message: string;
  reportId?: string | null;
  isRead: boolean;
  createdAt: Timestamp;
}
