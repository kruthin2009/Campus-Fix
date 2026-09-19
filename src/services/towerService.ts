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
import type { Tower } from "../types/models";

const TOWERS = "towers";

export async function listActiveTowers(): Promise<Tower[]> {
  try {
    const snapshot = await getDocs(typedCollection<Tower>(TOWERS));
    return snapshot.docs
      .map((d) => d.data())
      .map((tower) => ({ ...tower, isActive: tower.isActive !== false }))
      .filter((tower) => tower.isActive)
      .sort((a, b) => Number(a.number ?? 0) - Number(b.number ?? 0));
  } catch (error) {
    throw toAppError(error, "Unable to load towers.");
  }
}

export async function listAllTowers(): Promise<Tower[]> {
  try {
    const snapshot = await getDocs(typedCollection<Tower>(TOWERS));
    return snapshot.docs
      .map((d) => ({ ...d.data(), isActive: d.data().isActive !== false }))
      .sort((a, b) => Number(a.number ?? 0) - Number(b.number ?? 0));
  } catch (error) {
    throw toAppError(error, "Unable to load towers.");
  }
}

export function subscribeToActiveTowers(
  onChange: (towers: Tower[]) => void,
  onError: (error: unknown) => void
): () => void {
  return onSnapshot(
    typedCollection<Tower>(TOWERS),
    (snapshot) =>
      onChange(
        snapshot.docs
          .map((d) => ({ ...d.data(), isActive: d.data().isActive !== false }))
          .filter((tower) => tower.isActive)
          .sort((a, b) => Number(a.number ?? 0) - Number(b.number ?? 0))
      ),
    onError
  );
}

export async function createTower(input: {
  name: string;
  number: number;
  description?: string;
  imageUrl?: string | null;
}): Promise<string> {
  try {
    const ref = await addDoc(typedCollection<Tower>(TOWERS), {
      id: "",
      name: input.name.trim(),
      number: input.number,
      description: input.description?.trim() || "",
      imageUrl: input.imageUrl ?? null,
      isActive: true,
      createdAt: serverTimestamp() as unknown as Tower["createdAt"],
      updatedAt: serverTimestamp() as unknown as Tower["updatedAt"],
    });
    return ref.id;
  } catch (error) {
    throw toAppError(error, "Unable to create tower.");
  }
}

export async function updateTower(
  towerId: string,
  updates: Partial<Pick<Tower, "name" | "number" | "description" | "imageUrl">>
): Promise<void> {
  try {
    await updateDoc(doc(db, TOWERS, towerId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toAppError(error, "Unable to update tower.");
  }
}

export async function setTowerActive(
  towerId: string,
  isActive: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, TOWERS, towerId), {
      isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toAppError(error, "Unable to update tower status.");
  }
}

export async function deleteTower(towerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, TOWERS, towerId));
  } catch (error) {
    throw toAppError(error, "Unable to delete tower.");
  }
}
