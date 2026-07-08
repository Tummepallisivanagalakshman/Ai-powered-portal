from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import SessionLocal
from app.dependencies import get_db, get_current_user
from app.models.models import User, JobMatch, Resume
import random

router = APIRouter(
    prefix="/jobs",
    tags=["Job Matching"]
)

class JobMatchRequest(BaseModel):
    resume_id: int
    job_description: str

class JobMatchResponse(BaseModel):
    id: int
    match_percentage: float
    matching_skills: str
    missing_skills: str
    hiring_probability: str
    model_config = {"from_attributes": True}

@router.post("/match", response_model=JobMatchResponse)
def match_job(
    request: JobMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == request.resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    # In a real app, send resume.extracted_text and request.job_description to AI Service.
    match_percentage = random.uniform(50.0, 98.0)
    
    db_match = JobMatch(
        user_id=current_user.id,
        resume_id=resume.id,
        job_description=request.job_description,
        match_percentage=round(match_percentage, 2),
        matching_skills="Python, FastAPI, SQL",
        missing_skills="Docker, AWS",
        hiring_probability="High" if match_percentage > 80 else "Medium"
    )
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    
    return db_match
