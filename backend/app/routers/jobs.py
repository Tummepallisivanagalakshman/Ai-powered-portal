from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Any
from uuid import UUID, uuid4
from datetime import datetime
from app.dependencies import get_db, get_current_user
from app.models.models import User, Job, Application, InterviewQuestion
from app.routers.notifications import create_user_notification
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class JobInput(BaseModel):
    title: str
    company: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    experience_required: Optional[str] = None
    employment_type: Optional[str] = "Full-time"
    description: str
    requirements: Optional[str] = None
    skills: Optional[List[str]] = None
    status: Optional[str] = "open"

class JobOut(BaseModel):
    id: UUID
    title: str
    company: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    experience_required: Optional[str] = None
    employment_type: Optional[str] = None
    description: str
    requirements: Optional[str] = None
    skills: Optional[List[str]] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
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

class JobSimple(BaseModel):
    id: UUID
    title: str
    company: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    model_config = {"from_attributes": True}

class ApplicationWithDetails(BaseModel):
    id: UUID
    job_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    cover_note: Optional[str] = None
    resume_path: Optional[str] = None
    resume_text: Optional[str] = None
    
    # AI feedback fields
    ai_score: Optional[int] = None
    ai_summary: Optional[str] = None
    ai_strengths: Optional[str] = None
    ai_concerns: Optional[str] = None
    ai_recommendation: Optional[str] = None
    ai_experience: Optional[str] = None
    
    # Manager fields
    manager_notes: Optional[str] = None
    
    # Job match fields
    match_score: Optional[int] = None
    matching_skills: Optional[str] = None
    missing_skills: Optional[str] = None
    match_recommendation: Optional[str] = None
    
    # Associated Job
    jobs: Optional[JobSimple] = None
    model_config = {"from_attributes": True}

# ─── Job Endpoints ────────────────────────────────────────────────────────────

@router.get("", response_model=List[JobOut])
def list_open_jobs(db: Session = Depends(get_db)):
    """Return all open jobs (for candidate search)."""
    jobs = db.query(Job).filter(Job.status == "open").all()
    return jobs

@router.get("/my-jobs", response_model=List[JobOut])
@router.get("/my", response_model=List[JobOut])
def list_my_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all jobs (for recruiter dashboard)."""
    # For simplicity, recruiters see all jobs in the database.
    # In a fully scoped system, we would filter by created_by.
    jobs = db.query(Job).order_by(Job.created_at.desc()).all()
    return jobs

@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: UUID, db: Session = Depends(get_db)):
    """Get a single job by ID."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("", response_model=JobOut)
def create_job(
    payload: JobInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new job posting."""
    db_job = Job(
        title=payload.title,
        company=payload.company,
        department=payload.department,
        location=payload.location,
        experience_required=payload.experience_required,
        employment_type=payload.employment_type,
        description=payload.description,
        requirements=payload.requirements,
        skills=payload.skills,
        status=payload.status or "open"
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.put("/{job_id}", response_model=JobOut)
def update_job(
    job_id: UUID,
    payload: JobInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing job posting."""
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db_job.title = payload.title
    db_job.company = payload.company
    db_job.department = payload.department
    db_job.location = payload.location
    db_job.experience_required = payload.experience_required
    db_job.employment_type = payload.employment_type
    db_job.description = payload.description
    db_job.requirements = payload.requirements
    db_job.skills = payload.skills
    if payload.status:
        db_job.status = payload.status
        
    db.commit()
    db.refresh(db_job)
    return db_job

@router.patch("/{job_id}/status", response_model=JobOut)
def set_job_status(
    job_id: UUID,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle job status (open, closed, draft)."""
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    db_job.status = status
    db.commit()
    db.refresh(db_job)
    return db_job

@router.delete("/{job_id}")
def delete_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a job posting."""
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(db_job)
    db.commit()
    return {"status": "success", "message": "Job deleted"}

# ─── Application Endpoints ────────────────────────────────────────────────────

@router.get("/{job_id}/applied")
def check_applied(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if the current candidate email has applied to a specific job."""
    # Since candidate_id isn't linked to Auth UUID, we check candidate's email address
    applied = db.query(Application).filter(
        Application.job_id == job_id,
        Application.email == current_user.email
    ).first()
    return {"applied": applied is not None}

@router.post("/{job_id}/apply")
def apply_to_job(
    job_id: UUID,
    payload: ApplicationIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an application for a job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    already = db.query(Application).filter(
        Application.job_id == job_id,
        Application.email == payload.email
    ).first()
    
    if already:
        raise HTTPException(status_code=400, detail="You have already applied to this job.")

    # In a real scenario, we might extract resume fields if they aren't provided.
    db_app = Application(
        job_id=job_id,
        full_name=payload.fullName,
        email=payload.email,
        phone=payload.phone,
        education=payload.education,
        skills=payload.skills,
        experience=payload.experience,
        cover_note=payload.coverNote,
        resume_text=payload.resumeText,
        status="applied"
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    
    # Trigger notification
    try:
        create_user_notification(
            db, 
            current_user.id, 
            "Application Submitted", 
            f"You have successfully applied for the position of '{job.title}' at '{job.company or 'Company'}'.",
            "application"
        )
    except Exception as e:
        logger.error(f"Failed to generate application notification: {e}")

    return {"status": "success", "application_id": db_app.id}

@router.get("/applications/me", response_model=List[ApplicationWithDetails])
def list_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all applications submitted by the current user."""
    apps = db.query(Application).filter(Application.email == current_user.email).all()
    # Populate the associated jobs relationship manually if needed, 
    # but SQLAlchemy relationship handles it automatically.
    for app in apps:
        app.jobs = app.job
    return apps

@router.get("/applications/all", response_model=List[ApplicationWithDetails])
@router.get("/applications", response_model=List[ApplicationWithDetails])
def list_all_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all candidate applications (for recruiter/admin)."""
    apps = db.query(Application).order_by(Application.created_at.desc()).all()
    for app in apps:
        app.jobs = app.job
    return apps

@router.get("/applications/shortlisted", response_model=List[ApplicationWithDetails])
def list_shortlisted_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List shortlisted applications (for manager dashboard)."""
    apps = db.query(Application).filter(Application.status == "shortlisted").all()
    for app in apps:
        app.jobs = app.job
    return apps

@router.get("/applications/{app_id}", response_model=ApplicationWithDetails)
def get_application(
    app_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detail of a single application."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.jobs = app.job
    return app

@router.patch("/applications/{app_id}/status")
def update_application_status(
    app_id: UUID,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update status of a candidate application (applied, screening, shortlisted, rejected, etc)."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = status
    db.commit()

    # Trigger notification
    try:
        candidate_user = db.query(User).filter(User.email == app.email).first()
        if candidate_user:
            create_user_notification(
                db,
                candidate_user.id,
                "Application Update",
                f"Your application for '{app.job.title}' has been updated to '{status.capitalize()}'.",
                "application"
            )
    except Exception as e:
        logger.error(f"Failed to generate status change notification: {e}")

    return {"status": "success", "message": f"Application status updated to {status}"}

class DecisionPayload(BaseModel):
    decision: str
    notes: Optional[str] = None

@router.patch("/applications/{app_id}/decision")
def update_manager_decision(
    app_id: UUID,
    payload: DecisionPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record Hiring Manager's approval/rejection decision and notes."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app.status = "approved" if payload.decision == "approve" else "rejected"
    app.manager_notes = payload.notes
    db.commit()
    return {"status": "success", "message": f"Manager decision registered: {payload.decision}"}

@router.get("/applications/{app_id}/questions")
def list_questions(
    app_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch AI generated interview questions for an application."""
    questions = db.query(InterviewQuestion).filter(InterviewQuestion.application_id == app_id).all()
    return questions
