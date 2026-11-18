import { useEffect, useState } from "react";
import { listAnnouncements, type Announcement } from "../../services/operationsService";

function formatDate(value: any) { return value?.toDate?.()?.toLocaleString?.() ?? ""; }
export function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    listAnnouncements().then((data) => { if (active) { const now = Date.now(); setItems(data.filter((item) => { const starts = item.startsAt?.toDate?.()?.getTime?.() ?? 0; const expires = item.expiresAt?.toDate?.()?.getTime?.() ?? null; return item.isActive && (item.audience === "all" || item.audience === "students") && starts <= now && (expires === null || expires >= now); })); } }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load announcements."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <div><div className="page-header"><h1>Campus Announcements</h1><p>Important service and maintenance updates from campus operations.</p></div>{error && <div className="alert alert--error">{error}</div>}{loading && <div className="card"><p>Loading announcements…</p></div>}{items.map((item) => <article className="card" key={item.id}><div style={{display:"flex",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}><h2>{item.title}</h2><small>{formatDate(item.createdAt)}</small></div><p>{item.message}</p></article>)}{!loading && !error && !items.length && <div className="card"><p>No announcements right now.</p></div>}</div>;
}
