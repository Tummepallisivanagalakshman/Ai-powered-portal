from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, join
from sqlalchemy import func
from app.dependencies import get_db, get_current_user
from app.models.models import User, Resume, ResumeAnalysis, ATSScore, JobMatch, InterviewSession, JobTrackerItem

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
    Returns aggregated metrics for the user's dashboard card row.
    """
    # Count resumes uploaded by this user
    total_resumes = db.query(Resume).filter(Resume.user_id == current_user.id).count()

    # Average ATS score across all resumes belonging to this user
    avg_ats = (
        db.query(func.avg(ATSScore.score))
        .join(Resume, ATSScore.resume_id == Resume.id)
        .filter(Resume.user_id == current_user.id)
        .scalar()
    ) or 0.0

    # Count interview sessions
    total_interviews = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .count()
    )

    # Count job match records
    total_matches = (
        db.query(JobMatch)
        .filter(JobMatch.user_id == current_user.id)
        .count()
    )

    # Count active tracker items (not rejected / offered)
    active_applications = (
        db.query(JobTrackerItem)
        .filter(
            JobTrackerItem.user_id == current_user.id,
            JobTrackerItem.status.notin_(["Rejected", "Offered"])
        )
        .count()
    )

    # Latest ATS score for the most recent resume
    latest_ats = (
        db.query(ATSScore.score)
        .join(Resume, ATSScore.resume_id == Resume.id)
        .filter(Resume.user_id == current_user.id)
        .order_by(ATSScore.id.desc())
        .first()
    )

    return {
        "total_resumes": total_resumes,
        "average_ats_score": round(float(avg_ats), 1),
        "latest_ats_score": round(float(latest_ats[0]), 1) if latest_ats else None,
        "total_interviews": total_interviews,
        "total_job_matches": total_matches,
        "active_applications": active_applications,
    }
