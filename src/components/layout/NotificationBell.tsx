import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToUserNotifications,
} from "../../services/notificationService";
import type { AppNotification } from "../../types/models";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubscribe = subscribeToUserNotifications(
      firebaseUser.uid,
      setNotifications,
      () => {
        /* silently ignore — notifications are non-critical */
      }
    );
    return unsubscribe;
  }, [firebaseUser]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="notification-bell" ref={ref}>
      <button
        className="notification-bell__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">
            <span>Notifications</span>
            {unreadCount > 0 && firebaseUser && (
              <button
                className="link-button"
                onClick={() => markAllNotificationsRead(firebaseUser.uid)}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="notification-bell__list">
            {notifications.length === 0 && (
              <div className="notification-bell__empty">
                You're all caught up.
              </div>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                className={`notification-bell__item ${
                  n.isRead ? "" : "is-unread"
                }`}
                onClick={() => markNotificationRead(n.id)}
              >
                <div className="notification-bell__item-title">{n.title}</div>
                <div className="notification-bell__item-message">
                  {n.message}
                </div>
                <div className="notification-bell__item-time">
                  {n.createdAt?.toDate
                    ? timeAgo(n.createdAt.toDate())
                    : ""}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
