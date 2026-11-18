import {
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { typedCollection } from "../firebase/firestore";
import { toAppError } from "../utils/errors";
import type { Department } from "../types/models";

const DEPARTMENTS = "departments";

export async function listActiveDepartments(): Promise<Department[]> {
  try {
    const snapshot = await getDocs(typedCollection<Department>(DEPARTMENTS));
    return snapshot.docs
      .map((d) => ({ ...d.data(), isActive: d.data().isActive !== false }))
      .filter((department) => department.isActive)
      .sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));
  } catch (error) {
    throw toAppError(error, "Unable to load departments.");
  }
}

export async function listAllDepartments(): Promise<Department[]> {
  try {
    const snapshot = await getDocs(typedCollection<Department>(DEPARTMENTS));
    return snapshot.docs
      .map((d) => ({ ...d.data(), isActive: d.data().isActive !== false }))
      .sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));
  } catch (error) {
    throw toAppError(error, "Unable to load departments.");
  }
}

export function subscribeToActiveDepartments(
  onChange: (departments: Department[]) => void,
  onError: (error: unknown) => void
): () => void {
  return onSnapshot(
    typedCollection<Department>(DEPARTMENTS),
    (snapshot) =>
      onChange(
        snapshot.docs
          .map((d) => ({ ...d.data(), isActive: d.data().isActive !== false }))
          .filter((department) => department.isActive)
          .sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")))
      ),
    onError
  );
}

export async function createDepartment(input: {
  name: string;
  description?: string;
}): Promise<string> {
  try {
    const ref = await addDoc(typedCollection<Department>(DEPARTMENTS), {
      id: "",
      name: input.name.trim(),
      description: input.description?.trim() || "",
      isActive: true,
      createdAt: serverTimestamp() as unknown as Department["createdAt"],
      updatedAt: serverTimestamp() as unknown as Department["updatedAt"],
    });
    return ref.id;
  } catch (error) {
    throw toAppError(error, "Unable to create department.");
  }
}

export async function updateDepartment(
  departmentId: string,
  updates: Partial<Pick<Department, "name" | "description">>
): Promise<void> {
  try {
    await updateDoc(doc(db, DEPARTMENTS, departmentId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toAppError(error, "Unable to update department.");
  }
}

export async function setDepartmentActive(
  departmentId: string,
  isActive: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, DEPARTMENTS, departmentId), {
      isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toAppError(error, "Unable to update department status.");
  }
}

export async function deleteDepartment(departmentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, DEPARTMENTS, departmentId));
  } catch (error) {
    throw toAppError(error, "Unable to delete department.");
  }
}
