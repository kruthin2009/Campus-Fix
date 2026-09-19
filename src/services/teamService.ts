import {
  addDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { typedCollection } from "../firebase/firestore";
import { toAppError } from "../utils/errors";
import type { WorkerTeam } from "../types/models";

const TEAMS = "workerTeams";
const USERS = "users";

export async function listActiveTeams(): Promise<WorkerTeam[]> {
  try {
    const snapshot = await getDocs(typedCollection<WorkerTeam>(TEAMS));
    return snapshot.docs
      .map((d) => ({ ...d.data(), isActive: d.data().isActive !== false }))
      .filter((team) => team.isActive !== false)
      .sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));
  } catch (error) {
    throw toAppError(error, "Unable to load teams.");
  }
}

export function subscribeToActiveTeams(
  onChange: (teams: WorkerTeam[]) => void,
  onError: (error: unknown) => void
): () => void {
  return onSnapshot(
    typedCollection<WorkerTeam>(TEAMS),
    (snapshot) =>
      onChange(
        snapshot.docs
          .map((d) => ({ ...d.data(), isActive: d.data().isActive !== false }))
          .filter((team) => team.isActive)
          .sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")))
      ),
    onError
  );
}

export async function createTeam(input: {
  name: string;
  departmentId: string;
  departmentName: string;
}): Promise<string> {
  try {
    const ref = await addDoc(typedCollection<WorkerTeam>(TEAMS), {
      id: "",
      teamId: "", // filled in below once we know the generated id
      name: input.name.trim(),
      departmentId: input.departmentId,
      departmentName: input.departmentName,
      workerIds: [],
      workerNames: [],
      leaderId: null,
      leaderName: null,
      isActive: true,
      createdAt: serverTimestamp() as unknown as WorkerTeam["createdAt"],
      updatedAt: serverTimestamp() as unknown as WorkerTeam["updatedAt"],
    });
    await updateDoc(ref, { teamId: ref.id });
    return ref.id;
  } catch (error) {
    throw toAppError(error, "Unable to create team.");
  }
}

export async function renameTeam(teamId: string, name: string): Promise<void> {
  try {
    await updateDoc(doc(db, TEAMS, teamId), {
      name: name.trim(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toAppError(error, "Unable to rename team.");
  }
}

export async function assignTeamDepartment(
  teamId: string,
  departmentId: string,
  departmentName: string
): Promise<void> {
  try {
    await updateDoc(doc(db, TEAMS, teamId), {
      departmentId,
      departmentName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toAppError(error, "Unable to assign department to team.");
  }
}

export async function setTeamActive(
  teamId: string,
  isActive: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, TEAMS, teamId), {
      isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toAppError(error, "Unable to update team status.");
  }
}

/**
 * Adds a worker to a team. Updates both the team's worker list and the
 * worker's own profile (teamId/teamName) in a single atomic batch, so the
 * two documents can never fall out of sync.
 */
export async function addWorkerToTeam(
  team: WorkerTeam,
  workerId: string,
  workerName: string
): Promise<void> {
  if (team.workerIds.includes(workerId)) return;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, TEAMS, team.id), {
      workerIds: [...team.workerIds, workerId],
      workerNames: [...team.workerNames, workerName],
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, USERS, workerId), {
      teamId: team.id,
      teamName: team.name,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    throw toAppError(error, "Unable to add worker to team.");
  }
}

export async function removeWorkerFromTeam(
  team: WorkerTeam,
  workerId: string
): Promise<void> {
  const index = team.workerIds.indexOf(workerId);
  if (index === -1) return;
  try {
    const newIds = team.workerIds.filter((id) => id !== workerId);
    const newNames = team.workerNames.filter((_, i) => i !== index);
    const batch = writeBatch(db);
    batch.update(doc(db, TEAMS, team.id), {
      workerIds: newIds,
      workerNames: newNames,
      // If the removed worker was the leader, clear leadership.
      ...(team.leaderId === workerId
        ? { leaderId: null, leaderName: null }
        : {}),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, USERS, workerId), {
      teamId: null,
      teamName: null,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    throw toAppError(error, "Unable to remove worker from team.");
  }
}

export async function assignTeamLeader(
  teamId: string,
  leaderId: string | null,
  leaderName: string | null
): Promise<void> {
  try {
    await updateDoc(doc(db, TEAMS, teamId), {
      leaderId,
      leaderName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toAppError(error, "Unable to assign team leader.");
  }
}
