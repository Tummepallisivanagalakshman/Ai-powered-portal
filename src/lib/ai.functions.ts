import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ScreeningResult = {
  score: number;
  summary: string;
  strengths: string;
  concerns: string;
  recommendation: string;
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

async function callGateway(messages: Array<{ role: string; content: string }>) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured (missing API key).");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
    }),
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
  const content = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function fetchContext(supabase: any, applicationId: string) {
  const { data: app, error } = await supabase
    .from("applications")
    .select("*, jobs(title, description, requirements, department)")
    .eq("id", applicationId)
    .single();
  if (error || !app) throw new Error("Application not found.");
  return app;
}

export const runScreening = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { applicationId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const app = await fetchContext(supabase, data.applicationId);
    const job = app.jobs ?? {};

    const result = (await callGateway([
      {
        role: "system",
        content:
          "You are an expert technical recruiter performing fair, unbiased candidate screening. " +
          "Analyze how well the candidate matches the role based ONLY on the information provided. " +
          'Respond with a JSON object with exactly these keys: "score" (integer 0-100 indicating fit), ' +
          '"summary" (2-3 sentence overview), "strengths" (newline-separated bullet points), ' +
          '"concerns" (newline-separated bullet points), "recommendation" (one of: "Strong fit", "Possible fit", "Not a fit"). ' +
          "Do not consider age, gender, ethnicity, or other protected characteristics.",
      },
      {
        role: "user",
        content: `JOB TITLE: ${job.title ?? "N/A"}
DEPARTMENT: ${job.department ?? "N/A"}
JOB DESCRIPTION: ${job.description ?? "N/A"}
REQUIREMENTS: ${job.requirements ?? "N/A"}

CANDIDATE RESUME / EXPERIENCE:
${app.resume_text ?? "(none provided)"}

CANDIDATE COVER NOTE:
${app.cover_note ?? "(none provided)"}`,
      },
    ])) as Partial<ScreeningResult>;

    const score =
      typeof result.score === "number"
        ? Math.max(0, Math.min(100, Math.round(result.score)))
        : null;

    // Also (re)compute the job-match score so HR sees it on screening.
    let match: JobMatchResult | null = null;
    try {
      match = await computeJobMatch(
        job as JobLike,
        app.resume_text ?? "",
        app.skills ?? "",
      );
    } catch (err) {
      console.error("Job match during screening failed:", err);
    }

    const { error: updErr } = await supabase
      .from("applications")
      .update({
        ai_score: score,
        ai_summary: result.summary ?? null,
        ai_strengths: result.strengths ?? null,
        ai_concerns: result.concerns ?? null,
        ai_recommendation: result.recommendation ?? null,
        ...(match
          ? {
              match_score: match.score,
              matching_skills: match.matchingSkills || null,
              missing_skills: match.missingSkills || null,
              match_recommendation: match.recommendation || null,
            }
          : {}),
        status: app.status === "applied" ? "screening" : app.status,
      })
      .eq("id", data.applicationId);
    if (updErr) throw new Error(updErr.message);

    return {
      score,
      summary: result.summary ?? "",
      strengths: result.strengths ?? "",
      concerns: result.concerns ?? "",
      recommendation: result.recommendation ?? "",
    };
  });

export const generateInterviewQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { applicationId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const app = await fetchContext(supabase, data.applicationId);
    const job = app.jobs ?? {};

    const result = (await callGateway([
      {
        role: "system",
        content:
          "You are an expert interviewer. Generate exactly 10 tailored interview questions for this candidate and role, " +
          "based on the job description, the candidate's profile/resume, and their skills. " +
          "Include a balanced mix of the three categories below: " +
          "approximately 4 Technical questions (probing the candidate's specific skills and the role's requirements), " +
          "3 Behavioral questions (past experiences, teamwork, conflict, ownership), and " +
          "3 Scenario-based questions (hypothetical situations relevant to the role). " +
          'Respond with a JSON object with one key "questions": an array of exactly 10 objects, each with ' +
          '"category" (exactly one of: "Technical", "Behavioral", "Scenario-based") and "question" (the question text). ' +
          "Make questions specific to the candidate and role, not generic.",
      },
      {
        role: "user",
        content: `JOB TITLE: ${job.title ?? "N/A"}
DEPARTMENT: ${job.department ?? "N/A"}
JOB DESCRIPTION: ${job.description ?? "N/A"}
REQUIREMENTS: ${job.requirements ?? "N/A"}

CANDIDATE SKILLS:
${app.skills ?? "(none provided)"}

CANDIDATE RESUME / EXPERIENCE:
${app.resume_text ?? "(none provided)"}

CANDIDATE COVER NOTE:
${app.cover_note ?? "(none provided)"}`,
      },
    ])) as { questions?: Array<{ category: string; question: string }> };


    const questions = Array.isArray(result.questions) ? result.questions : [];

    const { error: insErr } = await supabase
      .from("interview_questions")
      .insert({
        application_id: data.applicationId,
        questions,
        created_by: userId,
      });
    if (insErr) throw new Error(insErr.message);

    return { questions };
  });

/**
 * Generates an AI resume summary from a candidate's resume + skills against a
 * job. Returns the summary fields so they can be stored on the application at
 * apply time (candidates can insert these columns, but RLS blocks later updates).
 */
export const generateResumeSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      jobId: string;
      resumeText: string;
      skills: string;
      coverNote?: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: job } = await supabase
      .from("jobs")
      .select("title, description, requirements, department, skills")
      .eq("id", data.jobId)
      .single();
    const j = job ?? {};

    const result = (await callGateway([
      {
        role: "system",
        content:
          "You are an expert technical recruiter. Analyze the candidate's resume and skills " +
          "against the role and produce a concise, fair, unbiased resume summary. " +
          "Respond with a JSON object with exactly these keys: " +
          '"summary" (2-3 sentence candidate overview), ' +
          '"strengths" (newline-separated bullet points of key strengths), ' +
          '"experience" (newline-separated bullet points summarizing the most relevant experience), ' +
          '"role_fit" (one short sentence on recommended role fit, e.g. "Strong fit for Senior Frontend Engineer"). ' +
          "Base your analysis ONLY on the information provided. " +
          "Do not consider age, gender, ethnicity, or other protected characteristics.",
      },
      {
        role: "user",
        content: `JOB TITLE: ${(j as any).title ?? "N/A"}
DEPARTMENT: ${(j as any).department ?? "N/A"}
JOB DESCRIPTION: ${(j as any).description ?? "N/A"}
REQUIREMENTS: ${(j as any).requirements ?? "N/A"}
REQUIRED SKILLS: ${
          Array.isArray((j as any).skills)
            ? (j as any).skills.join(", ")
            : "N/A"
        }

CANDIDATE SKILLS:
${data.skills || "(none provided)"}

CANDIDATE RESUME / EXPERIENCE:
${data.resumeText || "(none provided)"}

CANDIDATE COVER NOTE:
${data.coverNote || "(none provided)"}`,
      },
    ])) as {
      summary?: string;
      strengths?: string;
      experience?: string;
      role_fit?: string;
    };

    return {
      summary: result.summary ?? "",
      strengths: result.strengths ?? "",
      experience: result.experience ?? "",
      roleFit: result.role_fit ?? "",
    };
  });

/**
 * Compares a candidate's profile + resume against a job description and returns
 * a job-match score (0-100), matching skills, missing skills, and a
 * recommendation. Returned so it can be stored on the application at apply time.
 */
type JobLike = {
  title?: string;
  description?: string;
  requirements?: string;
  department?: string;
  skills?: string[];
};

export type JobMatchResult = {
  score: number | null;
  matchingSkills: string;
  missingSkills: string;
  recommendation: string;
};

const MATCH_RECOMMENDATIONS = [
  "Strong Match",
  "Good Match",
  "Moderate Match",
  "Weak Match",
];

/** Core job-match computation (no DB write). Shared by apply-time and screening. */
async function computeJobMatch(
  job: JobLike,
  resumeText: string,
  skills: string,
): Promise<JobMatchResult> {
  const result = (await callGateway([
    {
      role: "system",
      content:
        "You are an expert technical recruiter performing fair, unbiased job-match scoring. " +
        "Compare the candidate's profile and resume against the job description and required skills. " +
        "Respond with a JSON object with exactly these keys: " +
        '"score" (integer 0-100 indicating overall match), ' +
        '"matching_skills" (comma-separated list of the candidate\'s skills that match the role), ' +
        '"missing_skills" (comma-separated list of required skills the candidate appears to lack), ' +
        '"recommendation" (EXACTLY one of: "Strong Match", "Good Match", "Moderate Match", "Weak Match"). ' +
        "Base your analysis ONLY on the information provided. " +
        "Do not consider age, gender, ethnicity, or other protected characteristics.",
    },
    {
      role: "user",
      content: `JOB TITLE: ${job.title ?? "N/A"}
DEPARTMENT: ${job.department ?? "N/A"}
JOB DESCRIPTION: ${job.description ?? "N/A"}
REQUIREMENTS: ${job.requirements ?? "N/A"}
REQUIRED SKILLS: ${Array.isArray(job.skills) ? job.skills.join(", ") : "N/A"}

CANDIDATE SKILLS:
${skills || "(none provided)"}

CANDIDATE PROFILE / RESUME:
${resumeText || "(none provided)"}`,
    },
  ])) as {
    score?: number;
    matching_skills?: string;
    missing_skills?: string;
    recommendation?: string;
  };

  const recommendation = MATCH_RECOMMENDATIONS.includes(
    result.recommendation ?? "",
  )
    ? (result.recommendation as string)
    : "";

  const score =
    typeof result.score === "number"
      ? Math.max(0, Math.min(100, Math.round(result.score)))
      : null;

  return {
    score,
    matchingSkills: result.matching_skills ?? "",
    missingSkills: result.missing_skills ?? "",
    recommendation,
  };
}

/**
 * Parses raw resume text (extracted from an uploaded PDF) into the structured
 * fields of the application form, so candidates can auto-fill their details.
 */
export const parseResumeFields = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { resumeText: string }) => data)
  .handler(async ({ data }) => {
    const text = (data.resumeText || "").slice(0, 20000);
    if (!text.trim()) {
      return {
        fullName: "",
        email: "",
        phone: "",
        education: "",
        skills: "",
        experience: "",
      };
    }

    const result = (await callGateway([
      {
        role: "system",
        content:
          "You are a precise resume parser. Extract the candidate's details from the resume text " +
          "and respond with a JSON object with EXACTLY these keys: " +
          '"full_name" (the candidate\'s full name), ' +
          '"email" (their email address), ' +
          '"phone" (their phone number), ' +
          '"education" (their education history as readable text — degrees, institutions, years), ' +
          '"skills" (a comma-separated list of their skills), ' +
          '"experience" (a concise summary of their work history, roles, and achievements). ' +
          "Use ONLY information present in the resume. If a field is not found, return an empty string for it. " +
          "Do not invent or infer data that is not in the text.",
      },
      {
        role: "user",
        content: `RESUME TEXT:\n${text}`,
      },
    ])) as {
      full_name?: string;
      email?: string;
      phone?: string;
      education?: string;
      skills?: string;
      experience?: string;
    };

    return {
      fullName: result.full_name ?? "",
      email: result.email ?? "",
      phone: result.phone ?? "",
      education: result.education ?? "",
      skills: result.skills ?? "",
      experience: result.experience ?? "",
    };
  });

export const generateJobMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { jobId: string; resumeText: string; skills: string }) => data,
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: job } = await supabase
      .from("jobs")
      .select("title, description, requirements, department, skills")
      .eq("id", data.jobId)
      .single();

    return computeJobMatch((job ?? {}) as JobLike, data.resumeText, data.skills);
  });
