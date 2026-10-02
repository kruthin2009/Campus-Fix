import { addDoc, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { typedCollection } from "../firebase/firestore";
import { toAppError } from "../utils/errors";

export interface Announcement { id:string; title:string; message:string; audience:"all"|"students"|"workers"|"tower"; towerId?:string|null; startsAt:any; expiresAt?:any|null; isActive:boolean; createdBy:string; createdByName:string; createdAt:any; }
export interface MaintenanceItem { id:string; title:string; location:string; towerId?:string|null; departmentId?:string|null; frequency:"weekly"|"monthly"|"quarterly"|"half_yearly"|"yearly"; nextDue:any; assignedWorkerId?:string|null; assignedWorkerName?:string|null; isActive:boolean; notes?:string; createdAt:any; updatedAt:any; }
export interface AuditEntry { id:string; actorId:string; actorName:string; actorRole:string; action:string; targetType:string; targetId?:string|null; summary:string; createdAt:any; }

export async function createAnnouncement(input: Omit<Announcement,"id"|"createdAt">){
  try { const ref=await addDoc(typedCollection<Announcement>("announcements"),{...input,createdAt:serverTimestamp()}); return ref.id; }
  catch(e){throw toAppError(e,"Unable to publish announcement.");}
}
export async function listAnnouncements(){
  try { const s=await getDocs(typedCollection<Announcement>("announcements")); return s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>(b.createdAt?.toMillis?.()??0)-(a.createdAt?.toMillis?.()??0)); }
  catch(e){throw toAppError(e,"Unable to load announcements.");}
}
export async function deleteAnnouncement(id:string){ try{await deleteDoc(doc(db,"announcements",id));}catch(e){throw toAppError(e,"Unable to delete announcement.");} }

export async function createMaintenance(input: Omit<MaintenanceItem,"id"|"createdAt"|"updatedAt">){
  try{const ref=await addDoc(typedCollection<MaintenanceItem>("maintenanceSchedules"),{...input,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});return ref.id;}catch(e){throw toAppError(e,"Unable to create maintenance schedule.");}
}
export async function listMaintenance(){try{const s=await getDocs(typedCollection<MaintenanceItem>("maintenanceSchedules"));return s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>(a.nextDue?.toMillis?.()??0)-(b.nextDue?.toMillis?.()??0));}catch(e){throw toAppError(e,"Unable to load maintenance schedules.");}}
export async function completeMaintenance(id:string,nextDue:Date){try{await updateDoc(doc(db,"maintenanceSchedules",id),{nextDue,isActive:true,updatedAt:serverTimestamp()});}catch(e){throw toAppError(e,"Unable to update maintenance schedule.");}}

export async function writeAudit(input: Omit<AuditEntry,"id"|"createdAt">){try{await addDoc(typedCollection<AuditEntry>("auditLogs"),{...input,createdAt:serverTimestamp()});}catch(e){console.warn("Audit log unavailable",e);}}
export async function listAuditLogs(){try{const s=await getDocs(typedCollection<AuditEntry>("auditLogs"));return s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>(b.createdAt?.toMillis?.()??0)-(a.createdAt?.toMillis?.()??0)).slice(0,200);}catch(e){throw toAppError(e,"Unable to load audit logs.");}}

export function exportCsv(filename:string, rows:Record<string,unknown>[]){
  const keys=Array.from(new Set(rows.flatMap(r=>Object.keys(r))));
  const esc=(v:unknown)=>`"${String(v??"").replaceAll('"','""')}"`;
  const csv=[keys.map(esc).join(","),...rows.map(r=>keys.map(k=>esc(r[k])).join(","))].join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
