# AI Hiring & Candidate Screening Portal — Project Documentation

> Living document. Updated on **every** change to the project.
> Last updated: 2026-06-24

## 1. Overview

A role-based AI hiring and candidate screening portal. After login, each user
is redirected to a dashboard that matches their role. Role information is stored
in the database and pages are protected based on role.

## 2. User Roles

| Role | Capabilities |
|------|--------------|
| **Candidate** | View jobs, apply for jobs, upload resume, track application status |
| **HR / Recruiter** | Create/edit/delete job postings, view applications, run AI screening, shortlist/reject, generate interview questions |
| **Hiring Manager** | View shortlisted candidates, review AI summaries, approve/reject candidates |

Roles are stored in the `user_roles` table (never on `profiles`) and checked
with the `has_role()` security function.

## 3. Authentication & Routing

- Email/password + Google sign-in via Lovable Cloud (backend).
- After login, users are redirected to a role-specific dashboard:
  - Candidate → `/candidate`
  - Recruiter → `/recruiter`
  - Hiring Manager → `/manager`
- Protected routes live under `src/routes/_authenticated/` and are gated by
  the managed `_authenticated/route.tsx` layout plus `RoleGate`.

## 4. Pages / Routes

| Route | Role | Description |
|-------|------|-------------|
| `/` | public | Landing page |
| `/auth` | public | Login / sign up |
| `/candidate` | Candidate | Dashboard: stats (total/active/shortlisted/rejected), available jobs, recent activity |
| `/jobs` | Candidate | Job listings (cards) with Apply buttons |
| `/apply/$jobId` | Candidate | **Job Application page** (full form) |
| `/tracking` | Candidate | **Application Tracking page** — timeline + details per application |
| `/recruiter` | Recruiter | HR dashboard: stats + Job Management (CRUD) + applications list (links to review) |
| `/review/$applicationId` | Recruiter | **Candidate Review page** — details, resume, AI summary, match score, interview questions, HR actions |
| `/manager` | Hiring Manager | Shortlisted candidates, AI summaries, approve/reject |

## 5. Database Schema

### `profiles`
User-facing profile data (full_name, email). Readable by the owner and by
recruiters/managers.

### `user_roles`
`(user_id, role)` — the source of truth for permissions. Read-only to the app;
writes are blocked from clients.

### `jobs`
title, company, department, location, experience_required, employment_type,
description, requirements, skills[], status (open/closed), created_by.

### `applications`
job_id, candidate_id, **full_name, email, phone, education, skills,
experience**, resume_path, resume_text, cover_note, status
(applied/screening/shortlisted/interview_scheduled/approved/rejected),
AI fields (ai_score, ai_summary, ai_strengths, ai_experience, ai_concerns,
ai_recommendation), job-match fields (match_score, matching_skills,
missing_skills, match_recommendation), manager_notes. Unique per
(job_id, candidate_id).

> Status labels shown to users: applied → **Applied**, screening →
> **Screened**, shortlisted → **Shortlisted**, interview_scheduled →
> **Interview Scheduled**, approved → **Selected**, rejected → **Rejected**.

### `interview_questions`
AI-generated questions linked to an application. The AI Interview Question
Generator produces exactly 10 questions tailored to the job description, the
candidate's profile/resume, and their skills, balanced across **Technical**,
**Behavioral**, and **Scenario-based** categories. Stored as a JSON `questions`
array (`{ category, question }`). HR can regenerate at any time from the review
dialog (a new row is inserted; the latest set is shown grouped by category).


### Storage
- `resumes` bucket (private) — candidate resume uploads (PDF).

## 6. Feature Detail: Job Application Page (`/apply/$jobId`)

- Fields: Full Name, Email (prefilled), Phone Number, Education, Skills,
  Experience, Resume Upload (PDF only), Cover Letter (optional).
- Client-side validation with zod.
- On submit: resume uploaded to the `resumes` bucket, application saved to the
  database with **status = Applied**.
- Shows a success confirmation screen with links to the dashboard and jobs.
- Prevents duplicate applications to the same job.
- **AI Resume Summary**: on submit, the resume text + skills are analyzed
  against the job (Lovable AI, `generateResumeSummary` in `ai.functions.ts`).
  The generated **candidate summary** (`ai_summary`), **key strengths**
  (`ai_strengths`), **relevant experience** (`ai_experience`), and
  **recommended role fit** (`ai_recommendation`) are stored on the application
  at insert time. If AI is unavailable the application is still submitted.
  The summary is displayed to HR (recruiter) and Hiring Manager in their
  candidate review dialogs.
- **AI Job Match Scoring**: on submit, the candidate profile + resume is
  compared against the job (`generateJobMatch` in `ai.functions.ts`), producing
  a **match score** (`match_score`, 0–100), **matching skills**
  (`matching_skills`), **missing skills** (`missing_skills`), and a
  **recommendation** (`match_recommendation`: Strong / Good / Moderate / Weak
  Match). Stored on the application and shown in the HR dashboard as a list
  badge and an "AI job match" section in the review dialog. HR's "Run AI
  screening" also refreshes these fields (shared `computeJobMatch` helper).

## 7. Security

- `has_role()` is `SECURITY INVOKER`; `handle_new_user()` execution restricted.
- `profiles` SELECT restricted to owner + recruiters/managers (no email
  enumeration).
- `user_roles` writes blocked from clients (no privilege escalation).
- RLS enabled on all public tables with explicit GRANTs.

## 8. Feature Detail: Application Tracking Page (`/tracking`)

- Candidate-only page listing all of the user's applications.
- Each application shows a **timeline** across the pipeline: Applied →
  Screened → Shortlisted → Interview Scheduled → Selected, with a distinct
  **Rejected** end state. Completed stages are marked done, the current stage
  is highlighted, and upcoming stages are muted.
- A stage legend at the top shows the count of applications in each stage.
- "View details" opens a dialog with the timeline, position info, the
  candidate's submitted details, resume link, AI screening feedback (if any),
  and notes.

## 9. Change Log

- **2026-06-24** — Extended job-description visibility to the rest of the
  candidate journey and fixed a dialog hydration error.
  - Job listings (`/jobs`): each open-role card now shows a 3-line clamped
    description preview (before applying).
  - Application tracking (`/tracking`): the details dialog's "Position" section
    now includes the full "Job description" (after applying). Added
    `description` to `ApplicationWithJob` and the `listMyApplications` join
    (`jobs(... , description)`).
  - Fixed an invalid-DOM-nesting/hydration error in the tracking details dialog:
    `StatusBadge` (renders a `<div>`) was nested inside `DialogDescription`
    (a `<p>`). Moved the status badge + applied-date into a sibling `<div>` and
    gave `DialogDescription` plain text.


- **2026-06-24** — Apply page (`/apply/$jobId`) now shows the full job
  description in all three states (before applying in the sticky job-summary
  sidebar, in the "already applied" view, and in the post-submit confirmation),
  via a shared `JobDescription` component. Added live/real-time behaviour: the
  page subscribes to Postgres changes on `jobs` (this job) and `applications`
  (this candidate) and invalidates the relevant React Query caches, so job
  detail edits and application-status changes appear without a refresh. A "Live"
  pulse indicator is shown on the application form. Enabled Realtime via
  migration: `REPLICA IDENTITY FULL` + `supabase_realtime` publication for the
  `jobs` and `applications` tables.


- **2026-06-24** — Made the `AppShell` header logo (Briefcase + "TalentScreen")
  a clickable `Link` that navigates to the signed-in user's role dashboard
  (`/candidate`, `/recruiter`, or `/manager`), falling back to `/` when no role
  is resolved. Added a subtle hover state on the logo.


- **2026-06-24** — Landing page (`/`) interactivity pass for higher engagement.
  Added reusable `Reveal` and `CountUp` components (`src/components/Reveal.tsx`):
  `Reveal` fades/slides sections in on scroll via IntersectionObserver; `CountUp`
  animates the hero stat numbers when scrolled into view. Applied scroll-reveal
  with staggered delays to the roles, features, and CTA sections; added hero
  entrance animations, a floating ambient glow, button hover/press micro-states
  (scale + arrow nudge), card hover-lift with scaling icon tiles, and a hover
  zoom on the hero image. All animations respect `prefers-reduced-motion`.
  Purely presentational — no data/logic changes.


- **2026-06-24** — Candidate-side UI/UX refresh with motion. Added reusable
  animation/interaction utilities to `src/styles.css` (`animate-fade-up`,
  `animate-scale-in`, `animate-pop-in`, `float-soft`, `hover-lift`,
  `bg-brand-soft`, plus a `prefers-reduced-motion` guard). Redesigned the
  candidate dashboard, job listings, application tracking, and apply pages with
  rounded-2xl elevated cards, icon-tile section headers, gradient hover accents,
  staggered entrance animations, hover-lift cards, animated apply buttons, and a
  pulsing current-stage node on the tracking timeline. Purely presentational —
  no data/logic changes.


- **2026-06-24** — Added an AI assistant chatbot available to every role across
  the portal. A floating launcher (`src/components/ChatWidget.tsx`) is mounted in
  `AppShell`, so it appears on all authenticated pages for candidates, HR/recruiters,
  and hiring managers. Messages go through `chatWithAssistant`
  (`src/lib/chat.functions.ts`), an auth-protected server function that resolves
  the caller's role server-side, builds role-specific context (a candidate's own
  applications / open jobs, or a recruiter/manager pipeline snapshot), and replies
  via Lovable AI. The system prompt is tailored per role and enforces fair,
  unbiased hiring guidance. Conversations are single-session (not persisted).


- **2026-06-24** — Resume auto-fill on the application page (`/apply/$jobId`):
  uploading a PDF resume now extracts its text in the browser (`src/lib/pdf.ts`
  via `pdfjs-dist`) and uses AI (`parseResumeFields` in `ai.functions.ts`) to
  auto-fill full name, email, phone, education, skills, and experience.
  Already-entered values are preserved; a progress indicator shows while
  parsing and submit is disabled during it.


- **2026-06-24** — Disabled leaked-password protection (HIBP) in auth config so
  common passwords are no longer rejected at sign-up (users kept hitting the
  "password appeared in a data breach" 422). Removed the breach-rejection hint
  from the sign-up form (now just "Use at least 6 characters"). Note: this
  weakens password security; re-enable HIBP if stronger protection is wanted.


- **2026-06-24** — SEO/a11y fixes: added an `<h2>` heading to the homepage
  Features section; associated the sign-up role `Select` with its `Label`
  (`htmlFor`/`id="signup-role"`); added unique per-route `head()` metadata
  (title, description, og:title, og:description) plus `robots: noindex,nofollow`
  to all authenticated dashboard routes (jobs, candidate, recruiter, manager,
  tracking, dashboard, apply, review) so they no longer share the root title.


- **2026-06-24** — Fixed confusing signup failures. Root cause: leaked-password
  protection (HIBP) is enabled, so breached/common passwords (e.g. "Test123456")
  are rejected by the auth API with a 422 `weak_password`. Account creation
  itself was working (profile + role created via `handle_new_user` trigger for
  candidate, recruiter, and hiring_manager — verified end-to-end). Sign-up now
  surfaces a clear message ("password appeared in a data breach…" /
  "account already exists") and shows a password-strength hint under the field.


- **2026-06-24** — `/auth` visual refresh ("Modern atmospheric split"
  direction): rebuilt the brand panel with layered indigo/violet mesh glows over
  a deep dark base and a "Precision hiring powered by AI." headline, and
  restyled the form panel with pill-style tabs, uppercase tracked labels,
  rounded-xl inputs/select, and a taller primary CTA. All existing auth logic
  (login/signup tabs, role select, password show/hide, busy state) preserved.


- **2026-06-24** — Full UI/UX redesign: adopted a cool, minimalist design
  language. New typography (Space Grotesk display + DM Sans body), a refined
  near-neutral cool token palette in `src/styles.css` (light + dark), flatter
  shadows, tighter radius, and new `bg-grid`/`bg-dots` utilities + updated
  hero/text gradients. Rebuilt the landing page (sticky glass nav, grid-backed
  editorial hero with a stats row, hairline-divided feature grid, dotted CTA
  panel) and refreshed the `/auth` brand panel and the `AppShell` header to the
  new aesthetic with stronger responsive behavior.
- **2026-06-24** — Added light/dark theme support: new `ThemeProvider` +
  `useTheme` (`src/lib/useTheme.tsx`) persisting choice in `localStorage` with a
  flash-preventing init script in the root shell, plus a `ThemeToggle` button
  wired into the landing header, auth page, and the authenticated AppShell
  header. Also made the AppShell sign-out label collapse to an icon on mobile.


- **2026-06-24** — Auth redesign: rebuilt `/auth` as a modern split-screen
  layout — a branded gradient panel (logo, headline, AI feature highlights) on
  the left and a clean form on the right; collapses to a single centered column
  on mobile. Added a `--shadow-elegant` token.


- **2026-06-24** — Auth UX: added a "Back to home" link at the top of the
  `/auth` page.

- **2026-06-24** — Auth UX: added a show/hide password toggle (eye icon) to
  both the sign-in and create-account password fields.


- **2026-06-24** — SEO: added sitemap entries for `/candidate`, `/dashboard`,
  `/jobs`, `/manager`, and `/recruiter` to address the sitemap route coverage
  finding.

- **2026-06-24** — SEO: fixed skipped heading level on the jobs page
  (job titles `h3` → `h2` to follow the AppShell `h1`).


- **2026-06-24** — SEO fixes: added an H1 to the auth page and corrected the
  apply page heading order; gave the homepage and auth page unique
  titles/descriptions, self-referencing canonical + og:url, and unique og
  tags; added WebSite + Organization JSON-LD to the root route; added a
  `Sitemap:` line to robots.txt and absolute URLs in the sitemap; added
  `public/llms.txt`.


- **2026-06-24** — Added dedicated Candidate Review page
  (`/review/$applicationId`): shows candidate details, resume (PDF + text),
  AI resume summary, AI job match score, and categorized interview questions,
  plus HR actions (Shortlist, Move to Interview, Reject) that update the
  application status automatically. The HR dashboard applications list now
  links to this page.


- **2026-06-24** — Enhanced AI Interview Question Generator: now generates 10
  questions based on job description, candidate profile, and skills, balanced
  across Technical, Behavioral, and Scenario-based categories; HR can regenerate
  questions from the review dialog, where they display grouped by category.


- **2026-06-24** — Added AI Job Match Scoring: candidate profile + resume is
  compared against the job, producing a match score (0–100), matching skills,
  missing skills, and a recommendation (Strong / Good / Moderate / Weak Match);
  added `match_score/matching_skills/missing_skills/match_recommendation`
  columns. Generated at apply time and refreshed by HR's "Run AI screening";
  results shown in the HR dashboard (list badge + review dialog "AI job match").


- **2026-06-24** — Job listings: clicking a job title or "View details" now opens
  a full job details dialog (company, department, location, experience,
  employment type, full description, requirements, and all required skills) with
  an "Apply now" action, so candidates can review complete role details before
  applying.


- **2026-06-24** — Added AI Resume Summary: candidates' resumes are analyzed at
  apply time generating candidate summary, key strengths, relevant experience,
  and recommended role fit; added `ai_experience` column; summary stored on the
  application and shown to HR and Hiring Manager review dialogs.

- **2026-06-24** — Added Application Tracking page (`/tracking`) with pipeline
  timeline and details dialog; added `interview_scheduled` status; relabeled
  Screening→Screened and Approved→Selected.
- **2026-06-24** — Added Job Application page (`/apply/$jobId`) with full
  applicant fields; added `full_name/email/phone/education/skills/experience`
  columns to `applications`; replaced the inline apply dialog with the page.
- **2026-06-24** — Security hardening (has_role invoker, profiles/email
  exposure, user_roles insert policy).
- **2026-06-24** — Job Listings page, HR Dashboard + Job Management CRUD,
  Candidate Dashboard, role-based auth and dashboards.
