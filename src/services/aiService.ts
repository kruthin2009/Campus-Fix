import { auth } from "../firebase/config";
import type { ReportPriority, WorkerTeam } from "../types/models";

export interface AiClassification {
  category: string;
  priority: ReportPriority;
  confidence: number;
  reason: string;
  safetyFlag: boolean;
}
export interface AiAssignmentSuggestion {
  teamId: string;
  reason: string;
  confidence: number;
}

async function callAi<T>(payload: Record<string, unknown>): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in to use CampusFix AI.");
  const token = await user.getIdToken();
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json() as { error?: string } & T;
  if (!response.ok) throw new Error(data.error || "AI request failed.");
  return data;
}

export async function suggestComplaintClassification(input: {
  title: string; description: string; departments: string[];
}): Promise<AiClassification> {
  const data = await callAi<{ result: AiClassification }>({ action: "classify", ...input });
  const result = data.result;
  if (!result || !input.departments.includes(result.category) || !["low", "medium", "high", "urgent"].includes(result.priority)) {
    throw new Error("AI returned an invalid suggestion. Please choose manually.");
  }
  return result;
}

export async function askCampusFixAssistant(question: string, context = ""): Promise<string> {
  const data = await callAi<{ answer: string }>({ action: "assistant", question, context });
  return data.answer;
}

export async function suggestWorkerTeam(input: {
  department: string; teams: WorkerTeam[]; activeWorkload: Record<string, number>;
}): Promise<AiAssignmentSuggestion> {
  const data = await callAi<{ result: AiAssignmentSuggestion }>({
    action: "assignment", department: input.department,
    teams: input.teams.map(team => ({ id: team.id, name: team.name, department: team.departmentName, active: team.isActive, activeWorkload: input.activeWorkload[team.id] || 0 })),
  });
  if (!input.teams.some(team => team.id === data.result?.teamId)) throw new Error("AI returned an unknown team. Please assign manually.");
  return data.result;
}
