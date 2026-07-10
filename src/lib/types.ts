// Standalone types — decoupled from Supabase generated types

export type AppRole = "candidate" | "recruiter" | "hiring_manager" | "admin";
export type ApplicationStatus =
  | "applied"
  | "screening"
  | "shortlisted"
  | "interview_scheduled"
  | "rejected"
  | "approved";
export type JobStatus = "open" | "closed" | "draft";

export interface Job {
  id: number | string;
  title: string;
  department?: string | null;
  location?: string | null;
  description?: string | null;
  requirements?: string | null;
  skills?: string[] | null;
  status?: JobStatus | string | null;
  created_at?: string | null;
}

export interface Application {
  id: number | string;
  job_id: number | string;
  user_id?: number | string;
  status: ApplicationStatus | string;
  ai_score?: number | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  education?: string | null;
  skills?: string | null;
  experience?: string | null;
  cover_note?: string | null;
  resume_text?: string | null;
  created_at?: string | null;
  jobs?: Job;
}

export interface Profile {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  profile_photo_url?: string | null;
  skills?: string | null;
  experience?: string | null;
  preferred_roles?: string | null;
  preferred_locations?: string | null;
}

export interface InterviewQuestion {
  id: number;
  application_id: number | string;
  question: string;
  answer?: string | null;
  score?: number | null;
  created_at?: string | null;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  candidate: "Candidate",
  recruiter: "HR / Recruiter",
  hiring_manager: "Hiring Manager",
  admin: "Administrator",
};

export const ROLE_HOME: Record<AppRole, string> = {
  candidate: "/candidate",
  recruiter: "/recruiter",
  hiring_manager: "/manager",
  admin: "/admin",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  screening: "Screened",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview Scheduled",
  rejected: "Rejected",
  approved: "Selected",
};
