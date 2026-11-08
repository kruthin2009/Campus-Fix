import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { subscribeToAllReports } from "../../services/reportService";
import { listAllTowers } from "../../services/towerService";
import { isAdministrativeRole, type Report, type Tower } from "../../types/models";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

function isActive(report: Report) {
  return !["completed", "closed", "rejected"].includes(report.status);
}

export function AdminCampusIntelligencePage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [selectedTower, setSelectedTower] = useState<string>("all");
  const [roomQuery, setRoomQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [loadingTowers, setLoadingTowers] = useState(true);

  useEffect(() => subscribeToAllReports(setReports, () => showToast("Unable to load campus complaint data.", "error")), [showToast]);
  useEffect(() => {
    listAllTowers().then(setTowers).catch(() => showToast("Unable to load tower list.", "error")).finally(() => setLoadingTowers(false));
  }, [showToast]);

  const activeTowers = useMemo(() => towers.filter((tower) => tower.isActive).sort((a, b) => a.number - b.number), [towers]);
  const departments = useMemo(() => [...new Set(reports.map((report) => report.departmentName).filter(Boolean))].sort(), [reports]);
  const counts = useMemo(() => {
    const map = new Map<string, { total: number; active: number; urgent: number }>();
    reports.forEach((report) => {
      const current = map.get(report.towerId) ?? { total: 0, active: 0, urgent: 0 };
      current.total += 1;
      if (isActive(report)) current.active += 1;
      if (isActive(report) && report.priority === "urgent") current.urgent += 1;
      map.set(report.towerId, current);
    });
    return map;
  }, [reports]);
  const filteredReports = useMemo(() => reports.filter((report) =>
    (selectedTower === "all" || report.towerId === selectedTower) &&
    (department === "all" || report.departmentName === department) &&
    (!roomQuery.trim() || report.roomNumber.toLowerCase().includes(roomQuery.trim().toLowerCase()))
  ), [reports, selectedTower, department, roomQuery]);
  const roomGroups = useMemo(() => {
    const grouped = new Map<string, Report[]>();
    filteredReports.forEach((report) => {
      const key = `${report.towerName} · ${report.roomNumber || "Room not specified"}`;
      grouped.set(key, [...(grouped.get(key) ?? []), report]);
    });
    return [...grouped.entries()].sort((a, b) => b[1].filter(isActive).length - a[1].filter(isActive).length);
  }, [filteredReports]);
  const maxActive = Math.max(1, ...activeTowers.map((tower) => counts.get(tower.id)?.active ?? 0));

  if (!isAdministrativeRole(profile?.role)) return null;

  return <main className="campus-intelligence">
    <header className="page-header"><div><p className="public-kicker">CAMPUSFIX · V1.16</p><h1>Campus Intelligence</h1><p>Explore complaint activity across registered towers, rooms and departments.</p></div><span className="smart-live">● LIVE DATA</span></header>
    <section className="campus-intel-summary">
      <article><span>REGISTERED TOWERS</span><strong>{activeTowers.length}</strong></article>
      <article><span>COMPLAINT RECORDS</span><strong>{reports.length}</strong></article>
      <article><span>ACTIVE REQUESTS</span><strong>{reports.filter(isActive).length}</strong></article>
      <article><span>ROOMS WITH REPORTS</span><strong>{new Set(reports.map((r) => `${r.towerId}:${r.roomNumber}`).filter((v) => !v.endsWith(":"))).size}</strong></article>
    </section>

    <section className="smart-panel">
      <div className="smart-panel-title"><div><p className="public-kicker">TOWER OVERVIEW</p><h2>Campus tower activity</h2><p className="smart-note">Schematic overview, not a geographic campus map. Tower positions are illustrative because verified campus coordinates/layout data are not stored in CampusFix.</p></div><span>SELECT A TOWER</span></div>
      {loadingTowers ? <p>Loading towers…</p> : activeTowers.length === 0 ? <p className="smart-note">No active towers are configured yet.</p> : <div className="campus-tower-grid">
        <button className={`campus-tower-tile campus-tower-all ${selectedTower === "all" ? "selected" : ""}`} onClick={() => setSelectedTower("all")}><span>ALL TOWERS</span><strong>{reports.length}</strong><small>{reports.filter(isActive).length} active complaints</small></button>
        {activeTowers.map((tower) => {
          const stat = counts.get(tower.id) ?? { total: 0, active: 0, urgent: 0 };
          const level = stat.active === 0 ? "quiet" : stat.active / maxActive >= .75 ? "busy" : "moderate";
          return <button key={tower.id} className={`campus-tower-tile ${level} ${selectedTower === tower.id ? "selected" : ""}`} onClick={() => setSelectedTower(tower.id)} aria-pressed={selectedTower === tower.id}>
            <span>TOWER {tower.number || "—"}</span><strong>{tower.name}</strong><small>{stat.total} total · {stat.active} active</small>{stat.urgent > 0 && <em>{stat.urgent} urgent</em>}
          </button>;
        })}
      </div>}
    </section>

    <section className="smart-panel">
      <div className="smart-panel-title"><div><p className="public-kicker">ROOM & DEPARTMENT EXPLORER</p><h2>Complaint hotspots</h2><p className="smart-note">Hotspots are calculated from recorded complaint room numbers; missing room details are not guessed.</p></div><span>{filteredReports.length} MATCHING REPORTS</span></div>
      <div className="campus-intel-filters">
        <label>Search room<input className="form-input" value={roomQuery} onChange={(e) => setRoomQuery(e.target.value)} placeholder="e.g. 204, A-12" /></label>
        <label>Department<select className="form-input" value={department} onChange={(e) => setDepartment(e.target.value)}><option value="all">All departments</option>{departments.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <button className="btn btn--secondary" onClick={() => { setSelectedTower("all"); setRoomQuery(""); setDepartment("all"); }}>Clear filters</button>
      </div>
      {roomGroups.length === 0 ? <p className="smart-note">No complaints match these filters.</p> : <div className="campus-room-list">{roomGroups.map(([label, items]) => {
        const active = items.filter(isActive).length;
        return <article className="campus-room-card" key={label}><div><strong>{label}</strong><span>{items.length} reports · {active} active</span></div><div className="campus-room-reports">{items.slice(0, 5).map((report) => <Link key={report.id} to={`/admin/complaints/${report.id}`}><span>{report.title}</span><small>{report.departmentName} · {report.status} · {report.priority}</small></Link>)}{items.length > 5 && <small>+{items.length - 5} more reports in this room</small>}</div></article>;
      })}</div>}
    </section>
    <p className="campus-intel-footnote">Floor-level mapping, room coordinates, interactive geographic maps and maintenance-history overlays require verified floor/room location metadata. This version uses existing tower and room fields only.</p>
  </main>;
}
