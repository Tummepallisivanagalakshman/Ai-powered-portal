# AI Career Success Portal (TalentScreen)

A state-of-the-art, responsive, AI-powered Career Success Portal combined with role-based candidate screening. Candidates can optimize resumes, practice mock interviews, generate letters, and track pipelines while recruiters and managers screen applicants.

![Stack](https://img.shields.io/badge/React-19-61dafb) ![Stack](https://img.shields.io/badge/TanStack_Start-1.x-ff4154) ![Stack](https://img.shields.io/badge/Supabase-Backend-3ecf8e) ![Stack](https://img.shields.io/badge/Tailwind-v4-38bdf8)

---

## 🚀 Key Features

### 🌟 Candidate Career Workspace
- **ATS Resume Analyzer:** Instantly audits resumes against target job descriptions for formatting guidelines, missing keywords, and formatting density checkmarks.
- **ATS Score Auditor:** Detailed score parser checking headings, sections, links, and density values.
- **Job Match Analyzer:** Compares resumes against arbitrary job descriptions to estimate compatibility.
- **AI Mock Interview Simulator:** Sets customizable roles, difficulties, and types, prompting 3 tailored questions with active timers, followed by scoring grades (Technical, Communication, Confidence).
- **Personalized Learning Roadmaps:** Dynamically bridges skill gaps by generating 5 syllabus lessons based on target roles.
- **Cover Letter Generator:** Generates professional, copyable drafts using selected tone templates.
- **Interactive Resume Builder:** Supports building resumes across 7 key sections (Personal, Education, Skills, Experience, Projects, Certifications, Achievements) with live preview formatting.
- **AI Career Chatbot:** Real-time floating and full-page career helper leveraging Gemini context-aware conversations.
- **Job Tracker Kanban:** Visual pipeline manager tracking job stages (Interested, Applied, Interview, Offer, Rejected) persisted in `localStorage`.

### 🛡️ Recruiter & Hiring Manager Screenings
- **AI Candidate Screening:** Automatically evaluates applicant profiles, returning match scores, strengths/concerns, and interview questions.
- **Role-Based Workspaces:** Secure portals for Candidate, Recruiter, and Hiring Manager environments, gated server-side via Supabase.

---

## 🛣️ Core Routes

| Route | Access | Description |
| :--- | :--- | :--- |
| `/` | Public | Landing page with animated illustrations, FAQ, and footer |
| `/auth` | Public | Sign in / sign up credentials validator |
| `/candidate` | Candidate | User Dashboard with weekly gauges, stats, and charts |
| `/resume-analyzer` | Candidate | Drag-and-drop resume auditor |
| `/ats-score` | Candidate | Granite parse checker |
| `/job-match` | Candidate | JD comparator and recommendation reporter |
| `/mock-interview` | Candidate | AI grade questions and grader panel |
| `/roadmap` | Candidate | AI learning roadmap compiler |
| `/cover-letter` | Candidate | Draft generator |
| `/resume-builder` | Candidate | Form inputs and live formatted print preview |
| `/career-chat` | Candidate | Chatbot client with suggested pills |
| `/job-tracker` | Candidate | Kanban tracker pipeline board |
| `/reports` | Candidate | Weekly history reports |
| `/profile` | Candidate | Location, preferences, and skills updater |
| `/settings` | Candidate | Notifications, privacy, and account settings |
| `/recruiter` | Recruiter | Post and list vacancies, review applications |
| `/review/$applicationId` | Recruiter | Detailed screening dashboard & questions generator |
| `/manager` | Hiring Manager | Shortlisted reviews and recruiter notes decider |

---

## 🛠️ Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19, SSR) on [Vite](https://vitejs.dev)
- **Backend:** [Supabase](https://supabase.com) — Postgres Database, Auth, Storage
- **Styling:** Tailwind CSS v4 + Radix UI primitives
- **AI Engine:** Google Gemini (via Lovable AI Gateway)
- **Visuals:** Recharts tracking graphs

---

## 🚀 Getting Started

### Prerequisites
- Node.js / Yarn / Bun installed
- A Supabase project set up

### Installation & Run
```bash
# Install dependencies
yarn install

# Start the dev server (http://localhost:5000)
yarn dev

# Compile for production
yarn build
```

### Environment Variables (.env)
Create the following variables in your environment (do **not** commit secrets):
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
VITE_SUPABASE_PROJECT_ID=<your-project-ref>

# Server-side environment
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

---

## 📁 Project Structure

```
src/
├── routes/              # File-based routes (TanStack Router)
│   ├── _authenticated/  # Role-gated and workspace pages
│   └── ...
├── components/          # UI components (incl. Radix-based ui/ kit)
├── integrations/
│   └── supabase/        # Supabase clients, auth middleware, types
├── lib/                 # API calls, AI functions, helpers
└── hooks/               # Custom React hooks
supabase/
└── migrations/          # Database schema & policies
```

---

## 🔒 Security

- All data access is protected by Supabase Row-Level Security (RLS) policies — users can only read and write what their role permits.
- Permissions are enforced server-side via a `has_role()` security function; roles are never stored on client-editable tables.
- Secrets (Supabase keys, AI credentials) are supplied through environment variables and are never committed to the repository.

---

## 📄 License

This project is provided as-is for the repository owner.
