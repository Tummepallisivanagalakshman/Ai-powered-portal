import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole } from "@/lib/types";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

export type ChatMessage = { role: "user" | "assistant"; content: string };

async function callGatewayText(
  messages: Array<{ role: string; content: string }>,
) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured (missing API key).");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (res.status === 429) {
    throw new Error("AI rate limit reached. Please try again in a moment.");
  }
  if (res.status === 402) {
    throw new Error("AI credits exhausted. Add credits in workspace settings.");
  }
  if (!res.ok) {
    throw new Error(`AI request failed (${res.status}).`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

const ROLE_SYSTEM: Record<AppRole, string> = {
  candidate:
    "You are TalentScreen Assistant, a friendly career helper inside a hiring portal, talking to a job CANDIDATE. " +
    "Help them understand how to apply to jobs, improve their resume and cover note, interpret their application " +
    "status, prepare for interviews, and use the portal features (browsing jobs, applying, tracking applications). " +
    "Be encouraging, concise, and practical. Never reveal other candidates' data or internal recruiter notes.",
  recruiter:
    "You are TalentScreen Assistant, an expert HR/recruiting co-pilot inside a hiring portal, talking to an HR / RECRUITER. " +
    "Help them post and manage jobs, screen and shortlist candidates fairly, interpret AI screening scores and job-match " +
    "results, write outreach, plan interviews, and use the portal features. Promote fair, unbiased hiring and never " +
    "advise discrimination based on protected characteristics. Be concise and actionable.",
  hiring_manager:
    "You are TalentScreen Assistant, a hiring strategy co-pilot inside a hiring portal, talking to a HIRING MANAGER. " +
    "Help them review shortlisted candidates, make selection decisions, compare candidates fairly, plan interview loops, " +
    "and use the portal features. Promote fair, unbiased hiring and never advise discrimination based on protected " +
    "characteristics. Be concise and decision-focused.",
};

async function buildContext(
  supabase: any,
  role: AppRole,
  userId: string,
): Promise<string> {
  try {
    if (role === "candidate") {
      const { data: apps } = await supabase
        .from("applications")
        .select("status, jobs(title, department)")
        .eq("candidate_id", userId)
        .order("created_at", { ascending: false })
        .limit(15);
      const { count: openJobs } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "open");
      const lines = (apps ?? []).map(
        (a: any) =>
          `- ${a.jobs?.title ?? "Unknown role"} (${a.jobs?.department ?? "—"}): ${a.status}`,
      );
      return `CONTEXT — This candidate's applications:\n${
        lines.length ? lines.join("\n") : "(no applications yet)"
      }\nOpen jobs currently available: ${openJobs ?? 0}`;
    }

    // recruiter / hiring_manager
    const { data: apps } = await supabase
      .from("applications")
      .select("status")
      .limit(500);
    const { count: openJobs } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");
    const counts: Record<string, number> = {};
    for (const a of apps ?? []) counts[a.status] = (counts[a.status] ?? 0) + 1;
    const summary = Object.entries(counts)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    return `CONTEXT — Pipeline snapshot:\nTotal applications: ${
      (apps ?? []).length
    }${summary ? ` (${summary})` : ""}\nOpen jobs: ${openJobs ?? 0}`;
  } catch {
    return "";
  }
}

export const chatWithAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { messages: ChatMessage[] }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Resolve the caller's role server-side (don't trust the client).
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    const role = (roleRow?.role as AppRole) ?? "candidate";

    const ctx = await buildContext(supabase, role, userId);

    const history = (data.messages ?? [])
      .filter((m) => m.content?.trim())
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    const reply = await callGatewayText([
      {
        role: "system",
        content:
          ROLE_SYSTEM[role] +
          "\n\nWrite in plain text only. Do NOT use markdown symbols such as **, ##, or backticks. " +
          "Use short paragraphs or simple bullet lines starting with '- '. " +
          "Keep responses focused and under ~180 words unless asked for more.\n\n" +
          ctx,
      },
      ...history,
    ]);

    return { reply: reply || "Sorry, I couldn't generate a response. Please try again." };
  });
