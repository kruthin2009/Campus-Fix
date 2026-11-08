import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { subscribeToPublicActivity, subscribeToPublicStats, type PublicActivity, type PublicStats } from "../services/publicService";
import type { ReportStatus } from "../types/models";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { InstallAppButton } from "../components/common/InstallAppButton";
import { useAuth } from "../context/AuthContext";
import { portalHomeForRole } from "../routes/ProtectedRoute";

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
  in_progress: "In progress",
  completed: "Completed",
  closed: "Closed",
  rejected: "Rejected",
};

function formatTime(timestamp?: { toDate?: () => Date } | null) {
  if (!timestamp?.toDate) return "Recently updated";
  return timestamp.toDate().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function PublicHomePage() {
  const { firebaseUser, profile, status } = useAuth();
  const [stats, setStats] = useState<PublicStats>(emptyStats);
  const [activity, setActivity] = useState<PublicActivity[]>([]);
  const [statsAvailable, setStatsAvailable] = useState(false);
  const [activityAvailable, setActivityAvailable] = useState(false);

  useEffect(() => {
    const stopStats = subscribeToPublicStats((value) => {
      setStats(value);
      setStatsAvailable(value.totalTowers > 0 || value.totalComplaints > 0 || value.totalWorkers > 0);
    }, () => setStatsAvailable(false));
    const stopActivity = subscribeToPublicActivity((items) => {
      setActivity(items);
      setActivityAvailable(true);
    }, () => setActivityAvailable(false));
    return () => {
      stopStats();
      stopActivity();
    };
  }, []);

  const metrics = useMemo(() => [
    { label: "Requests received", value: stats.totalComplaints, detail: "Total complaints recorded", icon: "01" },
    { label: "Being handled", value: stats.activeComplaints, detail: "Active requests", icon: "02" },
    { label: "Resolved", value: stats.completedComplaints + stats.closedComplaints, detail: "Completed or closed", icon: "03" },
    { label: "Resolution rate", value: `${stats.resolutionRate}%`, detail: "Based on recorded requests", icon: "04" },
  ], [stats]);

  const portalHref = status === "profile-missing"
    ? "/profile-missing"
    : firebaseUser && profile
      ? portalHomeForRole(profile.role)
      : "/login";
  const portalLabel = firebaseUser && profile ? "Go to your workspace" : "Enter CampusFix";

  return (
    <main className="public-home v2-home">
      <nav className="public-nav v2-nav" aria-label="Main navigation">
        <Link className="public-brand" to="/" aria-label="CampusFix home">
          <span className="public-brand__mark">CF</span>
          <span className="v2-brand-copy"><strong>CampusFix</strong><small>Campus operations, connected.</small></span>
        </Link>
        <div className="public-nav__links v2-nav-links">
          <a href="#platform">Platform</a>
          <a href="#live">Live overview</a>
          <a href="#portals">Portals</a>
          <ThemeToggle />
          <InstallAppButton />
          <Link className="public-nav__login" to={portalHref}>{firebaseUser && profile ? "Workspace" : "Sign in"}</Link>
        </div>
      </nav>

      <section className="public-hero v2-hero">
        <div className="v2-hero-grid" aria-hidden="true" />
        <div className="public-hero__content v2-hero-copy">
          <div className="v2-eyebrow"><span className="v2-eyebrow-dot" /> CAMPUS SERVICE MANAGEMENT <span className="v2-version">V2.0.4</span></div>
          <h1>Campus issues,<br /><em>handled better.</em></h1>
          <p className="public-hero__text">A single, accountable place to report campus issues, route work to the right people, and follow every update through to resolution.</p>
          <div className="v2-hero-actions">
            <Link className="v2-button v2-button--primary" to={portalHref}>{portalLabel}<span aria-hidden="true">↗</span></Link>
            <a className="v2-button v2-button--secondary" href="#platform">Explore the platform<span aria-hidden="true">↓</span></a>
          </div>
          <div className="v2-proof-row"><span><b>✓</b> Role-based workspaces</span><span><b>✓</b> Complaint timelines</span><span><b>✓</b> Live status updates</span></div>
        </div>
        <div className="v2-hero-art" aria-label="CampusFix workflow preview">
          <div className="v2-art-glow" />
          <div className="v2-window">
            <div className="v2-window-top"><div className="v2-window-brand"><span>CF</span><b>CampusFix</b></div><span className="v2-window-live"><i /> LIVE OVERVIEW</span></div>
            <div className="v2-window-body">
              <div className="v2-window-intro"><div><small>OPERATIONS SNAPSHOT</small><strong>Campus at a glance</strong></div><span>V2.0.4</span></div>
              <div className="v2-window-stat-grid">
                <div><small>Active requests</small><strong>{statsAvailable ? stats.activeComplaints : "—"}</strong><span className="v2-stat-caption">Currently in the workflow</span></div>
                <div><small>Resolved</small><strong>{statsAvailable ? stats.completedComplaints + stats.closedComplaints : "—"}</strong><span className="v2-stat-caption">Completed or closed</span></div>
              </div>
              <div className="v2-window-flow"><div className="v2-flow-heading"><b>Request lifecycle</b><small>One connected process</small></div><div className="v2-flow-track"><span className="is-done">Report</span><i /><span className="is-done">Assign</span><i /><span className="is-current">Resolve</span></div></div>
              <div className="v2-window-bottom"><span className="v2-avatar-stack"><i>S</i><i>W</i><i>A</i></span><span>Students · Workers · Administration</span><b>→</b></div>
            </div>
          </div>
          <div className="v2-floating-note"><span className="v2-note-icon">✓</span><div><b>Every update matters</b><small>Progress stays visible</small></div></div>
        </div>
        <div className="v2-hero-bottom"><span>BUILT FOR CAMPUS COMMUNITIES</span><span>REPORT <i>·</i> ASSIGN <i>·</i> RESOLVE <i>·</i> REVIEW</span></div>
      </section>

      <section className="v2-feature-band" id="platform">
        <div className="v2-section-intro"><p className="public-kicker">ONE CONNECTED PLATFORM</p><h2>Less chasing.<br /><em>More getting done.</em></h2><p>CampusFix connects the people who report issues with the teams responsible for resolving them.</p></div>
        <div className="v2-feature-grid">
          <article className="v2-feature-card v2-feature-card--dark"><span className="v2-feature-number">01 / REPORT</span><div className="v2-feature-icon">＋</div><h3>Capture the issue</h3><p>Students submit a complaint with its location, category, details, and supporting information.</p><span className="v2-feature-link">Clear issue intake <b>↗</b></span></article>
          <article className="v2-feature-card"><span className="v2-feature-number">02 / ASSIGN</span><div className="v2-feature-icon">⌘</div><h3>Route the work</h3><p>Administrators coordinate towers, departments, workers, teams, and incoming requests.</p><span className="v2-feature-link">Structured ownership <b>↗</b></span></article>
          <article className="v2-feature-card"><span className="v2-feature-number">03 / RESOLVE</span><div className="v2-feature-icon">✓</div><h3>Show the progress</h3><p>Workers update request status and resolution notes, keeping the process visible.</p><span className="v2-feature-link">Progress with context <b>↗</b></span></article>
          <article className="v2-feature-card"><span className="v2-feature-number">04 / REVIEW</span><div className="v2-feature-icon">↗</div><h3>Close the loop</h3><p>Students can follow complaint history and provide feedback when a request is completed.</p><span className="v2-feature-link">Accountability end to end <b>↗</b></span></article>
        </div>
      </section>

      <section id="live" className="v2-live-section">
        <div className="v2-live-heading"><div><p className="public-kicker">CAMPUSFIX IN NUMBERS</p><h2>Operations, at a glance.</h2><p>Public summary figures from the CampusFix reporting snapshot.</p></div><span className={`v2-live-status ${statsAvailable ? "is-live" : ""}`}><i /> {statsAvailable ? "Connected to live data" : "Waiting for data"}</span></div>
        <div className="v2-metric-grid">
          {metrics.map((metric) => <article className="v2-metric-card" key={metric.label}><span className="v2-metric-index">{metric.icon}</span><small>{metric.label}</small><strong>{statsAvailable ? metric.value : "—"}</strong><span>{statsAvailable ? metric.detail : "Live data not available"}</span></article>)}
        </div>
        <div className="v2-activity-panel"><div className="v2-activity-heading"><div><small>LIVE FEED</small><b>Recent campus activity</b></div><span>{activityAvailable ? "Latest public updates" : "Feed unavailable"}</span></div>
          {activity.length === 0 ? <div className="v2-activity-empty">Recent updates will appear here when public activity is available.</div> : <div className="v2-activity-list">{activity.map((item) => <div className="v2-activity-item" key={item.id}><span className={`status-dot status-dot--${item.status}`} /><div><b>Request updated</b><small>{item.towerName} · {item.departmentName}</small></div><span className="v2-activity-state">{statusLabel[item.status]}</span><time>{formatTime(item.updatedAt)}</time></div>)}</div>}
        </div>
      </section>

      <section className="v2-roles-section" id="portals"><div className="v2-roles-heading"><p className="public-kicker">DESIGNED AROUND REAL RESPONSIBILITIES</p><h2>One campus. Three workspaces.</h2><p>Each role gets a focused workspace with the tools and information relevant to its responsibilities.</p></div>
        <div className="v2-role-grid">
          <Link to="/login" className="v2-role-card"><span className="v2-role-index">01</span><div className="v2-role-symbol">◉</div><h3>Students</h3><p>Raise complaints, follow updates, view history, and review completed work.</p><span>Student workspace <b>↗</b></span></Link>
          <Link to="/login" className="v2-role-card v2-role-card--featured"><span className="v2-role-index">02</span><div className="v2-role-symbol">▦</div><h3>Administration</h3><p>Manage campus operations, coordinate teams, monitor reports, and publish updates.</p><span>Administrative workspace <b>↗</b></span></Link>
          <Link to="/login" className="v2-role-card"><span className="v2-role-index">03</span><div className="v2-role-symbol">⌁</div><h3>Workers</h3><p>Review assigned work, update progress, and record completion details.</p><span>Worker workspace <b>↗</b></span></Link>
        </div>
      </section>

      <section className="v2-policy-section"><div><p className="public-kicker">TRUST & TRANSPARENCY</p><h2>Clear rules.<br /><em>Responsible operations.</em></h2><p>Review how CampusFix handles access, privacy, acceptable use, and platform responsibilities.</p></div><div className="v2-policy-links"><Link to="/policies"><span>01</span><b>Policy Center</b><i>↗</i></Link><Link to="/privacy"><span>02</span><b>Privacy</b><i>↗</i></Link><Link to="/terms"><span>03</span><b>Terms & Conditions</b><i>↗</i></Link><Link to="/policies/rules"><span>04</span><b>Platform Rules</b><i>↗</i></Link></div></section>

      <footer className="v2-footer"><Link className="public-brand" to="/"><span className="public-brand__mark">CF</span><span className="v2-brand-copy"><strong>CampusFix</strong><small>Campus operations, connected.</small></span></Link><span className="v2-footer-copy">A connected approach to campus service management.</span><div className="v2-footer-links"><Link to="/policies">Policies</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/policies/rules">Rules</Link></div><small>V2.0.4 · © 2026 CampusFix</small></footer>
    </main>
  );
}
