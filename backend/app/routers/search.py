from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict, Any
from app.dependencies import get_db, get_current_user
from app.models.models import User, Job, Company, LearningRoadmap, CoverLetter, InterviewSession

router = APIRouter(
    prefix="/search",
    tags=["Global Search"]
)

@router.get("/", response_model=Dict[str, List[Any]])
def global_search(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search universally across jobs, companies, candidates, roadmaps, cover letters, and interviews.
    """
    search_pattern = f"%{q}%"
    results = {
        "jobs": [],
        "companies": [],
        "roadmaps": [],
        "cover_letters": [],
        "interviews": [],
        "candidates": []
    }

    # 1. Search Jobs
    jobs = db.query(Job).filter(
        or_(
            Job.title.ilike(search_pattern),
            Job.description.ilike(search_pattern),
            Job.location.ilike(search_pattern)
        )
    ).limit(10).all()
    results["jobs"] = [{"id": str(j.id), "title": j.title, "company": j.company, "location": j.location} for j in jobs]

    # 2. Search Companies
    companies = db.query(Company).filter(
        or_(
            Company.name.ilike(search_pattern),
            Company.overview.ilike(search_pattern),
            Company.industry.ilike(search_pattern)
        )
    ).limit(10).all()
    results["companies"] = [{"id": c.id, "name": c.name, "industry": c.industry} for c in companies]

    # 3. Search Roadmaps
    roadmaps = db.query(LearningRoadmap).filter(
        LearningRoadmap.user_id == current_user.id
    ).filter(
        or_(
            LearningRoadmap.target_role.ilike(search_pattern),
            LearningRoadmap.current_skills.ilike(search_pattern),
            LearningRoadmap.roadmap_text.ilike(search_pattern)
        )
    ).limit(5).all()
    results["roadmaps"] = [{"id": r.id, "target_role": r.target_role, "created_at": r.created_at} for r in roadmaps]

    # 4. Search Cover Letters
    letters = db.query(CoverLetter).filter(
        CoverLetter.user_id == current_user.id
    ).filter(
        or_(
            CoverLetter.company_name.ilike(search_pattern),
            CoverLetter.job_title.ilike(search_pattern),
            CoverLetter.content.ilike(search_pattern)
        )
    ).limit(5).all()
    results["cover_letters"] = [{"id": l.id, "company_name": l.company_name, "job_title": l.job_title} for l in letters]

    # 5. Search Interviews
    interviews = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id
    ).filter(
        InterviewSession.job_role.ilike(search_pattern)
    ).limit(5).all()
    results["interviews"] = [{"id": i.id, "job_role": i.job_role, "score": i.total_score} for i in interviews]

    # 6. Search Candidates (only if current_user is recruiter/admin)
    if current_user.preferred_roles in ["admin", "recruiter"]:
        candidates = db.query(User).filter(
            or_(
                User.name.ilike(search_pattern),
                User.email.ilike(search_pattern),
                User.skills.ilike(search_pattern)
            )
        ).limit(10).all()
        results["candidates"] = [{"id": c.id, "name": c.name, "email": c.email, "skills": c.skills} for c in candidates]

    return results
