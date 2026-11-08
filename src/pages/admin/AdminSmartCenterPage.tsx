import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { subscribeToAllReports } from "../../services/reportService";
import { classifyComplaint, findPotentialDuplicates, getPredictiveInsights, getPredictiveMaintenanceInsights } from "../../services/smartService";
import { askCampusFixAssistant, suggestComplaintClassification, suggestWorkerTeam, type AiClassification } from "../../services/aiService";
import { listActiveTeams } from "../../services/teamService";
import { isAdministrativeRole, type Report, type WorkerTeam } from "../../types/models";

export function AdminSmartCenterPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [teams, setTeams] = useState<WorkerTeam[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  const [aiClassification, setAiClassification] = useState<AiClassification | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assignmentDepartment, setAssignmentDepartment] = useState("");
  const [assignmentSuggestion, setAssignmentSuggestion] = useState<{ teamName: string; reason: string; confidence: number } | null>(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  useEffect(() => subscribeToAllReports(setReports, () => showToast("Unable to load live complaint data.", "error")), [showToast]);
  useEffect(() => { listActiveTeams().then(setTeams).catch(() => showToast("Unable to load worker teams.", "error")); }, [showToast]);

  const prediction = useMemo(() => getPredictiveInsights(reports), [reports]);
  const maintenance = useMemo(() => getPredictiveMaintenanceInsights(reports), [reports]);
  const fallbackClassification = useMemo(() => classifyComplaint(title, description), [title, description]);
  const duplicates = useMemo(() => selected ? findPotentialDuplicates(selected, reports) : [], [selected, reports]);
  const qrBase = `${window.location.origin}/login?role=student`;
  const departments = [...new Set(teams.map((team) => team.departmentName).filter(Boolean))];
  const activeWorkload = useMemo(() => reports.reduce<Record<string, number>>((acc, report) => {
    if (report.assignedTeamId && !["completed", "closed", "rejected"].includes(report.status)) acc[report.assignedTeamId] = (acc[report.assignedTeamId] || 0) + 1;
    return acc;
  }, {}), [reports]);

  if (!isAdministrativeRole(profile?.role)) return null;

  async function runAiClassification() {
    setAiLoading(true); setAiError(""); setAiClassification(null);
    try {
      const activeDepartments = [...new Set(teams.map((team) => team.departmentName).filter(Boolean))];
      if (!activeDepartments.length) throw new Error("Create active worker teams before using AI classification.");
      setAiClassification(await suggestComplaintClassification({ title, description, departments: activeDepartments }));
    } catch (error) { setAiError(error instanceof Error ? error.message : "AI classification failed."); }
    finally { setAiLoading(false); }
  }

  async function runAssistant() {
    setAssistantLoading(true); setAssistantAnswer("");
    try { setAssistantAnswer(await askCampusFixAssistant(assistantQuestion, "CampusFix supports student complaint submission and tracking, worker assignment and progress updates, and administrator management of towers, departments, teams and complaints. Do not claim access to records unless included in the question.")); }
    catch (error) { showToast(error instanceof Error ? error.message : "Assistant unavailable.", "error"); }
    finally { setAssistantLoading(false); }
  }

  async function runAssignmentSuggestion() {
    setAssignmentLoading(true); setAssignmentSuggestion(null);
    try {
      const matchingTeams = teams.filter((team) => team.departmentName === assignmentDepartment && team.isActive);
      const suggestion = await suggestWorkerTeam({ department: assignmentDepartment, teams: matchingTeams, activeWorkload });
      const team = matchingTeams.find((item) => item.id === suggestion.teamId);
      if (!team) throw new Error("No valid team recommendation was returned.");
      setAssignmentSuggestion({ teamName: team.name, reason: suggestion.reason, confidence: suggestion.confidence });
    } catch (error) { showToast(error instanceof Error ? error.message : "Assignment suggestion failed.", "error"); }
    finally { setAssignmentLoading(false); }
  }

  return <div className="smart-center">
    <div className="page-header"><div><p className="public-kicker">CAMPUSFIX · ADMIN TOOLS</p><h1>Operations overview</h1><p>Live operational signals and optional AI assistance. Recommendations never make assignments or change complaint records automatically.</p></div><span className="smart-live">● LIVE DATA</span></div>
    <section className="smart-grid">
      <article className="smart-card"><span>OPEN REQUESTS</span><strong>{prediction.pending}</strong><small>requests still being handled</small></article>
      <article className="smart-card"><span>NEEDS ATTENTION</span><strong>{prediction.urgent}</strong><small>urgent requests still open</small></article>
      <article className="smart-card"><span>BUSIEST LOCATION</span><strong>{prediction.towerHotspot?.[0] ?? "—"}</strong><small>{prediction.towerHotspot?.[1] ?? 0} complaints</small></article>
      <article className="smart-card"><span>MOST COMMON AREA</span><strong>{prediction.categoryHotspot?.[0] ?? "—"}</strong><small>{prediction.categoryHotspot?.[1] ?? 0} complaints</small></article>
    </section>
    <section className="smart-two-col">
      <article className="smart-panel"><p className="public-kicker">AI COMPLAINT REVIEW</p><h2>Suggest category and priority</h2>
        <input className="form-input" placeholder="Complaint title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="form-input" rows={4} placeholder="Describe the issue..." value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="btn btn--primary" disabled={aiLoading || !title.trim() || !description.trim()} onClick={runAiClassification}>{aiLoading ? "Analysing..." : "Get AI recommendation"}</button>
        {aiClassification ? <div className="ai-suggestion-result"><strong>{aiClassification.category}</strong><span>Priority: {aiClassification.priority} · Confidence: {aiClassification.confidence}%</span><small>{aiClassification.reason}</small>{aiClassification.safetyFlag && <small className="ai-safety-note">Possible safety concern. Escalate through campus safety procedures.</small>}</div> : <div className="smart-result"><b>{fallbackClassification.category}</b><span>Rule-based fallback: {fallbackClassification.priority}</span><span>{fallbackClassification.departmentHint}</span><small>Local keyword rules only; not an AI result.</small></div>}
        {aiError && <p className="form-error" role="alert">{aiError}</p>}
      </article>
      <article className="smart-panel"><p className="public-kicker">AI TEAM SUGGESTION</p><h2>Recommend a worker team</h2>
        <label className="field"><span>Department</span><select className="form-input" value={assignmentDepartment} onChange={(e) => { setAssignmentDepartment(e.target.value); setAssignmentSuggestion(null); }}><option value="">Choose a department</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></label>
        <button className="btn btn--primary" disabled={assignmentLoading || !assignmentDepartment || !teams.some((team) => team.departmentName === assignmentDepartment)} onClick={runAssignmentSuggestion}>{assignmentLoading ? "Checking teams..." : "Suggest team"}</button>
        {assignmentSuggestion && <div className="ai-suggestion-result"><strong>{assignmentSuggestion.teamName}</strong><span>Confidence: {assignmentSuggestion.confidence}%</span><small>{assignmentSuggestion.reason}</small></div>}
        <p className="smart-note">Uses department fit and active assigned workload. An administrator must make the actual assignment.</p>
      </article>
    </section>
    <section className="smart-panel"><p className="public-kicker">CAMPUSFIX AI ASSISTANT</p><h2>Ask about CampusFix</h2><textarea className="form-input" rows={3} maxLength={1200} placeholder="How do students track a complaint? What does a worker do after assignment?" value={assistantQuestion} onChange={(e) => setAssistantQuestion(e.target.value)} /><button className="btn btn--primary" disabled={assistantLoading || !assistantQuestion.trim()} onClick={runAssistant}>{assistantLoading ? "Thinking..." : "Ask assistant"}</button>{assistantAnswer && <div className="ai-assistant-answer" role="status">{assistantAnswer}</div>}<p className="smart-note">The assistant answers from general CampusFix workflow information supplied here. It does not read private complaint records.</p></section>
    <section className="smart-panel"><div className="smart-panel-title"><div><p className="public-kicker">RELATED REQUESTS</p><h2>Requests that may be related</h2></div><span>{reports.length} live reports</span></div><p className="smart-note">This is existing local text-similarity matching, not an AI-generated duplicate decision.</p><div className="smart-report-list">{reports.slice(0, 12).map((report) => <button className={`smart-report ${selected?.id === report.id ? "is-selected" : ""}`} key={report.id} onClick={() => setSelected(report)}><span>{report.towerName}</span><strong>{report.title}</strong><small>{report.departmentName} · {report.status}</small></button>)}</div>{selected && <div className="duplicate-box"><b>Possible duplicates for: {selected.title}</b>{duplicates.length ? duplicates.map((item) => <div key={item.report.id}><span>{item.score}% match</span> {item.report.title} — {item.report.towerName}</div>) : <p>No strong duplicate candidates found.</p>}</div>}</section>
    <section className="smart-panel"><p className="public-kicker">QR REPORTING</p><h2>Make reporting easier</h2><p>Copy the student entry link and turn it into a QR code for the location where you want to place it.</p><div className="qr-preview"><div className="qr-grid">{Array.from({ length: 81 }, (_, i) => <i key={i} className={(i * 17 + i * i) % 7 < 3 ? "on" : ""} />)}</div><div><b>CampusFix Student Entry</b><small>{qrBase}</small><button className="btn btn--primary" onClick={() => { navigator.clipboard?.writeText(qrBase); showToast("Student reporting link copied.", "success"); }}>Copy reporting link</button></div></div></section>
    <section className="smart-panel"><p className="public-kicker">RECURRING ISSUES</p><h2>Issues worth keeping an eye on</h2><div className="insight-list"><div>🏢 <b>{prediction.towerHotspot?.[0] ?? "No hotspot yet"}</b><span> has the most requests overall</span></div><div>🛠️ <b>{prediction.categoryHotspot?.[0] ?? "No category yet"}</b><span> comes up most often</span></div><div>⚠️ <b>{prediction.urgent}</b><span> urgent requests still open</span></div></div></section>
    <section className="smart-panel maintenance-panel"><div className="smart-panel-title"><div><p className="public-kicker">V1.15 · PREDICTIVE MAINTENANCE</p><h2>Maintenance risk signals</h2><p className="smart-note">Historical trend analysis from complaint records. These are inspection signals, not guaranteed predictions of equipment failure.</p></div><span>{maintenance.dataWindowDays}-DAY COMPARISON</span></div>
      <div className="maintenance-metrics"><div><small>Last 30 days</small><strong>{maintenance.recentCount}</strong></div><div><small>Previous 30 days</small><strong>{maintenance.previousCount}</strong></div><div><small>Change</small><strong>{maintenance.changePercent === null ? "New baseline" : `${maintenance.changePercent > 0 ? "+" : ""}${maintenance.changePercent}%`}</strong></div><div><small>Data confidence</small><strong>{maintenance.dataQuality === "usable" ? "Usable" : "Limited"}</strong></div></div>
      {maintenance.dataQuality === "limited" && <p className="smart-note">Limited history: collect more dated complaint records before relying on trend comparisons.</p>}
      <h3>Recurring location and department patterns</h3>
      {maintenance.recurring.length ? <div className="maintenance-list">{maintenance.recurring.map(signal => <article className="maintenance-item" key={signal.key}><div><strong>{signal.towerName} · {signal.roomNumber}</strong><span>{signal.departmentName}</span></div><b className={signal.level === "elevated" ? "risk-elevated" : "risk-watch"}>{signal.level === "elevated" ? "Elevated" : "Watch"}</b><p>{signal.reason}</p><small>Suggested action: {signal.recommendation}</small></article>)}</div> : <p className="smart-note">No repeated tower/department/room pattern found in the last 90 days of available history.</p>}
      <h3>Tower complaint trend</h3><div className="maintenance-list">{maintenance.towerTrend.map(t => <div className="maintenance-trend" key={t.towerName}><strong>{t.towerName}</strong><span>Last 30 days: {t.recent} · Previous 30 days: {t.previous}</span><b>{t.change === null ? (t.recent ? "New activity" : "—") : `${t.change > 0 ? "+" : ""}${t.change}%`}</b></div>)}</div>
    </section>
  </div>;
}
