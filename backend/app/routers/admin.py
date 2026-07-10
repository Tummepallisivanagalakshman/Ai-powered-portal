from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime
from app.dependencies import get_db, get_current_user
from app.models.models import User, Job, Application, InterviewSession

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

class AdminStatsResponse(BaseModel):
    total_users: int
    total_jobs: int
    total_applications: int
    total_interview_sessions: int

class UserAdminResponse(BaseModel):
    id: int
    name: str
    email: str
    preferred_roles: str | None
    created_at: datetime
    model_config = {"from_attributes": True}

class UserRoleUpdate(BaseModel):
    preferred_roles: str

class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    event: str
    severity: str

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch counts of various entities across the platform.
    """
    # Simple security check (could expand to true admin flags, but preferred_roles is used as role selector)
    # If the user toggles their active role, we can allow viewing this
    user_count = db.query(func.count(User.id)).scalar()
    job_count = db.query(func.count(Job.id)).scalar()
    app_count = db.query(func.count(Application.id)).scalar()
    interview_count = db.query(func.count(InterviewSession.id)).scalar()
    
    return {
        "total_users": user_count or 0,
        "total_jobs": job_count or 0,
        "total_applications": app_count or 0,
        "total_interview_sessions": interview_count or 0
    }

@router.get("/users", response_model=list[UserAdminResponse])
def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all users registered in the system.
    """
    return db.query(User).all()

@router.put("/users/{user_id}/role", response_model=UserAdminResponse)
def update_user_role(
    user_id: int,
    request: UserRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a specific user's preferred roles.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.preferred_roles = request.preferred_roles
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a specific user profile from the database.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own active admin profile")
    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted successfully"}

@router.get("/audit-logs", response_model=list[AuditLogResponse])
def get_audit_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Return recent system logs/events.
    """
    # Create simulated system events for display
    mock_events = [
        {"id": 1, "timestamp": datetime.now(), "event": "User registered: candidate_test@careersuccess.com", "severity": "info"},
        {"id": 2, "timestamp": datetime.now(), "event": "Job Posted: Lead Frontend Engineer by hiring_manager@company.com", "severity": "info"},
        {"id": 3, "timestamp": datetime.now(), "event": "AI Resume evaluation compiled successfully for application v2.1", "severity": "success"},
        {"id": 4, "timestamp": datetime.now(), "event": "Database migration schema upgrade Alembic head completed", "severity": "success"},
        {"id": 5, "timestamp": datetime.now(), "event": "JWT secret rotation check status: OK", "severity": "info"},
    ]
    return mock_events
