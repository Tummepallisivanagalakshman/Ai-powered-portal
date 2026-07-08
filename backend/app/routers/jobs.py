from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.dependencies import get_db, get_current_user
from app.models.models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class JobOut(BaseModel):
    id: int
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills: Optional[List[str]] = None
    status: Optional[str] = "open"
    created_at: Optional[str] = None
    model_config = {"from_attributes": True}

class ApplicationIn(BaseModel):
    fullName: str
    email: str
    phone: str
    education: str
    skills: str
    experience: str
    coverNote: Optional[str] = None
    resumeText: Optional[str] = None

class ApplicationOut(BaseModel):
    id: int
    job_id: int
    status: str
    created_at: Optional[str] = None

# ─── In-memory mock store (replace with DB model when ready) ─────────────────

MOCK_JOBS = [
    {
        "id": 1, "title": "Senior Frontend Engineer", "department": "Engineering",
        "location": "Remote", "status": "open",
        "description": "Lead the development of our React 19 frontend.",
        "requirements": "React, TypeScript, Node.js, 4+ years experience",
        "skills": ["React", "TypeScript", "Node.js", "Tailwind CSS"],
        "created_at": "2026-07-01"
    },
    {
        "id": 2, "title": "Python Backend Developer", "department": "Platform",
        "location": "Hyderabad, IN", "status": "open",
        "description": "Build scalable FastAPI microservices and manage PostgreSQL databases.",
        "requirements": "Python, FastAPI, PostgreSQL, Docker",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "created_at": "2026-07-03"
    },
    {
        "id": 3, "title": "AI/ML Engineer", "department": "AI Research",
        "location": "Bangalore, IN", "status": "open",
        "description": "Work on LLM fine-tuning and recommendation systems.",
        "requirements": "Python, PyTorch, Transformers, LLMs",
        "skills": ["Python", "PyTorch", "LLMs", "ML Ops"],
        "created_at": "2026-07-05"
    },
]

# Simple in-memory applications store
_applications: List[dict] = []
_app_id_counter = 1

# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[JobOut])
def list_open_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all open jobs."""
    return MOCK_JOBS

@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single job by ID."""
    job = next((j for j in MOCK_JOBS if j["id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/{job_id}/applied")
def check_applied(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if the current user has applied to a job."""
    applied = any(
        a["job_id"] == job_id and a["user_id"] == current_user.id
        for a in _applications
    )
    return {"applied": applied}

@router.post("/{job_id}/apply")
def apply_to_job(
    job_id: int,
    payload: ApplicationIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an application for a job."""
    global _app_id_counter

    job = next((j for j in MOCK_JOBS if j["id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    already = any(
        a["job_id"] == job_id and a["user_id"] == current_user.id
        for a in _applications
    )
    if already:
        raise HTTPException(status_code=400, detail="You have already applied to this job.")

    application = {
        "id": _app_id_counter,
        "job_id": job_id,
        "user_id": current_user.id,
        "status": "applied",
        "full_name": payload.fullName,
        "email": payload.email,
        "phone": payload.phone,
        "education": payload.education,
        "skills": payload.skills,
        "experience": payload.experience,
        "cover_note": payload.coverNote,
        "resume_text": payload.resumeText,
        "created_at": datetime.utcnow().isoformat()
    }
    _applications.append(application)
    _app_id_counter += 1
    return {"status": "success", "application_id": application["id"]}

@router.get("/applications/me")
def list_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all applications submitted by the current user with job details."""
    user_apps = [a for a in _applications if a["user_id"] == current_user.id]
    result = []
    for app in user_apps:
        job = next((j for j in MOCK_JOBS if j["id"] == app["job_id"]), {})
        result.append({**app, "jobs": job})
    return result
