import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listAnnouncements, listMaintenance, type Announcement, type MaintenanceItem } from "../../services/operationsService";
import type { WorkerProfile } from "../../types/models";

function dateLabel(value: any) {
  const date = value?.toDate?.() ?? (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "Date not specified";
}

export function WorkerAnnouncementsPage() {
  const { profile } = useAuth();
  const worker = profile as WorkerProfile | null;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([listAnnouncements(), listMaintenance()])
      .then(([news, schedules]) => {
        if (!active) return;
        const now = Date.now();
        setAnnouncements(news.filter((item) => {
          const starts = item.startsAt?.toDate?.()?.getTime?.() ?? 0;
          const expires = item.expiresAt?.toDate?.()?.getTime?.() ?? null;
          const audienceMatch = item.audience === "all" || item.audience === "workers";
          return item.isActive && audienceMatch && starts <= now && (expires === null || expires >= now);
        }));
        setMaintenance(schedules.filter((item) => item.isActive && (!item.assignedWorkerId || item.assignedWorkerId === worker?.uid)).slice(0, 20));
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Unable to load worker updates."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [worker?.uid]);

  return <div>
    <div className="page-header"><h1>Announcements & Maintenance</h1><p>Operations notices, service interruptions and upcoming maintenance relevant to your work.</p></div>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    <section className="card"><h2>Campus Announcements</h2>
      {loading ? <p className="muted">Loading announcements…</p> : announcements.length ? announcements.map((item) => <article className="list-row" key={item.id}><div><strong>{item.title}</strong><p>{item.message}</p><small className="muted">Published {dateLabel(item.createdAt)}</small></div><span className="status-badge status-badge--info">Notice</span></article>) : <p className="muted">No active worker announcements right now.</p>}
    </section>
    <section className="card"><h2>Maintenance Schedule</h2><p className="muted">Active schedules assigned to you or available to the operations team.</p>
      {loading ? <p className="muted">Loading schedules…</p> : maintenance.length ? maintenance.map((item) => <article className="list-row" key={item.id}><div><strong>{item.title}</strong><p>{item.location}{item.notes ? ` · ${item.notes}` : ""}</p><small className="muted">Next due: {dateLabel(item.nextDue)} · {item.frequency.replaceAll("_", " ")}</small></div></article>) : <p className="muted">No active maintenance schedules are assigned.</p>}
    </section>
  </div>;
}
