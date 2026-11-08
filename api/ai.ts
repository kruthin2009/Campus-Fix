// Vercel serverless endpoint for CampusFix AI features.
// Required server-side environment variables: OpenAI server credential and Firebase Web API key.
// Never expose the OpenAI credential through a VITE_ variable.
type ApiRequest = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown };
type ApiResponse = { status: (code: number) => ApiResponse; json: (value: unknown) => void; setHeader: (name: string, value: string) => void };

type AiAction = "classify" | "assistant" | "assignment";

// Best-effort per-instance throttling. For a multi-instance production deployment,
// replace this with a shared rate limiter (for example, Upstash Redis).
const requestWindows = new Map<string, { startedAt: number; count: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 20;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env["OPENAI" + "_API_KEY"];
  const firebaseWebKey = process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey || !firebaseWebKey) return res.status(503).json({ error: "AI service is not configured. Ask the CampusFix administrator to configure server environment variables." });

  const authorization = req.headers.authorization;
  const token = typeof authorization === "string" && authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || token.length > 5000) return res.status(401).json({ error: "Sign in to use CampusFix AI." });

  try {
    const verifyResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseWebKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }),
    });
    if (!verifyResponse.ok) return res.status(401).json({ error: "Your session could not be verified. Sign in again." });
    const identity = await verifyResponse.json() as { users?: Array<{ localId?: string; disabled?: boolean }> };
    const uid = identity.users?.[0]?.localId;
    if (!uid || identity.users?.[0]?.disabled) return res.status(401).json({ error: "Your account is not available." });

    const now = Date.now();
    const window = requestWindows.get(uid);
    if (!window || now - window.startedAt >= RATE_WINDOW_MS) requestWindows.set(uid, { startedAt: now, count: 1 });
    else if (window.count >= RATE_LIMIT) return res.status(429).json({ error: "AI usage limit reached. Please wait a minute and try again." });
    else window.count += 1;

    const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>;
    const action = body.action as AiAction;
    if (action === "assignment") {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
      if (!projectId) return res.status(503).json({ error: "Firebase project verification is not configured." });
      const profileResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileResponse.ok) return res.status(403).json({ error: "Only CampusFix administrators can request team recommendations." });
      const profileDoc = await profileResponse.json() as { fields?: { role?: { stringValue?: string } } };
      const role = profileDoc.fields?.role?.stringValue;
      if (!["admin", "administrative", "administrator"].includes(role || "")) return res.status(403).json({ error: "Only CampusFix administrators can request team recommendations." });
    }
    let system = "You are CampusFix AI, an assistant for a university campus maintenance reporting platform. Be concise, factual, and safe. Never claim to have accessed live records unless they are provided in the request. Do not request passwords, OTPs, or sensitive personal information. For immediate danger such as fire, electrical shock, gas smell, or structural risk, tell the user to move away and contact campus security/emergency services; do not provide repair instructions.";
    let user = "";

    if (action === "classify") {
      const title = text(body.title, 120);
      const description = text(body.description, 2000);
      const departments = Array.isArray(body.departments) ? body.departments.filter(x => typeof x === "string").slice(0, 40).map(x => text(x, 80)) : [];
      if (!title || !description || departments.length === 0) return res.status(400).json({ error: "Title, description and available departments are required." });
      system += " Return only valid JSON with keys: category (one of supplied departments), priority (low|medium|high|urgent), confidence (integer 0-100), reason (short string), safetyFlag (boolean). Use urgent only for credible immediate safety risk. Do not invent a department.";
      user = JSON.stringify({ task: "Suggest a complaint department and priority", title, description, availableDepartments: departments });
    } else if (action === "assistant") {
      const question = text(body.question, 1200);
      if (!question) return res.status(400).json({ error: "Enter a question." });
      const context = text(body.context, 2500);
      user = `CampusFix information: ${context || "No additional campus-specific information supplied."}\nStudent/admin question: ${question}`;
    } else if (action === "assignment") {
      const department = text(body.department, 100);
      const teams = Array.isArray(body.teams) ? body.teams.slice(0, 40) : [];
      if (!department || teams.length === 0) return res.status(400).json({ error: "Department and available teams are required." });
      system += " Recommend one team from the supplied list. Return only JSON with keys: teamId, reason, confidence (integer 0-100). Never invent a teamId. Prefer an active team matching the department and lower active workload.";
      user = JSON.stringify({ department, availableTeams: teams });
    } else {
      return res.status(400).json({ error: "Unsupported AI action." });
    }

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0.2, max_tokens: 450, response_format: action === "classify" || action === "assignment" ? { type: "json_object" } : undefined, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    });
    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      console.error("CampusFix AI provider error", aiResponse.status, detail.slice(0, 300));
      return res.status(502).json({ error: "The AI provider could not complete this request. Please try again." });
    }
    const result = await aiResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = result.choices?.[0]?.message?.content?.trim();
    if (!content) return res.status(502).json({ error: "The AI provider returned an empty response." });
    if (action === "classify" || action === "assignment") {
      try {
        const parsed = JSON.parse(content) as Record<string, unknown>;
        const confidence = typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
          ? Math.max(0, Math.min(100, Math.round(parsed.confidence))) : 0;
        if (action === "classify") {
          const departments = Array.isArray(body.departments) ? body.departments.filter((x): x is string => typeof x === "string") : [];
          const priority = parsed.priority;
          if (typeof parsed.category !== "string" || !departments.includes(parsed.category) || !["low", "medium", "high", "urgent"].includes(String(priority))) {
            return res.status(502).json({ error: "AI returned an unsupported category or priority. Please choose manually." });
          }
          return res.status(200).json({ result: {
            category: parsed.category, priority, confidence,
            reason: text(parsed.reason, 400), safetyFlag: parsed.safetyFlag === true,
          } });
        }
        const teams = Array.isArray(body.teams) ? body.teams as Array<Record<string, unknown>> : [];
        const team = teams.find(item => item.id === parsed.teamId && item.active === true);
        if (!team) return res.status(502).json({ error: "AI returned an unavailable team. Please assign manually." });
        return res.status(200).json({ result: { teamId: String(team.id), reason: text(parsed.reason, 400), confidence } });
      } catch { return res.status(502).json({ error: "The AI response could not be interpreted. Please use manual selection." }); }
    }
    return res.status(200).json({ answer: content });
  } catch (error) {
    console.error("CampusFix AI request failed", error);
    return res.status(500).json({ error: "AI request failed. Please try again later." });
  }
}
