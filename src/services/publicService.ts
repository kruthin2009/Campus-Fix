import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { ReportStatus } from "../types/models";

export interface PublicStats {
  totalComplaints: number;
  activeComplaints: number;
  assignedComplaints: number;
  inProgressComplaints: number;
  completedComplaints: number;
  closedComplaints: number;
  totalWorkers: number;
  totalTeams: number;
  totalTowers: number;
  resolutionRate: number;
  updatedAt?: Timestamp | null;
}

export interface PublicActivity {
  id: string;
  towerName: string;
  departmentName: string;
  status: ReportStatus;
  updatedAt?: Timestamp | null;
}

const defaultStats: PublicStats = {
  totalComplaints: 0,
  activeComplaints: 0,
  assignedComplaints: 0,
  inProgressComplaints: 0,
  completedComplaints: 0,
  closedComplaints: 0,
  totalWorkers: 0,
  totalTeams: 0,
  totalTowers: 0,
  resolutionRate: 0,
};

export async function getPublicStats(): Promise<PublicStats> {
  const snapshot = await getDoc(doc(db, "publicStats", "overview"));
  if (!snapshot.exists()) return defaultStats;
  return { ...defaultStats, ...snapshot.data() } as PublicStats;
}

export function subscribeToPublicStats(
  onChange: (stats: PublicStats) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, "publicStats", "overview"),
    (snapshot) => {
      onChange(snapshot.exists() ? ({ ...defaultStats, ...snapshot.data() } as PublicStats) : defaultStats);
    },
    (error) => onError?.(error),
  );
}

export function subscribeToPublicActivity(
  onChange: (items: PublicActivity[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(
    collection(db, "publicActivity"),
    orderBy("updatedAt", "desc"),
    limit(8),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as PublicActivity[]);
    },
    (error) => onError?.(error),
  );
}

export async function syncPublicSnapshot(stats: PublicStats, reports: PublicActivity[]) {
  await setDoc(doc(db, "publicStats", "overview"), {
    ...stats,
    updatedAt: serverTimestamp(),
  });

  const existing = await getDocs(collection(db, "publicActivity"));
  const keepIds = new Set(reports.map((item) => item.id));
  await Promise.all(
    reports.map((item) =>
      setDoc(doc(db, "publicActivity", item.id), {
        towerName: item.towerName || "Campus",
        departmentName: item.departmentName || "Maintenance",
        status: item.status,
        updatedAt: item.updatedAt ?? serverTimestamp(),
      }),
    ),
  );

  // Do not delete through the browser. Old public entries are harmless and
  // remain anonymized; the next sync simply overwrites the newest entries.
  void existing.docs.filter((item) => !keepIds.has(item.id));
}
