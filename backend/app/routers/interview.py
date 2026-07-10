from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import SessionLocal
from app.dependencies import get_db, get_current_user
from app.models.models import User, InterviewSession, InterviewAnswer
from app.services.ai_service import AIService
from app.routers.notifications import create_user_notification

router = APIRouter(
    prefix="/interviews",
    tags=["Mock Interviews"]
)

class InterviewSessionCreate(BaseModel):
    job_role: str
    difficulty: str

class InterviewAnswerCreate(BaseModel):
    session_id: int
    question: str
    answer: str

@router.post("/sessions")
def create_interview_session(
    request: InterviewSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_session = InterviewSession(
        user_id=current_user.id,
        job_role=request.job_role,
        difficulty=request.difficulty
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.post("/answers/evaluate")
def evaluate_and_save_answer(
    request: InterviewAnswerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify session belongs to user
    session = db.query(InterviewSession).filter(
        InterviewSession.id == request.session_id, 
        InterviewSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    try:
        evaluation = AIService.evaluate_interview_answer(request.question, request.answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI evaluation failed: {e}")
        
    db_answer = InterviewAnswer(
        session_id=session.id,
        question=request.question,
        answer=request.answer,
        score=evaluation.get("score", 0),
        feedback=evaluation.get("feedback", ""),
        better_answer=evaluation.get("better_answer", "")
    )
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    
    # Trigger notification
    try:
        create_user_notification(
            db,
            current_user.id,
            "Interview Graded",
            f"Your response for '{session.job_role}' mock interview has been graded. Score: {evaluation.get('score', 0)}/100.",
            "interview"
        )
    except Exception as e:
        print(f"Failed to generate notification: {e}")
        
    return db_answer
