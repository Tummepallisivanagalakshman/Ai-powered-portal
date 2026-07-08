from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI App
app = FastAPI(
    title="AI Career Success Portal - Python Backend",
    description="Production-Ready FastAPI Backend handling AI artifact persistence, ATS analysis, and Jobs.",
    version="1.0.0"
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    """
    Basic health check to ensure the API is running.
    """
    return {"status": "ok", "message": "Python backend is live."}

# Register Core AI/Tracker Routers (from Phase 1 prototype)
from app.routers import (
    auth, users, resume, ats, jobs,
    chatbot, dashboard, reports,
    job_tracker, roadmap, interview,
    cover_letter, ai_proxy
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(resume.router, prefix="/api")
app.include_router(ats.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(job_tracker.router, prefix="/api")
app.include_router(roadmap.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(cover_letter.router, prefix="/api")
app.include_router(ai_proxy.router, prefix="/api")
