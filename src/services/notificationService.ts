import {
  addDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { typedCollection } from "../firebase/firestore";
import { toAppError } from "../utils/errors";
import type { AppNotification, NotificationType } from "../types/models";

const NOTIFICATIONS = "notifications";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  reportId?: string | null;
}): Promise<void> {
  try {
    await addDoc(typedCollection<AppNotification>(NOTIFICATIONS), {
      id: "",
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      reportId: input.reportId ?? null,
      isRead: false,
      createdAt: serverTimestamp() as unknown as AppNotification["createdAt"],
    });
  } catch (error) {
    // Notifications are best-effort: a failure here should never block the
    // underlying workflow (e.g. submitting a complaint) from succeeding.
    // eslint-disable-next-line no-console
    console.error("Failed to create notification:", error);
  }
}

export function subscribeToUserNotifications(
  userId: string,
  onChange: (notifications: AppNotification[]) => void,
  onError: (error: unknown) => void
): () => void {
  // Query only by userId and sort/limit client-side to avoid a composite
  // userId + createdAt index.
  const q = query(
    typedCollection<AppNotification>(NOTIFICATIONS),
    where("userId", "==", userId)
  );
  return onSnapshot(
    q,
    (snapshot) =>
      onChange(
        snapshot.docs
          .map((d) => d.data())
          .sort((a, b) =>
            (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
          )
          .slice(0, 50)
      ),
    onError
  );
}

export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, NOTIFICATIONS, notificationId), { isRead: true });
  } catch (error) {
    throw toAppError(error, "Unable to update notification.");
  }
}

export async function markAllNotificationsRead(
  userId: string
): Promise<void> {
  try {
    const q = query(
      typedCollection<AppNotification>(NOTIFICATIONS),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    const unread = snapshot.docs.filter((d) => d.data().isRead === false);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((d) => batch.update(d.ref, { isRead: true }));
    await batch.commit();
  } catch (error) {
    throw toAppError(error, "Unable to update notifications.");
  }
}
