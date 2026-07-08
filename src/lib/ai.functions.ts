import { apiFetch } from "./api";

export const runScreening = async ({ data }: { data: { applicationId: string } }) => {
  return await apiFetch("/ai/screening", { method: "POST", body: JSON.stringify(data) });
};

export const generateInterviewQuestions = async ({ data }: { data: { applicationId: string } }) => {
  return await apiFetch("/ai/interview-questions", { method: "POST", body: JSON.stringify(data) });
};

export const generateResumeSummary = async ({ data }: { data: any }) => {
  return await apiFetch("/ai/resume-summary", { method: "POST", body: JSON.stringify(data) });
};

export const generateJobMatch = async ({ data }: { data: any }) => {
  return await apiFetch("/ai/job-match", { method: "POST", body: JSON.stringify(data) });
};

export const parseResumeFields = async ({ data }: { data: any }) => {
  return await apiFetch("/ai/parse-resume", { method: "POST", body: JSON.stringify(data) });
};

export const generateCoverLetter = async ({ data }: { data: any }) => {
  return await apiFetch("/ai/cover-letter", { method: "POST", body: JSON.stringify(data) });
};

export const matchResumeToJD = async ({ data }: { data: any }) => {
  return await apiFetch("/ai/match-resume-jd", { method: "POST", body: JSON.stringify(data) });
};

export const generateMockQuestions = async ({ data }: { data: any }) => {
  return await apiFetch("/ai/mock-questions", { method: "POST", body: JSON.stringify(data) });
};

export const gradeMockSession = async ({ data }: { data: any }) => {
  return await apiFetch("/ai/mock-grade", { method: "POST", body: JSON.stringify(data) });
};

export const generateLearningRoadmap = async ({ data }: { data: any }) => {
  return await apiFetch("/ai/roadmap", { method: "POST", body: JSON.stringify(data) });
};

export const analyzeResumeATS = async ({ data }: { data: any }) => {
  return await apiFetch("/ai/analyze-ats", { method: "POST", body: JSON.stringify(data) });
};
