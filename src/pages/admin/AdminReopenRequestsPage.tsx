import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { listAllReports, listReopenRequests, reviewReopenRequest, type ReopenRequest } from "../../services/reportService";
import { ErrorState, LoadingScreen, PriorityBadge, StatusBadge } from "../../components/common/Common";
import type { Report } from "../../types/models";

type PendingItem = { report: Report; request: ReopenRequest };

function dateLabel(value?: { toDate?: () => Date }) {
  const date = value?.toDate?.();
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "Date unavailable";
}

export function AdminReopenRequestsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const reports = await listAllReports();
      const closedReports = reports.filter((report) => ["closed", "rejected"].includes(report.status));
      const requestGroups = await Promise.all(closedReports.map(async (report) => ({
        report,
        requests: await listReopenRequests(report.id),
      })));
      setItems(requestGroups.flatMap(({ report, requests }) => requests.map((request) => ({ report, request }))));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reopening requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load, refreshKey]);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(({ report, request }) =>
      [report.title, report.studentName, report.studentRoomNumber, report.roomNumber,
        report.towerName, report.departmentName, request.message].some((value) => value?.toLowerCase().includes(term))
    );
  }, [items, search]);

  async function decide(item: PendingItem, decision: "approved" | "declined") {
    if (!profile || !item.request.id) {
      showToast("This request is missing its record ID. Refresh the page and try again.", "error");
      return;
    }
    const key = `${item.report.id}:${item.request.id}`;
    setBusyId(key);
    try {
      await reviewReopenRequest(item.report, item.request.id, decision, {
        id: profile.uid, name: profile.name, role: profile.role,
      });
      setItems((current) => current.filter(({ request }) => request.id !== item.request.id));
      showToast(decision === "approved" ? "Complaint reopened and returned to the queue." : "Reopening request declined.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to process this request.", "error");
    } finally {
      setBusyId("");
    }
  }

  if (loading) return <LoadingScreen label="Loading reopening requests…" />;
  if (error) return <ErrorState message={error} />;

  return <div className="page-stack">
    <header className="page-header">
      <div>
        <p className="eyebrow">Complaint management</p>
        <h1>Reopen Requests</h1>
        <p>Review requests from students who need a closed or rejected complaint looked at again.</p>
      </div>
      <button className="btn btn--secondary" onClick={() => setRefreshKey((value) => value + 1)}>Refresh</button>
    </header>

    <section className="stats-grid" aria-label="Reopening request summary">
      <article className="stat-card"><span className="stat-card__label">Pending requests</span><strong className="stat-card__value">{items.length}</strong><span className="stat-card__hint">Awaiting an administrative decision</span></article>
      <article className="stat-card"><span className="stat-card__label">Showing</span><strong className="stat-card__value">{visibleItems.length}</strong><span className="stat-card__hint">Matching your search</span></article>
    </section>

    <section className="card">
      <div className="section-heading"><div><h2>Student requests</h2><p className="muted">Approve to return the complaint to Submitted, or decline with the request recorded.</p></div></div>
      <label className="field" htmlFor="reopen-search"><span>Search requests</span><input id="reopen-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, complaint, room or message" /></label>
      {visibleItems.length === 0 ? <div className="empty-state"><div className="empty-state__icon">✓</div><h3>{items.length === 0 ? "You're all caught up" : "No matching requests"}</h3><p>{items.length === 0 ? "There are no pending complaint reopening requests at the moment." : "Try another search term."}</p></div> : <div className="reopen-request-list">
        {visibleItems.map((item) => {
          const key = `${item.report.id}:${item.request.id}`;
          const busy = busyId === key;
          return <article className="reopen-request-card" key={key}>
            <div className="reopen-request-card__top">
              <div><span className="eyebrow">{item.report.towerName} · Room {item.report.roomNumber}</span><h3>{item.report.title}</h3><p className="muted">{item.report.studentName} · {item.report.studentRoomNumber || `Room ${item.report.roomNumber}`} · {item.report.departmentName}</p></div>
              <div className="reopen-request-card__badges"><StatusBadge status={item.report.status} /><PriorityBadge priority={item.report.priority} /></div>
            </div>
            <div className="reopen-request-card__message"><span className="muted">Student's reason</span><p>{item.request.message || "No additional reason provided."}</p></div>
            <div className="reopen-request-card__footer"><span className="muted">Requested {dateLabel(item.request.requestedAt)}</span><div className="reopen-request-card__actions"><Link className="btn btn--secondary" to={`/admin/complaints/${item.report.id}`}>View complaint</Link><button className="btn btn--secondary" disabled={!!busyId} onClick={() => void decide(item, "declined")}>{busy && busyId === key ? "Saving…" : "Decline"}</button><button className="btn btn--primary" disabled={!!busyId} onClick={() => void decide(item, "approved")}>{busy && busyId === key ? "Saving…" : "Accept & Reopen"}</button></div></div>
          </article>;
        })}
      </div>}
    </section>
  </div>;
}
