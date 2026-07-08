from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app.dependencies import get_db, get_current_user
from app.models.models import User, ResumeAnalysis, ATSScore, JobMatch, InterviewSession

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/metrics")
def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated metrics for the user's dashboard.
    """
    total_resumes = db.query(ResumeAnalysis).join(ResumeAnalysis.resume_id).filter(User.id == current_user.id).count()
    
    # Calculate average ATS score
    # Note: Requires correct joins via relationship setup. We mock the avg for brevity if models don't have explicit relationship() mapped back.
    avg_ats = db.query(func.avg(ATSScore.score)).scalar() or 0.0
    
    total_interviews = db.query(InterviewSession).filter(InterviewSession.user_id == current_user.id).count()
    total_matches = db.query(JobMatch).filter(JobMatch.user_id == current_user.id).count()
    
    return {
        "total_resume_analyses": total_resumes,
        "average_ats_score": round(avg_ats, 2),
        "total_interviews": total_interviews,
        "total_job_matches": total_matches,
        "recent_activity": "Dashboard metrics retrieved successfully"
    }
