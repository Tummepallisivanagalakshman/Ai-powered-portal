# TalentScreen — AI Hiring & Candidate Screening Portal

A role-based hiring platform where candidates apply for jobs, recruiters screen applicants with AI, and hiring managers make confident decisions — all in one focused portal.

![Stack](https://img.shields.io/badge/React-19-61dafb) ![Stack](https://img.shields.io/badge/TanStack_Start-1.x-ff4154) ![Stack](https://img.shields.io/badge/Supabase-Backend-3ecf8e) ![Stack](https://img.shields.io/badge/Tailwind-v4-38bdf8)

## Overview

After signing in, every user is routed to a dashboard tailored to their role. Roles are stored in the database and every protected page is gated server-side, so each person only sees what they're allowed to.

## Features

- **Role-based workspaces** — separate dashboards for candidates, recruiters, and hiring managers
- **AI candidate screening** — resume parsing, fit scoring, strengths/concerns summaries, and interview-question generation (Google Gemini)
- **End-to-end pipeline** — post a job → apply → screen → shortlist → hire
- **Resume upload & auto-fill** — PDF resumes are parsed to pre-fill the application form
- **Secure auth** — email/password sign-in with row-level security on all data

## User Roles

| Role | Capabilities |
|------|--------------|
| **Candidate** | Browse jobs, apply, upload resume, track application status |
| **Recruiter** | Create/edit/delete job postings, view applications, run AI screening, shortlist/reject, generate interview questions |
| **Hiring Manager** | Review shortlisted candidates and AI summaries, approve/reject |

Roles live in the `user_roles` table (never on `profiles`) and are checked with a `has_role()` security function.

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/auth` | Public | Sign in / create account |
| `/candidate` | Candidate | Dashboard with stats, available jobs, recent activity |
| `/jobs` | Candidate | Job listings with apply buttons |
| `/apply/$jobId` | Candidate | Job application form |
| `/tracking` | Candidate | Application tracking timeline |
| `/recruiter` | Recruiter | Job management (CRUD) + applications list |
| `/review/$applicationId` | Recruiter | Candidate review: resume, AI summary, match score, interview questions |
| `/manager` | Hiring Manager | Shortlisted candidates, AI summaries, approve/reject |

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19, SSR) on [Vite](https://vitejs.dev)
- **Backend:** [Supabase](https://supabase.com) — Postgres, Auth, Storage
- **Styling:** Tailwind CSS v4 + Radix UI primitives
- **AI:** Google Gemini for screening, resume parsing, and the chat assistant
- **Data:** TanStack Query, React Hook Form, Zod
- **Runtime:** Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- A [Supabase](https://supabase.com) project

### Installation

```bash
# Install dependencies
bun install

# Start the dev server (http://localhost:5000)
bun run dev
```

### Environment Variables

Create the following variables in your environment (do **not** commit secrets):

```bash
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
VITE_SUPABASE_PROJECT_ID=<your-project-ref>

# Server-side (same values, used during SSR)
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
SUPABASE_PROJECT_ID=<your-project-ref>
```

### Database Setup

Apply the SQL migrations in `supabase/migrations/` to your Supabase project (in chronological order). They create the schema, row-level security policies, triggers, and the `resumes` storage bucket.

```bash
# Example: apply migrations with psql
for f in supabase/migrations/*.sql; do psql "$SUPABASE_DB_URL" -f "$f"; done
```

This creates the core tables: `profiles`, `user_roles`, `jobs`, `applications`, and `interview_questions`.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start the development server |
| `bun run build` | Build for production |
| `bun run preview` | Preview the production build |
| `bun run lint` | Run ESLint |
| `bun run format` | Format with Prettier |

## Project Structure

```
src/
├── routes/              # File-based routes (TanStack Router)
│   ├── _authenticated/  # Role-gated pages
│   └── ...
├── components/          # UI components (incl. Radix-based ui/ kit)
├── integrations/
│   └── supabase/        # Supabase clients, auth middleware, types
├── lib/                 # API calls, AI functions, helpers
└── hooks/               # Custom React hooks
supabase/
└── migrations/          # Database schema & policies
```

## Security

- All data access is protected by Supabase Row-Level Security (RLS) policies — users can only read and write what their role permits.
- Permissions are enforced server-side via a `has_role()` security function; roles are never stored on client-editable tables.
- Dependencies are kept patched against known CVEs (audited via `npm audit` / `bun`).
- Secrets (Supabase keys, AI credentials) are supplied through environment variables and are never committed to the repository.

## License

This project is provided as-is for the repository owner.
