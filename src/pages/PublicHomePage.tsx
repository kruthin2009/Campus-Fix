import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { subscribeToPublicActivity, subscribeToPublicStats, type PublicActivity, type PublicStats } from "../services/publicService";
import type { ReportStatus } from "../types/models";
import { ThemeToggle } from "../components/common/ThemeToggle";

const emptyStats: PublicStats = {
  totalComplaints: 0,
  activeComplaints: 0,
  assignedComplaints: 0,
  inProgressComplaints: 0,
  completedComplaints: 0,
  closedComplaints: 0,
  totalWorkers: 0,
  totalTeams: 0,
  totalTowers: 0,
  resolutionRate: 0,
};

const statusLabel: Record<ReportStatus, string> = {
  submitted: "Submitted",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  closed: "Closed",
  rejected: "Rejected",
};

function formatTime(timestamp?: { toDate?: () => Date } | null) {
  if (!timestamp?.toDate) return "Recently";
  return timestamp.toDate().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function PublicHomePage() {
  const [stats, setStats] = useState<PublicStats>(emptyStats);
  const [activity, setActivity] = useState<PublicActivity[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const stopStats = subscribeToPublicStats(setStats, () => setLive(false));
    const stopActivity = subscribeToPublicActivity(setActivity, () => setLive(false));
    setLive(true);
    return () => {
      stopStats();
      stopActivity();
    };
  }, []);

  const metrics = useMemo(() => [
    ["Total Complaints", stats.totalComplaints, "All requests received"],
    ["Active", stats.activeComplaints, "Currently being handled"],
    ["Resolved", stats.completedComplaints + stats.closedComplaints, "Completed or closed"],
    ["Resolution Rate", `${stats.resolutionRate}%`, "Across all complaints"],
    ["Workers", stats.totalWorkers, "Maintenance workforce"],
    ["Towers", stats.totalTowers, "Residential towers"],
  ], [stats]);

  return (
    <main className="public-home">
      <nav className="public-nav">
        <Link className="public-brand" to="/" aria-label="CampusFix home">
          <span className="public-brand__mark">CF</span>
          <span>CampusFix</span>
        </Link>
        <div className="public-nav__links">
          <ThemeToggle />
          <a href="#live">Live Status</a>
          <a href="#how">How It Works</a>
          <Link className="public-nav__login" to="/login">Login</Link>
        </div>
      </nav>

      <section className="public-hero">
        <div className="public-orbit public-orbit--one" />
        <div className="public-orbit public-orbit--two" />
        <div className="public-hero__content">
          <div className="live-pill"><span className={`live-dot ${live ? "live-dot--on" : ""}`} /> Live campus operations</div>
          <p className="public-kicker">SMART CAMPUS SERVICE PLATFORM</p>
          <h1>Report it.<br /><span>Track it.</span><br />Fix it.</h1>
          <p className="public-hero__text">
            CampusFix connects students, administrators and maintenance teams in one transparent complaint management system.
          </p>
          <div className="public-hero__actions">
            <Link className="public-cta public-cta--primary" to="/login">Enter CampusFix <span>→</span></Link>
            <a className="public-cta public-cta--ghost" href="#live">View live status</a>
          </div>
        </div>
        <div className="public-hero__visual" aria-hidden="true">
          <div className="dashboard-float dashboard-float--main">
            <div className="mini-top"><span>CampusFix</span><span className="mini-live">● LIVE</span></div>
            <div className="mini-number">{stats.activeComplaints}</div>
            <div className="mini-label">active complaints</div>
            <div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /></div>
          </div>
          <div className="dashboard-float dashboard-float--side">
            <span className="mini-check">✓</span>
            <strong>{stats.resolutionRate}%</strong>
            <small>resolution rate</small>
          </div>
        </div>
      </section>

      <section id="live" className="public-section public-section--stats">
        <div className="section-heading">
          <div><p className="public-kicker">LIVE CAMPUS DATA</p><h2>Maintenance at a glance.</h2></div>
          <span className="data-note"><span className="live-dot live-dot--on" /> Updates from CampusFix</span>
        </div>
        <div className="public-metric-grid">
          {metrics.map(([label, value, detail]) => (
            <article className="public-metric" key={String(label)}>
              <span>{label}</span><strong>{value}</strong><small>{detail}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-live-panel">
        <div className="section-heading"><div><p className="public-kicker">RECENT ACTIVITY</p><h2>What is happening now.</h2></div></div>
        <div className="activity-list">
          {activity.length === 0 ? (
            <div className="activity-empty">Live activity will appear here as CampusFix processes complaints.</div>
          ) : activity.map((item) => (
            <div className="activity-row" key={item.id}>
              <span className={`status-dot status-dot--${item.status}`} />
              <div><strong>Maintenance request updated</strong><span>{item.towerName} · {item.departmentName}</span></div>
              <div className="activity-meta"><b>{statusLabel[item.status]}</b><small>{formatTime(item.updatedAt)}</small></div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="public-section how-section">
        <div className="section-heading"><div><p className="public-kicker">ONE WORKFLOW</p><h2>From complaint to completion.</h2></div></div>
        <div className="workflow-grid">
          {[["01", "Report", "Student raises a complaint and selects their tower."], ["02", "Assign", "Admin routes the request to the right department and team."], ["03", "Resolve", "Workers update progress until the issue is completed."], ["04", "Track", "Everyone sees the right status through their portal."]].map(([number, title, text]) => (
            <article className="workflow-card" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <section className="public-portals">
        <div><p className="public-kicker">CHOOSE YOUR PORTAL</p><h2>One campus. Three connected roles.</h2></div>
        <div className="portal-choice-grid">
          <Link to="/login" className="portal-choice"><span>01</span><div><strong>Student Portal</strong><small>Raise and track complaints</small></div><b>→</b></Link>
          <Link to="/login" className="portal-choice"><span>02</span><div><strong>Admin Portal</strong><small>Assign, manage and monitor</small></div><b>→</b></Link>
          <Link to="/login" className="portal-choice"><span>03</span><div><strong>Worker Portal</strong><small>View tasks and update progress</small></div><b>→</b></Link>
        </div>
      </section>

      <footer className="public-footer"><strong>CampusFix</strong><span>Smart Campus Complaint & Maintenance Management</span><span>© 2026 CampusFix</span></footer>
    </main>
  );
}
