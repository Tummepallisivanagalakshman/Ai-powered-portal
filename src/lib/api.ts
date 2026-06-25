import { supabase } from "@/integrations/supabase/client";
import { generateResumeSummary, generateJobMatch } from "./ai.functions";
import type {
  Application,
  ApplicationStatus,
  InterviewQuestion,
  Job,
  Profile,
} from "./types";

export type JobInput = {
  title: string;
  company: string;
  department: string;
  location: string;
  experience_required: string;
  employment_type: string;
  description: string;
  requirements: string;
  skills: string[];
  status: "open" | "closed";
};

export type ApplicationWithJob = Application & {
  jobs: Pick<
    Job,
    "title" | "company" | "department" | "location" | "status" | "description"
  > | null;
};


export type ApplicationWithDetails = Application & {
  jobs: Pick<Job, "title" | "department" | "location"> | null;
  candidate: Pick<Profile, "full_name" | "email"> | null;
};

function throwIf<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/* ---------- Jobs ---------- */

export async function listOpenJobs(): Promise<Job[]> {
  return throwIf(
    await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  );
}

export async function listMyJobs(userId: string): Promise<Job[]> {
  return throwIf(
    await supabase
      .from("jobs")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false }),
  );
}

export async function createJob(userId: string, input: JobInput): Promise<Job> {
  return throwIf(
    await supabase
      .from("jobs")
      .insert({ ...input, created_by: userId })
      .select()
      .single(),
  );
}

export async function updateJob(jobId: string, input: JobInput): Promise<Job> {
  return throwIf(
    await supabase
      .from("jobs")
      .update({ ...input })
      .eq("id", jobId)
      .select()
      .single(),
  );
}

export async function deleteJob(jobId: string) {
  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  if (error) throw new Error(error.message);
}

export async function setJobStatus(jobId: string, status: "open" | "closed") {
  throwIf(await supabase.from("jobs").update({ status }).eq("id", jobId).select());
}

/* ---------- Applications ---------- */

export async function listMyApplications(
  userId: string,
): Promise<ApplicationWithJob[]> {
  return throwIf(
    await supabase
      .from("applications")
      .select("*, jobs(title, company, department, location, status, description)")
      .eq("candidate_id", userId)
      .order("created_at", { ascending: false }),
  ) as unknown as ApplicationWithJob[];
}

export async function hasApplied(userId: string, jobId: string): Promise<boolean> {
  const { count } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("candidate_id", userId)
    .eq("job_id", jobId);
  return (count ?? 0) > 0;
}

export type ApplyInput = {
  jobId: string;
  fullName: string;
  email: string;
  phone: string;
  education: string;
  skills: string;
  experience: string;
  coverNote: string;
  resumeFile: File | null;
};

export async function getJob(jobId: string): Promise<Job> {
  return throwIf(
    await supabase.from("jobs").select("*").eq("id", jobId).single(),
  );
}

export async function applyToJob(userId: string, input: ApplyInput) {
  let resumePath: string | null = null;

  if (input.resumeFile) {
    const ext = input.resumeFile.name.split(".").pop() ?? "pdf";
    const path = `${userId}/${input.jobId}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("resumes")
      .upload(path, input.resumeFile, { upsert: true });
    if (uploadErr) throw new Error(uploadErr.message);
    resumePath = path;
  }

  // resume_text powers the AI screening — build it from the structured fields.
  const resumeText = [
    input.education && `Education:\n${input.education}`,
    input.skills && `Skills:\n${input.skills}`,
    input.experience && `Experience:\n${input.experience}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  // Generate an AI resume summary at apply time so HR & Hiring Managers see it
  // immediately. If AI is unavailable, the application is still submitted.
  let aiSummary: string | null = null;
  let aiStrengths: string | null = null;
  let aiExperience: string | null = null;
  let aiRecommendation: string | null = null;
  try {
    const ai = await generateResumeSummary({
      data: {
        jobId: input.jobId,
        resumeText,
        skills: input.skills,
        coverNote: input.coverNote,
      },
    });
    aiSummary = ai.summary || null;
    aiStrengths = ai.strengths || null;
    aiExperience = ai.experience || null;
    aiRecommendation = ai.roleFit || null;
  } catch (err) {
    console.error("AI resume summary failed:", err);
  }

  // Job match scoring: compare the candidate against the job and store results
  // so HR can review match score, matching/missing skills, and a recommendation.
  let matchScore: number | null = null;
  let matchingSkills: string | null = null;
  let missingSkills: string | null = null;
  let matchRecommendation: string | null = null;
  try {
    const match = await generateJobMatch({
      data: {
        jobId: input.jobId,
        resumeText,
        skills: input.skills,
      },
    });
    matchScore = match.score;
    matchingSkills = match.matchingSkills || null;
    missingSkills = match.missingSkills || null;
    matchRecommendation = match.recommendation || null;
  } catch (err) {
    console.error("AI job match failed:", err);
  }

  throwIf(
    await supabase
      .from("applications")
      .insert({
        job_id: input.jobId,
        candidate_id: userId,
        full_name: input.fullName,
        email: input.email,
        phone: input.phone,
        education: input.education,
        skills: input.skills,
        experience: input.experience,
        cover_note: input.coverNote,
        resume_text: resumeText,
        resume_path: resumePath,
        ai_summary: aiSummary,
        ai_strengths: aiStrengths,
        ai_experience: aiExperience,
        ai_recommendation: aiRecommendation,
        match_score: matchScore,
        matching_skills: matchingSkills,
        missing_skills: missingSkills,
        match_recommendation: matchRecommendation,
        status: "applied",
      })
      .select(),
  );
}

async function attachCandidates(
  apps: Application[],
): Promise<ApplicationWithDetails[]> {
  const ids = [...new Set(apps.map((a) => a.candidate_id))];
  let profiles: Profile[] = [];
  if (ids.length) {
    profiles = throwIf(
      await supabase.from("profiles").select("*").in("id", ids),
    );
  }
  const map = new Map(profiles.map((p) => [p.id, p]));
  return apps.map((a) => ({
    ...a,
    candidate: map.get(a.candidate_id)
      ? {
          full_name: map.get(a.candidate_id)!.full_name,
          email: map.get(a.candidate_id)!.email,
        }
      : null,
  })) as ApplicationWithDetails[];
}

export async function listAllApplications(): Promise<ApplicationWithDetails[]> {
  const apps = throwIf(
    await supabase
      .from("applications")
      .select("*, jobs(title, department, location)")
      .order("created_at", { ascending: false }),
  ) as unknown as (Application & {
    jobs: Pick<Job, "title" | "department" | "location"> | null;
  })[];
  const withCandidates = await attachCandidates(apps);
  return withCandidates.map((a, i) => ({ ...a, jobs: apps[i].jobs }));
}

export async function getApplication(
  id: string,
): Promise<ApplicationWithDetails> {
  const app = throwIf(
    await supabase
      .from("applications")
      .select("*, jobs(title, department, location)")
      .eq("id", id)
      .single(),
  ) as unknown as Application & {
    jobs: Pick<Job, "title" | "department" | "location"> | null;
  };
  const [withCandidate] = await attachCandidates([app]);
  return { ...withCandidate, jobs: app.jobs };
}


export async function listShortlistedApplications(): Promise<
  ApplicationWithDetails[]
> {
  const all = await listAllApplications();
  return all.filter((a) =>
    ["shortlisted", "approved", "rejected"].includes(a.status),
  );
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
) {
  throwIf(
    await supabase.from("applications").update({ status }).eq("id", id).select(),
  );
}

export async function updateManagerDecision(
  id: string,
  status: ApplicationStatus,
  notes: string,
) {
  throwIf(
    await supabase
      .from("applications")
      .update({ status, manager_notes: notes })
      .eq("id", id)
      .select(),
  );
}

export async function getResumeUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from("resumes")
    .createSignedUrl(path, 120);
  return data?.signedUrl ?? null;
}

/* ---------- Interview questions ---------- */

export async function listQuestions(
  applicationId: string,
): Promise<InterviewQuestion[]> {
  return throwIf(
    await supabase
      .from("interview_questions")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false }),
  );
}
