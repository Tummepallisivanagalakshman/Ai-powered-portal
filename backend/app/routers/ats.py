from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.dependencies import get_db, get_current_user
from app.models.models import User, Resume, ATSScore
from app.schemas.resume import ATSScoreResponse
from app.services.ats_service import ATSService

router = APIRouter(
    prefix="/ats",
    tags=["ATS Analysis"]
)

@router.post("/{resume_id}/analyze", response_model=ATSScoreResponse)
def analyze_resume_ats(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers an ATS analysis on an existing uploaded resume.
    """
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    if not resume.extracted_text:
        raise HTTPException(status_code=400, detail="Resume has no extracted text to analyze")

    analysis_data = ATSService.analyze_resume(resume.extracted_text)
    
    # Save to database
    db_ats_score = ATSScore(
        resume_id=resume.id,
        score=analysis_data["score"],
        missing_keywords=analysis_data["missing_keywords"],
        formatting_issues=analysis_data["formatting_issues"],
        strengths=analysis_data["strengths"],
        weaknesses=analysis_data["weaknesses"]
    )
    db.add(db_ats_score)
    db.commit()
    db.refresh(db_ats_score)
    
    return db_ats_score
