import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  markAllNotificationsRead,
  subscribeToUserNotifications,
} from "../../services/notificationService";
import { EmptyState } from "../../components/common/Common";
import type { AppNotification } from "../../types/models";

export function AdminNotificationsPage() {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeToUserNotifications(firebaseUser.uid, setNotifications, () => {});
  }, [firebaseUser]);

  return (
    <div>
      <div className="page-header page-header--row">
        <div>
          <h1>Notifications</h1>
          <p>System notifications for your account.</p>
        </div>
        {notifications.some((n) => !n.isRead) && firebaseUser && (
          <button
            className="btn btn--secondary"
            onClick={() => markAllNotificationsRead(firebaseUser.uid)}
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications yet" />
      ) : (
        <div className="notification-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notification-list__item ${n.isRead ? "" : "is-unread"}`}
            >
              <div className="notification-list__title">{n.title}</div>
              <div className="notification-list__message">{n.message}</div>
              <div className="notification-list__time">
                {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
