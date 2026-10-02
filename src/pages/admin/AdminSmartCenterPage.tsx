import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useEffect } from "react";
import { subscribeToAllReports } from "../../services/reportService";
import { classifyComplaint, findPotentialDuplicates, getPredictiveInsights } from "../../services/smartService";
import { isAdministrativeRole, type Report } from "../../types/models";

export function AdminSmartCenterPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [reports,setReports]=useState<Report[]>([]);
  const [title,setTitle]=useState(""); const [description,setDescription]=useState("");
  const [selected,setSelected]=useState<Report|null>(null);
  useEffect(()=>subscribeToAllReports(setReports,()=>showToast("Unable to load live complaint data.","error")),[showToast]);
  const prediction=useMemo(()=>getPredictiveInsights(reports),[reports]);
  const classification=useMemo(()=>classifyComplaint(title,description),[title,description]);
  const duplicates=useMemo(()=>selected?findPotentialDuplicates(selected,reports):[],[selected,reports]);
  const qrBase=`${window.location.origin}/login?role=student`;
  if(!isAdministrativeRole(profile?.role)) return null;
  return <div className="smart-center">
    <div className="page-header"><div><p className="public-kicker">CAMPUSFIX · ADMIN TOOLS</p><h1>Operations overview</h1><p>A practical view of current complaints, recurring issues and the tools your team can use to handle them.</p></div><span className="smart-live">● LIVE DATA</span></div>
    <section className="smart-grid">
      <article className="smart-card"><span>OPEN REQUESTS</span><strong>{prediction.pending}</strong><small>requests still being handled</small></article>
      <article className="smart-card"><span>NEEDS ATTENTION</span><strong>{prediction.urgent}</strong><small>high-priority requests still open</small></article>
      <article className="smart-card"><span>BUSIEST LOCATION</span><strong>{prediction.towerHotspot?.[0]??"—"}</strong><small>{prediction.towerHotspot?.[1]??0} complaints</small></article>
      <article className="smart-card"><span>MOST COMMON AREA</span><strong>{prediction.categoryHotspot?.[0]??"—"}</strong><small>{prediction.categoryHotspot?.[1]??0} complaints</small></article>
    </section>
    <section className="smart-two-col">
      <article className="smart-panel"><div className="smart-panel-title"><div><p className="public-kicker">QUICK CHECK</p><h2>Check a complaint</h2></div></div>
        <input className="form-input" placeholder="Complaint title" value={title} onChange={e=>setTitle(e.target.value)}/>
        <textarea className="form-input" rows={5} placeholder="Describe the issue..." value={description} onChange={e=>setDescription(e.target.value)}/>
        <div className="smart-result"><b>{classification.category}</b><span>Priority: {classification.priority}</span><span>{classification.departmentHint}</span><span>{classification.confidence}% confidence</span>{classification.reasons.map(x=><small key={x}>{x}</small>)}</div>
        <p className="smart-note">This check runs in the browser using simple rules. It is only a suggestion — the admin can always change the category or priority.</p>
      </article>
      <article className="smart-panel"><p className="public-kicker">QR REPORTING</p><h2>Make reporting easier</h2><p>Put a QR code near a room, tower or common area so students can open the reporting page without searching for it.</p><div className="qr-preview"><div className="qr-grid">{Array.from({length:81},(_,i)=><i key={i} className={(i*17+i*i)%7<3?"on":""}/>)}</div><div><b>CampusFix Student Entry</b><small>{qrBase}</small><button className="btn btn--primary" onClick={()=>{navigator.clipboard?.writeText(qrBase);showToast("Student reporting link copied.","success")}}>Copy reporting link</button></div></div><p className="smart-note">Copy the link and turn it into a QR code for the location where you want to place it.</p></article>
    </section>
    <section className="smart-panel"><div className="smart-panel-title"><div><p className="public-kicker">RELATED REQUESTS</p><h2>Requests that may be related</h2></div><span>{reports.length} live reports</span></div><div className="smart-report-list">{reports.slice(0,12).map(r=><button className={`smart-report ${selected?.id===r.id?"is-selected":""}`} key={r.id} onClick={()=>setSelected(r)}><span>{r.towerName}</span><strong>{r.title}</strong><small>{r.departmentName} · {r.status}</small></button>)}</div>{selected&&<div className="duplicate-box"><b>Possible duplicates for: {selected.title}</b>{duplicates.length?duplicates.map(x=><div key={x.report.id}><span>{x.score}% match</span> {x.report.title} — {x.report.towerName}</div>):<p>No strong duplicate candidates found.</p>}</div>}</section>
    <section className="smart-panel"><p className="public-kicker">RECURRING ISSUES</p><h2>Issues worth keeping an eye on</h2><p>These numbers are based on the complaints already in CampusFix. They can help the admin notice locations or maintenance areas that keep coming up.</p><div className="insight-list"><div>🏢 <b>{prediction.towerHotspot?.[0]??"No hotspot yet"}</b><span> has the most requests</span></div><div>🛠️ <b>{prediction.categoryHotspot?.[0]??"No category yet"}</b><span> comes up most often</span></div><div>⚠️ <b>{prediction.urgent}</b><span> high-priority requests still open</span></div></div></section>
  </div>;
}
