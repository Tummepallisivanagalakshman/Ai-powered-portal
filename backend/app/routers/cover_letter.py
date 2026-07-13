from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.dependencies import get_db, get_current_user
from app.models.models import User, CoverLetter, Resume
from app.services.ai_service import AIService

router = APIRouter(
    prefix="/cover-letter",
    tags=["Cover Letters"]
)

class CoverLetterRequest(BaseModel):
    resume_id: int
    company_name: str
    job_title: str

class CoverLetterResponse(BaseModel):
    id: int
    company_name: str
    job_title: str
    tone: str | None
    content: str
    model_config = {"from_attributes": True}

@router.get("/", response_model=list[CoverLetterResponse])
def list_my_cover_letters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all generated cover letters for the current user.
    """
    letters = db.query(CoverLetter).filter(CoverLetter.user_id == current_user.id).order_by(CoverLetter.id.desc()).all()
    return letters

@router.post("/generate", response_model=CoverLetterResponse)
def generate_and_save_cover_letter(
    request: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a Cover Letter using the AI Service and saves it to the database.
    """
    resume = db.query(Resume).filter(Resume.id == request.resume_id, Resume.user_id == current_user.id).first()
    if not resume or not resume.extracted_text:
        raise HTTPException(status_code=400, detail="Valid resume with extracted text is required")
        
    try:
        content = AIService.generate_cover_letter(
            resume_text=resume.extracted_text, 
            company=request.company_name, 
            title=request.job_title
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")
        
    db_cover_letter = CoverLetter(
        user_id=current_user.id,
        company_name=request.company_name,
        job_title=request.job_title,
        content=content,
        tone="Professional"
    )
    db.add(db_cover_letter)
    db.commit()
    db.refresh(db_cover_letter)
    
    return db_cover_letter
