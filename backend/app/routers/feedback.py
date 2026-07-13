from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.dependencies import get_db, get_current_user
from app.models.models import User, AIFeedback

router = APIRouter(
    prefix="/feedback",
    tags=["AI Feedback Loops"]
)

class FeedbackSubmit(BaseModel):
    target_type: str  # 'cover_letter', 'roadmap', 'ats', 'interview', 'chatbot'
    target_id: Optional[str] = None
    helpful: bool
    comment: Optional[str] = None

class FeedbackResponse(FeedbackSubmit):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=FeedbackResponse)
def submit_ai_feedback(
    payload: FeedbackSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log candidate's feedback on AI responses."""
    db_feedback = AIFeedback(
        user_id=current_user.id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        helpful=payload.helpful,
        comment=payload.comment
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

@router.get("/", response_model=List[FeedbackResponse])
def get_all_feedbacks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all submitted feedbacks (restricted to admins)."""
    if current_user.preferred_roles != "admin":
        raise HTTPException(status_code=403, detail="Admin permissions required")
    return db.query(AIFeedback).order_by(AIFeedback.created_at.desc()).all()
