import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type ApplicationStatus = Database["public"]["Enums"]["application_status"];
export type JobStatus = Database["public"]["Enums"]["job_status"];

export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type InterviewQuestion = Database["public"]["Tables"]["interview_questions"]["Row"];

export const ROLE_LABELS: Record<AppRole, string> = {
  candidate: "Candidate",
  recruiter: "HR / Recruiter",
  hiring_manager: "Hiring Manager",
};

export const ROLE_HOME: Record<AppRole, string> = {
  candidate: "/candidate",
  recruiter: "/recruiter",
  hiring_manager: "/manager",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  screening: "Screened",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview Scheduled",
  rejected: "Rejected",
  approved: "Selected",
};
