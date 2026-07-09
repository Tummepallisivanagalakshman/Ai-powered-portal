/**
 * Global API Client — attaches JWT Bearer token to every /api request.
 * Also exports all domain-specific helper functions used by React components.
 */

// ─── Auth Token Utility ────────────────────────────────────────────────────
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
};

// ─── Core Fetch Wrapper ────────────────────────────────────────────────────
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("access_token");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
};

// ─── Type Definitions ──────────────────────────────────────────────────────
export interface Job {
  id: string;
  title: string;
  company?: string;
  department?: string;
  location?: string;
  experience_required?: string;
  employment_type?: string;
  description?: string;
  requirements?: string;
  skills?: string[];
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface JobInput {
  title: string;
  company: string;
  department: string;
  location: string;
  experience_required: string;
  employment_type: string;
  description: string;
  requirements: string;
  skills: string[];
  status: string;
}

export interface ApplicationWithJob {
  id: string;
  job_id: string;
  status: string;
  ai_score?: number | null;
  created_at?: string;
  jobs?: Job;
  full_name?: string;
  email?: string;
}

export interface ApplicationWithDetails {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
  email?: string;
  phone?: string;
  education?: string;
  skills?: string;
  experience?: string;
  cover_note?: string;
  resume_path?: string;
  resume_text?: string;
  
  // AI scorecards
  ai_score?: number | null;
  ai_summary?: string | null;
  ai_strengths?: string | null;
  ai_concerns?: string | null;
  ai_recommendation?: string | null;
  ai_experience?: string | null;
  
  // Manager notes
  manager_notes?: string | null;
  
  // Job match details
  match_score?: number | null;
  matching_skills?: string | null;
  missing_skills?: string | null;
  match_recommendation?: string | null;
  
  jobs?: Job;
}

// ─── Jobs API ─────────────────────────────────────────────────────────────
export const listOpenJobs = async (): Promise<Job[]> => {
  try {
    return await apiFetch("/jobs");
  } catch {
    return [];
  }
};

export const listMyJobs = async (): Promise<Job[]> => {
  try {
    return await apiFetch("/jobs/my-jobs");
  } catch {
    return [];
  }
};

export const getJob = async (jobId: string): Promise<Job | null> => {
  try {
    return await apiFetch(`/jobs/${jobId}`);
  } catch {
    return null;
  }
};

export const createJob = async (userId: string | number, job: JobInput): Promise<Job> => {
  return await apiFetch("/jobs", {
    method: "POST",
    body: JSON.stringify(job),
  });
};

export const updateJob = async (jobId: string, job: Partial<JobInput>): Promise<Job> => {
  return await apiFetch(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(job),
  });
};

export const deleteJob = async (jobId: string): Promise<any> => {
  return await apiFetch(`/jobs/${jobId}`, {
    method: "DELETE",
  });
};

export const setJobStatus = async (jobId: string, status: string): Promise<Job> => {
  return await apiFetch(`/jobs/${jobId}/status?status=${encodeURIComponent(status)}`, {
    method: "PATCH",
  });
};

// ─── Applications API ──────────────────────────────────────────────────────
export const listMyApplications = async (): Promise<ApplicationWithJob[]> => {
  try {
    return await apiFetch("/jobs/applications/me");
  } catch {
    return [];
  }
};

export const listAllApplications = async (): Promise<ApplicationWithDetails[]> => {
  try {
    return await apiFetch("/jobs/applications/all");
  } catch {
    return [];
  }
};

export const listShortlistedApplications = async (): Promise<ApplicationWithDetails[]> => {
  try {
    return await apiFetch("/jobs/applications/shortlisted");
  } catch {
    return [];
  }
};

export const getApplication = async (appId: string): Promise<ApplicationWithDetails | null> => {
  try {
    return await apiFetch(`/jobs/applications/${appId}`);
  } catch {
    return null;
  }
};

export const hasApplied = async (
  userId: number | string,
  jobId: string
): Promise<boolean> => {
  try {
    const result = await apiFetch(`/jobs/${jobId}/applied`);
    return result.applied === true;
  } catch {
    return false;
  }
};

export const applyToJob = async (payload: {
  jobId: string;
  fullName: string;
  email: string;
  phone: string;
  education: string;
  skills: string;
  experience: string;
  coverNote?: string;
  resumeText?: string;
}) => {
  return await apiFetch(`/jobs/${payload.jobId}/apply`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateApplicationStatus = async (appId: string, status: string): Promise<any> => {
  return await apiFetch(`/jobs/applications/${appId}/status?status=${encodeURIComponent(status)}`, {
    method: "PATCH",
  });
};

export const updateManagerDecision = async (
  appId: string,
  decision: "approve" | "reject",
  notes?: string
): Promise<any> => {
  return await apiFetch(`/jobs/applications/${appId}/decision`, {
    method: "PATCH",
    body: JSON.stringify({ decision, notes }),
  });
};

export const listQuestions = async (appId: string): Promise<any> => {
  try {
    return await apiFetch(`/jobs/applications/${appId}/questions`);
  } catch {
    return [];
  }
};

// ─── Resumes / Storage API ─────────────────────────────────────────────────
export const getResumeUrl = async (resumePath: string): Promise<string> => {
  // Extract filename from path (e.g. "uploads/abc.pdf" -> "abc.pdf")
  const parts = resumePath.split(/[/\\]/);
  const filename = parts[parts.length - 1];
  return `/api/resumes/download/${encodeURIComponent(filename)}`;
};
