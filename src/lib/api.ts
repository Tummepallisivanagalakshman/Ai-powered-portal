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
  id: string | number;
  title: string;
  department?: string;
  location?: string;
  description?: string;
  requirements?: string;
  skills?: string[];
  status?: string;
  created_at?: string;
}

export interface ApplicationWithJob {
  id: string | number;
  job_id: string | number;
  status: string;
  ai_score?: number | null;
  created_at?: string;
  jobs?: Job;
  // candidate fields embedded
  full_name?: string;
  email?: string;
}

// ─── Jobs API ─────────────────────────────────────────────────────────────
export const listOpenJobs = async (): Promise<Job[]> => {
  try {
    return await apiFetch("/jobs");
  } catch {
    return [];
  }
};

export const getJob = async (jobId: string | number): Promise<Job | null> => {
  try {
    return await apiFetch(`/jobs/${jobId}`);
  } catch {
    return null;
  }
};

// ─── Applications API ──────────────────────────────────────────────────────
export const listMyApplications = async (): Promise<ApplicationWithJob[]> => {
  try {
    return await apiFetch("/jobs/applications/me");
  } catch {
    return [];
  }
};

export const hasApplied = async (
  userId: number | string,
  jobId: string | number
): Promise<boolean> => {
  try {
    const result = await apiFetch(`/jobs/${jobId}/applied`);
    return result.applied === true;
  } catch {
    return false;
  }
};

export const applyToJob = async (payload: {
  jobId: string | number;
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
