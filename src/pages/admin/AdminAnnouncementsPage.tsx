import { useEffect, useState } from "react";
import { createAnnouncement, listAnnouncements, type Announcement } from "../../services/operationsService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

function formatDate(value: any) {
  if (value?.toDate) return value.toDate().toLocaleString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export function AdminAnnouncementsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try { setError(""); setItems(await listAnnouncements()); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load announcements."); }
  }
  useEffect(() => { load(); }, []);

  async function publish() {
    if (!title.trim() || !message.trim()) { showToast("Enter an announcement title and message.", "error"); return; }
    setSaving(true);
    try {
      await createAnnouncement({ title: title.trim(), message: message.trim(), audience: "all", towerId: null, startsAt: new Date(), expiresAt: null, isActive: true, createdBy: profile?.uid ?? "", createdByName: profile?.name ?? "CampusFix Administrator" });
      setTitle(""); setMessage(""); await load();
      showToast("Announcement published.", "success");
    } catch (e) { showToast(e instanceof Error ? e.message : "Unable to publish announcement.", "error"); }
    finally { setSaving(false); }
  }

  return <div>
    <div className="page-header"><h1>Announcements</h1><p>Publish campus-wide updates from the Administrative Portal.</p></div>
    {error && <div className="alert alert--error">{error}</div>}
    <section className="card">
      <h2>Add Announcement</h2>
      <p className="muted">Announcements published here appear on the student Announcements page.</p>
      <label className="field"><span>Title *</span><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Water supply update" /></label>
      <label className="field"><span>Message *</span><textarea className="input" rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write the campus update..." /></label>
      <button className="btn btn--primary" disabled={saving} onClick={publish}>{saving ? "Publishing..." : "Publish Announcement"}</button>
    </section>
    <section className="card"><h2>Recent Announcements</h2>{items.length ? items.map(item => <div className="list-row" key={item.id}><div><strong>{item.title}</strong><div className="muted">{item.message}</div></div><small>{formatDate(item.createdAt)}</small></div>) : <p className="muted">No announcements yet.</p>}</section>
  </div>;
}
