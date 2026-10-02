import type { Report, ReportPriority, ReportStatus } from "../types/models";

export interface SmartClassification {
  category: string;
  priority: ReportPriority;
  departmentHint: string;
  confidence: number;
  reasons: string[];
}

const rules: Array<{category:string; words:string[]; department:string; priority?:ReportPriority}> = [
  {category:"Plumbing", words:["water","leak","tap","pipe","toilet","drain","flush","shower"], department:"Plumbing"},
  {category:"Electrical", words:["light","fan","socket","switch","power","electric","spark","ac","air conditioner"], department:"Electrical"},
  {category:"Wi‑Fi / Network", words:["wifi","wi-fi","internet","network","router","ethernet","signal"], department:"IT / Network"},
  {category:"Cleaning", words:["dirty","clean","garbage","trash","dust","washroom","waste","smell"], department:"Housekeeping"},
  {category:"Carpentry / Furniture", words:["chair","table","desk","door","window","bed","cupboard","wood"], department:"Carpentry"},
];

export function classifyComplaint(title: string, description: string): SmartClassification {
  const text = `${title} ${description}`.toLowerCase();
  const matched = rules.map(r => ({...r, hits:r.words.filter(w => text.includes(w))})).filter(r => r.hits.length);
  const best = matched.sort((a,b)=>b.hits.length-a.hits.length)[0];
  const urgent = /fire|smoke|shock|spark|flood|burst|danger|unsafe|emergency/i.test(text);
  const priority: ReportPriority = urgent ? "urgent" : best && best.hits.length >= 2 ? "high" : best ? "medium" : "low";
  if (!best) return {category:"General Maintenance", priority, departmentHint:"General Maintenance", confidence:55, reasons:["No strong category keyword matched; admin review recommended."]};
  return {category:best.category, priority, departmentHint:best.department, confidence:Math.min(96, 62 + best.hits.length*10), reasons:[`Matched: ${best.hits.join(", ")}`, ...(urgent?["Safety-sensitive keyword detected."]:[])]};
}

export function findPotentialDuplicates(candidate: Report, reports: Report[]): Array<{report:Report; score:number}> {
  const a = `${candidate.title} ${candidate.description} ${candidate.towerName} ${candidate.departmentName}`.toLowerCase();
  const tokens = new Set(a.split(/[^a-z0-9]+/).filter(x=>x.length>3));
  return reports.filter(r=>r.id!==candidate.id && r.towerId===candidate.towerId && r.status!=="closed" && r.status!=="rejected")
    .map(report=>{
      const b = `${report.title} ${report.description} ${report.towerName} ${report.departmentName}`.toLowerCase();
      const bt = new Set(b.split(/[^a-z0-9]+/).filter(x=>x.length>3));
      const overlap = [...tokens].filter(t=>bt.has(t)).length;
      const score = Math.round((overlap / Math.max(1, Math.min(tokens.size, bt.size))) * 100);
      return {report, score};
    }).filter(x=>x.score>=35).sort((a,b)=>b.score-a.score).slice(0,5);
}

export function getPredictiveInsights(reports: Report[]) {
  const byTower = new Map<string, number>();
  const byCategory = new Map<string, number>();
  reports.forEach(r=>{byTower.set(r.towerName,(byTower.get(r.towerName)||0)+1); byCategory.set(r.departmentName,(byCategory.get(r.departmentName)||0)+1);});
  const towerHotspot = [...byTower.entries()].sort((a,b)=>b[1]-a[1])[0];
  const categoryHotspot = [...byCategory.entries()].sort((a,b)=>b[1]-a[1])[0];
  const pending = reports.filter(r=>!["completed","closed","rejected"].includes(r.status)).length;
  const urgent = reports.filter(r=>r.priority==="urgent" && !["completed","closed","rejected"].includes(r.status)).length;
  return {towerHotspot, categoryHotspot, pending, urgent};
}

export function statusLabel(status: ReportStatus) { return status.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase()); }
