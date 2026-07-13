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

@router.get("/sessions")
def get_interview_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all mock interview sessions for the current user.
    """
    sessions = db.query(InterviewSession).filter(InterviewSession.user_id == current_user.id).order_by(InterviewSession.created_at.desc()).all()
    for session in sessions:
        if session.total_score is None:
            answers = db.query(InterviewAnswer).filter(InterviewAnswer.session_id == session.id).all()
            if answers:
                scores = [a.score for a in answers]
                session.total_score = sum(scores) / len(scores)
            else:
                session.total_score = 0.0
    return sessions

@router.get("/sessions/{session_id}")
def get_interview_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve details of a specific interview session.
    """
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session

@router.get("/sessions/{session_id}/feedback")
def get_interview_feedback(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve answers and scoring evaluation feedback for a specific session.
    """
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return {
        "id": session.id,
        "job_role": session.job_role,
        "difficulty": session.difficulty,
        "created_at": session.created_at,
        "total_score": session.total_score or 0.0,
        "answers": session.answers
    }

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
    
    # Update session score metrics
    answers = db.query(InterviewAnswer).filter(InterviewAnswer.session_id == session.id).all()
    if answers:
        scores = [a.score for a in answers]
        avg_score = sum(scores) / len(scores)
        session.total_score = avg_score
        session.technical_score = avg_score
        session.communication_score = avg_score
        session.confidence_score = avg_score
        db.commit()
    
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
        
    return {
        "id": db_answer.id,
        "session_id": db_answer.session_id,
        "question": db_answer.question,
        "answer": db_answer.answer,
        "score": db_answer.score,
        "feedback": db_answer.feedback,
        "better_answer": db_answer.better_answer
    }
