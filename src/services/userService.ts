import {
  deleteApp,
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  inMemoryPersistence,
  setPersistence,
  signOut as secondaryAuthSignOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { typedCollection, typedDoc } from "../firebase/firestore";
import { toAppError, AppError } from "../utils/errors";
import type {
  UserProfile,
  StudentProfile,
  WorkerProfile,
  WorkerType,
} from "../types/models";

const USERS = "users";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snapshot = await getDoc(typedDoc<UserProfile>(USERS, uid));
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    throw toAppError(error, "Unable to load your profile.");
  }
}

export async function listStudents(): Promise<StudentProfile[]> {
  try {
    const snapshot = await getDocs(typedCollection<StudentProfile>(USERS));
    return snapshot.docs
      .map((d) => d.data())
      .filter((user) => user.role === "student")
      .sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));
  } catch (error) {
    throw toAppError(error, "Unable to load students.");
  }
}

export async function listWorkers(): Promise<WorkerProfile[]> {
  try {
    const snapshot = await getDocs(typedCollection<WorkerProfile>(USERS));
    return snapshot.docs
      .map((d) => d.data())
      .filter((user) => user.role === "operations")
      .sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));
  } catch (error) {
    throw toAppError(error, "Unable to load workers.");
  }
}

export async function listAllUsers(): Promise<UserProfile[]> {
  try {
    const snapshot = await getDocs(typedCollection<UserProfile>(USERS));
    return snapshot.docs
      .map((d) => d.data())
      .sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));
  } catch (error) {
    throw toAppError(error, "Unable to load users.");
  }
}

/**
 * Creates a worker account. This must be callable ONLY by an admin (enforced
 * both by the UI, which hides this screen from non-admins, and by Firestore
 * security rules, which reject writes to users/{uid} with role != the
 * caller's own uid unless the caller is an admin).
 *
 * Firebase's client Auth SDK signs in as whatever account it just created,
 * which would kick the admin out of their own session. To avoid that we spin
 * up a short-lived secondary Firebase App instance purely for the
 * createUserWithEmailAndPassword call, then tear it down immediately. The
 * admin's primary session is never touched.
 */
export async function createWorkerAccount(input: {
  name: string;
  email: string;
  temporaryPassword: string;
  phone?: string;
  workerId: string;
  workerType: WorkerType;
  department: string;
  teamId?: string | null;
  teamName?: string | null;
}): Promise<WorkerProfile> {
  const secondaryAppName = `worker-creation-${Date.now()}`;
  const primaryApp = getApp();
  const secondaryApp =
    getApps().find((a) => a.name === secondaryAppName) ??
    initializeApp(primaryApp.options, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);
  let createdUser: Awaited<ReturnType<typeof createUserWithEmailAndPassword>>["user"] | null = null;

  try {
    // Never let the temporary worker account replace or persist over the
    // administrator's browser session. This secondary Auth instance is only
    // used to create the new Firebase Auth identity.
    await setPersistence(secondaryAuth, inMemoryPersistence);

    const currentAdmin = auth.currentUser;
    if (!currentAdmin) {
      throw new AppError(
        "Your administrator session has expired. Please sign in again.",
        "auth/admin-session-missing"
      );
    }

    const adminProfile = await getUserProfile(currentAdmin.uid);
    if (!adminProfile || adminProfile.role !== "admin") {
      throw new AppError(
        "Your account is not authorized to create worker accounts.",
        "auth/admin-required"
      );
    }

    const email = input.email.trim().toLowerCase();
    if (!email) {
      throw new AppError("Worker email is required.", "app/invalid-worker-email");
    }
    if (input.temporaryPassword.length < 6) {
      throw new AppError(
        "Temporary password must be at least 6 characters.",
        "app/weak-worker-password"
      );
    }

    // Avoid creating duplicate worker IDs. Email uniqueness is enforced by
    // Firebase Authentication itself.
    const existingWorkers = await listWorkers();
    const duplicateWorkerId = existingWorkers.some(
      (worker) =>
        worker.workerId.trim().toLowerCase() === input.workerId.trim().toLowerCase()
    );
    if (duplicateWorkerId) {
      throw new AppError(
        `Worker ID "${input.workerId.trim()}" is already in use.`,
        "app/worker-id-already-exists"
      );
    }

    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      input.temporaryPassword
    );
    createdUser = credential.user;
    const uid = credential.user.uid;

    const profile: WorkerProfile = {
      id: uid,
      uid,
      name: input.name.trim(),
      email,
      role: "operations",
      phone: input.phone?.trim() || "",
      department: input.department,
      isActive: true,
      workerId: input.workerId.trim(),
      workerType: input.workerType,
      teamId: input.teamId ?? null,
      teamName: input.teamName ?? null,
      createdAt: serverTimestamp() as unknown as WorkerProfile["createdAt"],
      updatedAt: serverTimestamp() as unknown as WorkerProfile["updatedAt"],
    };

    // This write goes through the PRIMARY Firestore instance, whose auth
    // session is still the administrator. The security rules therefore see
    // the real admin when authorizing users/{workerUid}.
    try {
      await setDoc(doc(db, USERS, uid), profile);
    } catch (error) {
      console.error("Worker profile Firestore write failed:", error);
      throw error;
    }

    await secondaryAuthSignOut(secondaryAuth);
    createdUser = null;
    return profile;
  } catch (error) {
    // If Auth creation succeeded but the profile write failed, remove the
    // orphaned Auth account before returning the error. This keeps Firebase
    // Authentication and Firestore in sync.
    if (createdUser) {
      try {
        await deleteUser(createdUser);
      } catch (cleanupError) {
        console.error("Failed to clean up orphaned worker Auth account:", cleanupError);
      }
    }
    throw toAppError(error, "Unable to create worker account.");
  } finally {
    await deleteApp(secondaryApp).catch(() => {
      /* best-effort cleanup */
    });
  }
}

export async function updateWorkerTeamAssignment(
  uid: string,
  teamId: string | null,
  teamName: string | null
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS, uid), {
      teamId,
      teamName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toAppError(error, "Unable to update worker's team assignment.");
  }
}

export async function setUserActive(
  uid: string,
  isActive: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS, uid), {
      isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toAppError(error, "Unable to update user status.");
  }
}

/**
 * Explicit, deliberate admin bootstrap. This is NOT wired into any UI flow
 * automatically — an existing admin must call it (e.g. once, from a secured
 * internal tool or the Settings page after verifying identity) to promote a
 * user to admin. No signup flow ever sets role="admin" on its own, so an
 * attacker who signs up cannot become an admin by any client-side path.
 */
export async function promoteToAdmin(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, USERS, uid), {
      role: "admin",
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toAppError(
      error,
      "Unable to update role. This action requires admin security rules to allow it."
    );
  }
}

export { AppError };
