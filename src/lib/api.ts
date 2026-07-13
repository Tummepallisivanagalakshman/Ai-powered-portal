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

// ─── Notifications API ──────────────────────────────────────────────────────
export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export const listNotifications = async (): Promise<NotificationItem[]> => {
  try {
    return await apiFetch("/notifications/");
  } catch {
    return [];
  }
};

export const markNotificationRead = async (id: number): Promise<NotificationItem> => {
  return await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
};

export const markAllNotificationsRead = async (): Promise<any> => {
  return await apiFetch("/notifications/read-all", { method: "POST" });
};

// ─── Admin API ─────────────────────────────────────────────────────────────
export interface AdminStats {
  total_users: number;
  total_jobs: number;
  total_applications: number;
  total_interview_sessions: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  preferred_roles: string | null;
  created_at: string;
}

export interface AdminAuditLog {
  id: number;
  timestamp: string;
  event: string;
  severity: string;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  return await apiFetch("/admin/stats");
};

export const listAdminUsers = async (): Promise<AdminUser[]> => {
  return await apiFetch("/admin/users");
};

export const updateUserRole = async (userId: number, preferredRoles: string): Promise<AdminUser> => {
  return await apiFetch(`/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ preferred_roles: preferredRoles }),
  });
};

export const deleteUser = async (userId: number): Promise<any> => {
  return await apiFetch(`/admin/users/${userId}`, { method: "DELETE" });
};

export const getAdminAuditLogs = async (): Promise<AdminAuditLog[]> => {
  return await apiFetch("/admin/audit-logs");
};

// ─── Saved AI History & Reports API ──────────────────────────────────────────
export interface SavedRoadmap {
  id: number;
  target_role: string;
  current_skills: string;
  plan_json: string;
  created_at: string;
}

export interface SavedCoverLetter {
  id: number;
  company_name: string;
  job_title: string;
  tone: string;
  content: string;
  created_at: string;
}

export interface SavedInterview {
  id: number;
  job_role: string;
  difficulty: string;
  total_score?: number;
  created_at: string;
}

export const listLearningRoadmaps = async (): Promise<SavedRoadmap[]> => {
  try {
    return await apiFetch("/roadmap/");
  } catch {
    return [];
  }
};

export const listCoverLetters = async (): Promise<SavedCoverLetter[]> => {
  try {
    return await apiFetch("/cover-letter/");
  } catch {
    return [];
  }
};

export const listInterviewSessions = async (): Promise<SavedInterview[]> => {
  try {
    return await apiFetch("/interviews/sessions");
  } catch {
    return [];
  }
};

// ─── NEW ENTERPRISE UPGRADE API HELPERS ─────────────────────────────────────

// Notifications
export const deleteNotification = async (id: number): Promise<any> => {
  return await apiFetch(`/notifications/${id}`, { method: "DELETE" });
};

// Calendar
export interface CalendarEvent {
  id?: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  type: string;
  created_at?: string;
}
export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  return await apiFetch("/calendar/");
};
export const createCalendarEvent = async (event: CalendarEvent): Promise<CalendarEvent> => {
  return await apiFetch("/calendar/", {
    method: "POST",
    body: JSON.stringify(event),
  });
};
export const updateCalendarEvent = async (id: number, event: CalendarEvent): Promise<CalendarEvent> => {
  return await apiFetch(`/calendar/${id}`, {
    method: "PUT",
    body: JSON.stringify(event),
  });
};
export const deleteCalendarEvent = async (id: number): Promise<any> => {
  return await apiFetch(`/calendar/${id}`, { method: "DELETE" });
};

// Companies
export interface CompanyProfile {
  id: number;
  name: string;
  overview: string;
  industry: string;
  required_skills: string;
  hiring_trends: string;
  salary_range: string;
  interview_process: string;
  interview_questions: string;
  created_at: string;
}
export const getCompaniesList = async (): Promise<CompanyProfile[]> => {
  return await apiFetch("/companies/");
};
export const getCompanyDetail = async (id: number): Promise<CompanyProfile> => {
  return await apiFetch(`/companies/${id}`);
};
export const createCompanyProfile = async (company: Partial<CompanyProfile>): Promise<CompanyProfile> => {
  return await apiFetch("/companies/", {
    method: "POST",
    body: JSON.stringify(company),
  });
};

// Bookmarks & Favorites
export interface BookmarkItem {
  id: number;
  item_type: string;
  item_id: string;
  created_at: string;
}
export const getBookmarks = async (): Promise<BookmarkItem[]> => {
  return await apiFetch("/bookmarks/");
};
export const addBookmark = async (itemType: string, itemId: string): Promise<BookmarkItem> => {
  return await apiFetch("/bookmarks/", {
    method: "POST",
    body: JSON.stringify({ item_type: itemType, item_id: itemId }),
  });
};
export const removeBookmark = async (bookmarkId: number): Promise<any> => {
  return await apiFetch(`/bookmarks/${bookmarkId}`, { method: "DELETE" });
};

// AI Feedback loops
export const submitAIFeedback = async (payload: {
  target_type: string;
  target_id?: string;
  helpful: boolean;
  comment?: string;
}): Promise<any> => {
  return await apiFetch("/feedback/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// File Manager
export interface FileRecord {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  category: string;
  created_at: string;
}
export const listMyFiles = async (): Promise<FileRecord[]> => {
  return await apiFetch("/files/");
};
export const renameUserFile = async (fileId: string, newName: string): Promise<any> => {
  return await apiFetch(`/files/${fileId}/rename?new_name=${encodeURIComponent(newName)}`, {
    method: "PUT",
  });
};
export const deleteUserFile = async (fileId: string): Promise<any> => {
  return await apiFetch(`/files/${fileId}`, { method: "DELETE" });
};
export const uploadCustomFile = async (category: string, file: File): Promise<FileRecord> => {
  const formData = new FormData();
  formData.append("file", file);
  return await apiFetch(`/files/upload?category=${category}`, {
    method: "POST",
    body: formData,
    // Note: apiFetch should handle raw FormData appropriately or not stringify if it detects it
  });
};

// Global Search
export interface GlobalSearchResults {
  jobs: any[];
  companies: any[];
  roadmaps: any[];
  cover_letters: any[];
  interviews: any[];
  candidates: any[];
}
export const performGlobalSearch = async (query: string): Promise<GlobalSearchResults> => {
  return await apiFetch(`/search/?q=${encodeURIComponent(query)}`);
};

// Analytics
export const getCandidateAnalytics = async (): Promise<any> => {
  return await apiFetch("/analytics/candidate/progress");
};
export const getRecruiterAnalytics = async (): Promise<any> => {
  return await apiFetch("/analytics/recruiter/funnel");
};

// Admin Moderation & Logs
export const listJobsModeration = async (): Promise<any[]> => {
  return await apiFetch("/admin/jobs");
};
export const moderateJobStatus = async (jobId: string, status: string): Promise<any> => {
  return await apiFetch(`/admin/jobs/${jobId}/status?status=${status}`, { method: "PUT" });
};
export const getAIUsageAnalytics = async (): Promise<any> => {
  return await apiFetch("/admin/ai-analytics");
};
export const getSystemHealth = async (): Promise<any> => {
  return await apiFetch("/admin/system-health");
};
export const getUserFeedbackList = async (): Promise<any[]> => {
  return await apiFetch("/admin/feedback");
};


