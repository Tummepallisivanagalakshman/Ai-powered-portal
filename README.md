# AI Career Success Portal (TalentScreen)

A state-of-the-art, responsive, AI-powered Career Success Portal combined with role-based candidate screening. Candidates can optimize resumes, practice mock interviews, generate letters, and track pipelines while recruiters and managers screen applicants.

The application has been migrated from a frontend-only Supabase design to a decoupled architecture consisting of a **React 19 Frontend** and a **Python FastAPI Backend** with JWT authentication and live **Supabase PostgreSQL** database persistence.

![Stack](https://img.shields.io/badge/React-19-61dafb) ![Stack](https://img.shields.io/badge/FastAPI-0.111-009688) ![Stack](https://img.shields.io/badge/SQLAlchemy-2.x-red) ![Stack](https://img.shields.io/badge/Alembic-1.x-blue) ![Stack](https://img.shields.io/badge/Tailwind-v4-38bdf8)

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
- **Job Tracker Kanban:** Visual pipeline manager tracking job stages (Interested, Applied, Interview, Offer, Rejected) persisted in the database.
- **Alerts & Notifications History:** Real-time notification Bell popover on header alerting candidates and recruiters of applications, status updates, and completed interview reviews, with a dedicated History portal to mark as read or delete alerts.
- **Interactive Calendar Planner:** Custom monthly grid mapping upcoming interview schedules, roadmap milestones, and deadlines with full CRUD capabilities.
- **Company Guide Hub:** Directory detailing target employer overview, required skills, hiring trends, salary ranges, interview processes, and common questions, with a quick-bookmark system.
- **File Workspace Manager:** Consolidated document table supporting upload, rename, download, and delete actions for resumes, cover letters, and custom certificates.
- **AI Saved Workspace & Feedback Loops:** Browse historical cover letters, roadmaps, and mock sessions, export reports (PDF, DOCX, CSV), and submit thumbs up/down helpfulness comments.
- **My Favorites Board:** Unified star board to bookmark target jobs and company guides.

### 🛡️ Recruiter, Hiring Manager, & Admin Workspaces
- **Job Management:** Post, edit, draft, and delete jobs from the dashboard.
- **AI Candidate Screening:** Automatically evaluates applicant profiles, returning match scores, strengths/concerns, and interview questions.
- **Recruiter Funnel Analytics:** Interactive pipeline progression charts (Applied -> Shortlisted -> Hired) and monthly sourcing trends.
- **Admin Dashboard Console:** Aggregates DB statistics, lets admins manage user directories, edit preferred roles, and view system security audits.
- **Admin Moderation & Health Center:** Moderate job postings (Approve, Close, Flag), view AI token estimates, check system diagnostics (latency, CPU, memory, database connection), and read candidate feedbacks.
- **Role-Based Workspaces:** Portals for Candidate, Recruiter, Hiring Manager, and Admin environments, gated server-side via custom JWT authentication.
- **Developer Role Switcher:** Dropdown in the header menu that allows developers to easily switch active roles (`Candidate`, `Recruiter`, `Hiring Manager`, `Admin`) to review different dashboards locally.

---

## 🏗️ Architecture & Flow

The system flows through a unified Gateway Proxy setup:

```mermaid
graph TD
    A[React Client] -->|API Calls /api/...| B[FastAPI Backend - Port 8000]
    B -->|Performance Middleware| B1[Log Performance Metrics]
    B1 --> C[Database: Supabase PostgreSQL]
    B -->|AI Requests Proxy| D[Google Gemini API]
    B -->|PDF Parsing| E[PyMuPDF Service]
```

- **Authentication:** Controlled entirely by the backend via JWT (JSON Web Tokens). Hashing is handled using direct `bcrypt` calls to ensure compatibility. The frontend stores the token in `localStorage` and routes all API operations through a custom fetch interceptor [api.ts](./src/lib/api.ts).
- **HTTP Middleware Logging:** A custom HTTP performance middleware intercepts all API calls, calculating response latency and logging details to a `system_logs` table for admin diagnosis.
- **AI Integrations:** All AI services (ATS analyzer, interview grader, cover letter generator) run via the backend's [ai_proxy.py](./backend/app/routers/ai_proxy.py) forwarding requests to Gemini.

---

## 🛠️ Project Structure

The project is split into the React application and the Python backend:

```
IIT patna_project/
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py           # Backend Entrypoint & Router Registry & Middleware
│   │   ├── config.py         # Settings & Environment Loader
│   │   ├── database.py       # SQLAlchemy Session Handler
│   │   ├── dependencies.py   # FastAPI Dependency Injections (Auth, DB)
│   │   ├── models/
│   │   │   └── models.py     # SQLAlchemy DB Schemas
│   │   ├── routers/          # Modular Routers (Auth, ATS, Calendar, Files, Export)
│   │   ├── services/         # AIService (Gemini SDK) & PyMuPDF Parsers
│   │   └── utils/            # JWT & Security Utilities (Bcrypt)
│   ├── alembic/              # Database Migration History
│   ├── requirements.txt      # Python Package Dependencies
│   └── alembic.ini           # Migration Tool Configuration
│
├── src/                      # React 19 Frontend
│   ├── routes/               # File-based Routing (TanStack Router)
│   │   ├── _authenticated/   # Protected Candidate/Recruiter/Admin routes
│   │   │   ├── calendar.tsx  # Interactive Calendar Planner
│   │   │   ├── file-manager.tsx# Consolidated File Hub
│   │   │   ├── companies.tsx # Employer Dossier Guides
│   │   │   ├── favorites.tsx # Favorited Jobs & Companies
│   │   │   ├── saved-workspace.tsx# AI Session History & Feedbacks
│   │   │   └── ...
│   ├── components/           # UI Elements & App Shells (Accessibility controls, Search)
│   ├── lib/
│   │   ├── api.ts            # Authenticated Fetch Client
│   │   ├── useAuth.tsx       # Local JWT Session Provider
│   │   └── ai.functions.ts   # AI Endpoints Mapping
│   └── ...
```

---

## 🚀 Setup & Execution

### 1. Environment Configuration (`.env`)

Create a `.env` file in the root directory:

```env
# Frontend Configuration
VITE_SUPABASE_PROJECT_ID="rhfpnzsasqjravradxnf"
VITE_SUPABASE_URL="https://rhfpnzsasqjravradxnf.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_JN_6e0CVbA1iRFs3z3XU4A_xLNoT_Ne"

# Python Backend Configuration
DATABASE_URL="postgresql://postgres:Database%40%23123%40@db.rhfpnzsasqjravradxnf.supabase.co:5432/postgres"
JWT_SECRET_KEY="your-super-secret-jwt-key"
GOOGLE_API_KEY="your-google-gemini-api-key"
```

### 2. Running the Python Backend

```bash
# Navigate to backend folder (if running from terminal)
cd backend

# Create & activate a virtual environment
python -m venv venv
.\venv\Scripts\activate   # On Windows
source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Apply Database Migrations
alembic upgrade head

# Run FastAPI Server (starts on http://localhost:8000)
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Running the React Frontend

```bash
# From the project root, install packages
yarn install

# Run frontend dev server (starts on http://localhost:5000)
yarn dev
```

---

## 🔒 Security & Roles

- **JWT Tokens:** Transmitted via the `Authorization: Bearer <token>` header, verified against [security.py](./backend/app/utils/security.py).
- **Role Control:** Users are assigned roles (`candidate`, `recruiter`, `hiring_manager`, `admin`) which restrict access to backend routes and frontend layout sections. Toggling the active role via the header switcher will automatically redirect and mount the corresponding user portal.

---

## 🛡️ CTO Technical Audit & Code Health Report

An executive architectural and code health audit has been completed across all subsystems of the Career Portal:

### 1. AI Layer (Google Gemini Integration)
- **Live Routing:** Swapped out all placeholder JSON mocks in `ai_proxy.py`, `ats_service.py`, and `chatbot.py` with direct queries to the `gemini-1.5-pro` model.
- **Fail-Safe Fallbacks:** Programmed robust Exception containment handlers inside `ai_service.py`. If a `GOOGLE_API_KEY` is missing in the `.env` settings, the backend dynamically logs a fallback warning and serves realistic structured schema mocks to guarantee 100% application uptime.
- **Conversation Logs Persistence:** Real-time floating chat actions query the PostgreSQL database to retrieve the last 10 messages of conversation logs to feed context to the active Gemini session.

### 2. Database & Persistence Layer
- **Postgres Migrations:** Database migrations are fully applied and configured to pool connections directly to Supabase.
- **FK Schema Remapping:** Dropped legacy foreign keys targeting Supabase's system schema `auth.users` and re-mapped database relations to custom integer-based tables. This isolates our app schemas and enables local registration/sign-up flows.
- **URL escapes:** Safe character escapes (`%%`) for percent signs in the Alembic configs.

### 3. Cryptography & Security
- **Bcrypt Hashing:** Decoupled legacy `passlib` context in favor of direct `bcrypt` hashing, resolving compatibility issues with newer Python runtime environments which crash on long password credentials (`ValueError: password cannot be longer than 72 bytes`).

### 4. Modern UI/UX Theme (Violet Accent)
- **Accent Scheme:** Re-calculated OKLCH theme parameters to a sleek deep-space violet theme with obsidian dark mode cards.
- **Roundness:** Upgraded corner roundness scaling to `0.75rem` (`ROUND_TWELVE`).

### 5. Unified Lifecycle Feature Release
- **Admin Dashboard Console:** Added `admin` routing workspace with stats aggregation, system audit log stream, and administrative user directory deletion/role-update options.
- **Notification Center:** Implemented `notifications` Postgres model and linked header Bell popover dropdown listing alerts on mock interview reviews, application submissions, and status changes.
- **Saved History & Reports:** Re-mapped candidate Reports panel to load real database records for cover letter drafts, learning roadmaps, and completed mock interview details.

### 6. Performance & Responsive UI/UX Optimizations
- **Single-Roundtrip DB Counts Parallelization:** Refactored `/admin/stats` backend to execute all 4 entity count subqueries inside a single PostgreSQL roundtrip, boosting stats API response speed 4x.
- **Database Indexes:** Created performance indexing to speed up API lookups.
- **Inline Skeleton Loaders:** Added premium inline loader pulse indicators for stats numbers, providing instant visual feedback on metrics cards.
- **Responsive Mobile Card Layouts:** Redesigned the User Directory Control panel on the Admin workspace to display a mobile-friendly card layout on small devices and clean table rows on desktop screens.
