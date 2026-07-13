from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Any
import uuid
import urllib.parse
from app.dependencies import get_db, get_current_user
from app.models.models import User, Application, Job, InterviewQuestion, CoverLetter, LearningRoadmap
from app.services.ai_service import AIService

router = APIRouter(
    prefix="/ai",
    tags=["AI Functions Proxy"]
)

class ScreeningRequest(BaseModel):
    applicationId: str

@router.post("/screening")
def run_screening(
    req: ScreeningRequest, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        app_uuid = uuid.UUID(req.applicationId)
        app = db.query(Application).filter(Application.id == app_uuid).first()
    except Exception:
        app = None

    resume_text = app.resume_text if app else ""
    cover_note = app.cover_note if app else ""
    res = AIService.run_screening(resume_text, cover_note)
    
    if app:
        app.ai_score = res.get("score")
        app.ai_summary = res.get("summary")
        app.ai_strengths = res.get("strengths")
        app.ai_concerns = res.get("concerns")
        app.ai_recommendation = res.get("recommendation")
        db.commit()
        db.refresh(app)
        
    return res

@router.post("/interview-questions")
def generate_interview_questions(
    req: ScreeningRequest, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        app_uuid = uuid.UUID(req.applicationId)
        app = db.query(Application).filter(Application.id == app_uuid).first()
    except Exception:
        app = None

    role = app.job.title if (app and app.job) else "Software Engineer"
    questions = AIService.generate_interview_questions(role, "Intermediate", "Technical")
    
    if app:
        db_q = db.query(InterviewQuestion).filter(InterviewQuestion.application_id == app.id).first()
        if not db_q:
            db_q = InterviewQuestion(
                application_id=app.id,
                questions=questions,
                created_by=current_user.id
            )
            db.add(db_q)
        else:
            db_q.questions = questions
        db.commit()
        
    return {"questions": questions}

class ResumeSummaryRequest(BaseModel):
    jobId: str
    resumeText: str
    skills: str
    coverNote: Optional[str] = None

@router.post("/resume-summary")
def generate_resume_summary(req: ResumeSummaryRequest, current_user: User = Depends(get_current_user)):
    return AIService.generate_resume_summary(req.resumeText, req.skills, req.jobId, req.coverNote or "")

class JobMatchRequest(BaseModel):
    jobId: str
    resumeText: str
    skills: str

@router.post("/job-match")
def generate_job_match(req: JobMatchRequest, current_user: User = Depends(get_current_user)):
    return AIService.generate_job_match(req.resumeText, req.skills, req.jobId)

class ParseResumeRequest(BaseModel):
    resumeText: str

@router.post("/parse-resume")
def parse_resume_fields(req: ParseResumeRequest, current_user: User = Depends(get_current_user)):
    return AIService.parse_resume_fields(req.resumeText)

class CoverLetterRequest(BaseModel):
    jobTitle: str
    company: str
    jobDescription: str
    tone: str

@router.post("/cover-letter")
def generate_cover_letter(
    req: CoverLetterRequest, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    letter = AIService.generate_cover_letter(req.jobDescription, req.company, req.jobTitle)
    
    # Save cover letter to the database!
    db_cover_letter = CoverLetter(
        user_id=current_user.id,
        company_name=req.company,
        job_title=req.jobTitle,
        content=letter,
        tone=req.tone
    )
    db.add(db_cover_letter)
    db.commit()
    db.refresh(db_cover_letter)
    
    return {"letter": letter, "id": db_cover_letter.id}

class ATSRequest(BaseModel):
    resumeText: str
    jobDescription: str

@router.post("/match-resume-jd")
def match_resume_to_jd(req: ATSRequest, current_user: User = Depends(get_current_user)):
    return AIService.match_resume_to_jd(req.resumeText, req.jobDescription)

@router.post("/analyze-ats")
def analyze_resume_ats(req: ATSRequest, current_user: User = Depends(get_current_user)):
    return AIService.analyze_resume_ats(req.resumeText, req.jobDescription)

class MockQuestionsRequest(BaseModel):
    role: str
    difficulty: str
    type: str

@router.post("/mock-questions")
def generate_mock_questions(req: MockQuestionsRequest, current_user: User = Depends(get_current_user)):
    questions_list = AIService.generate_interview_questions(req.role, req.difficulty, req.type)
    return {
        "questions": [q.get("question", "") for q in questions_list]
    }

class MockGradeRequest(BaseModel):
    questions: List[str]
    answers: List[str]

@router.post("/mock-grade")
def grade_mock_session(req: MockGradeRequest, current_user: User = Depends(get_current_user)):
    return AIService.grade_mock_session(req.questions, req.answers)

class RoadmapRequest(BaseModel):
    currentSkills: str
    targetRole: str

@router.post("/roadmap")
def generate_learning_roadmap(
    req: RoadmapRequest, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Return 5 structured lessons with search helpers matching targetRole
    encoded_role = urllib.parse.quote(req.targetRole)
    lessons = [
        { "title": f"Fundamentals of {req.targetRole}", "duration": "2 hrs", "difficulty": "Easy", "category": "Core", "link": f"https://google.com/search?q={encoded_role}+fundamentals" },
        { "title": f"Intermediate {req.targetRole} Design", "duration": "3 hrs", "difficulty": "Medium", "category": "Design", "link": f"https://google.com/search?q={encoded_role}+architecture" },
        { "title": f"Advanced Patterns in {req.targetRole}", "duration": "4 hrs", "difficulty": "Hard", "category": "Advanced", "link": f"https://google.com/search?q={encoded_role}+advanced+coding" },
        { "title": f"Testing & CI/CD for {req.targetRole}", "duration": "2 hrs", "difficulty": "Medium", "category": "Testing", "link": f"https://google.com/search?q={encoded_role}+testing+tools" },
        { "title": f"Mock Reviews & Deployment", "duration": "3 hrs", "difficulty": "Easy", "category": "Interview", "link": f"https://google.com/search?q={encoded_role}+interview+prep" }
    ]
    
    # Save roadmap to the database!
    db_roadmap = LearningRoadmap(
        user_id=current_user.id,
        target_role=req.targetRole,
        current_skills=req.currentSkills,
        plan_json=json.dumps(lessons)
    )
    db.add(db_roadmap)
    db.commit()
    db.refresh(db_roadmap)
    
    return {"lessons": lessons, "id": db_roadmap.id}
