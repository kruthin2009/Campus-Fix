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


export interface MaintenanceRiskSignal {
  key: string;
  towerName: string;
  departmentName: string;
  roomNumber: string;
  occurrences: number;
  openCount: number;
  latestAt: number;
  reason: string;
  recommendation: string;
  level: "watch" | "elevated";
}

export interface PredictiveMaintenanceInsights {
  recentCount: number;
  previousCount: number;
  changePercent: number | null;
  recurring: MaintenanceRiskSignal[];
  towerTrend: Array<{ towerName: string; recent: number; previous: number; change: number | null }>;
  dataWindowDays: number;
  dataQuality: "limited" | "usable";
}

function timestampMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as {toMillis?: unknown}).toMillis === "function") {
    return (value as {toMillis: () => number}).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  return 0;
}

/**
 * Evidence-based maintenance risk signals from complaint history.
 * This is trend analysis, not a machine-learning forecast or a guarantee of failure.
 */
export function getPredictiveMaintenanceInsights(
  reports: Report[], now = Date.now(), windowDays = 30,
): PredictiveMaintenanceInsights {
  const day = 24 * 60 * 60 * 1000;
  const currentStart = now - windowDays * day;
  const previousStart = now - 2 * windowDays * day;
  const dated = reports.map(report => ({ report, created: timestampMillis(report.createdAt) })).filter(x => x.created > 0);
  const recent = dated.filter(x => x.created >= currentStart);
  const previous = dated.filter(x => x.created >= previousStart && x.created < currentStart);
  const changePercent = previous.length === 0 ? (recent.length ? null : 0) : Math.round(((recent.length - previous.length) / previous.length) * 100);

  const buckets = new Map<string, { towerName: string; departmentName: string; roomNumber: string; reports: typeof dated }>();
  for (const item of dated.filter(x => x.created >= now - 90 * day)) {
    const r = item.report;
    const room = (r.roomNumber || "Unspecified room").trim();
    const key = `${r.towerId}|${r.departmentId}|${room.toLowerCase()}`;
    const bucket = buckets.get(key) ?? { towerName: r.towerName || "Unknown tower", departmentName: r.departmentName || "General", roomNumber: room, reports: [] };
    bucket.reports.push(item);
    buckets.set(key, bucket);
  }
  const recurring = [...buckets.entries()].filter(([, b]) => b.reports.length >= 2).map(([key, b]) => {
    const openCount = b.reports.filter(x => !["completed", "closed", "rejected"].includes(x.report.status)).length;
    const occurrences = b.reports.length;
    const level = occurrences >= 4 || openCount >= 2 ? "elevated" as const : "watch" as const;
    return {
      key, towerName: b.towerName, departmentName: b.departmentName, roomNumber: b.roomNumber,
      occurrences, openCount, latestAt: Math.max(...b.reports.map(x => x.created)), level,
      reason: `${occurrences} complaints in this tower, department and room over the last 90 days${openCount ? `; ${openCount} remain active` : ""}.`,
      recommendation: level === "elevated" ? "Schedule an on-site inspection and investigate the underlying cause before closing further requests." : "Include this location in the next routine maintenance inspection.",
    };
  }).sort((a,b) => b.occurrences - a.occurrences || b.openCount - a.openCount).slice(0, 8);

  const towerNames = new Set(dated.map(x => x.report.towerName || "Unknown tower"));
  const towerTrend = [...towerNames].map(towerName => {
    const r = recent.filter(x => x.report.towerName === towerName).length;
    const p = previous.filter(x => x.report.towerName === towerName).length;
    return { towerName, recent: r, previous: p, change: p === 0 ? (r ? null : 0) : Math.round(((r-p)/p)*100) };
  }).sort((a,b) => b.recent-a.recent).slice(0, 5);

  return { recentCount: recent.length, previousCount: previous.length, changePercent, recurring, towerTrend, dataWindowDays: windowDays, dataQuality: dated.length >= 10 ? "usable" : "limited" };
}

export function statusLabel(status: ReportStatus) { return status.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase()); }
