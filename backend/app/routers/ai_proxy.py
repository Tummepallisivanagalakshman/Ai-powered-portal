from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.dependencies import get_current_user
from app.models.models import User
# We can import the actual AIService once fully implemented, for now we mock the expected shapes matching the frontend
from app.services.ai_service import AIService

router = APIRouter(
    prefix="/ai",
    tags=["AI Functions Proxy"]
)

class ScreeningRequest(BaseModel):
    applicationId: str

@router.post("/screening")
def run_screening(req: ScreeningRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 85,
        "summary": "Strong candidate with relevant experience.",
        "strengths": "- React\n- TypeScript",
        "concerns": "- None",
        "recommendation": "Strong fit"
    }

@router.post("/interview-questions")
def generate_interview_questions(req: ScreeningRequest, current_user: User = Depends(get_current_user)):
    return {
        "questions": [
            {"category": "Technical", "question": "Explain React hooks."},
            {"category": "Behavioral", "question": "Tell me about a time you failed."},
            {"category": "Scenario-based", "question": "How would you design a rate limiter?"}
        ]
    }

class ResumeSummaryRequest(BaseModel):
    jobId: str
    resumeText: str
    skills: str
    coverNote: Optional[str] = None

@router.post("/resume-summary")
def generate_resume_summary(req: ResumeSummaryRequest, current_user: User = Depends(get_current_user)):
    return {
        "summary": "Great summary.",
        "strengths": "Very strong.",
        "experience": "5 years frontend.",
        "roleFit": "Strong fit for Senior Frontend Engineer"
    }

class JobMatchRequest(BaseModel):
    jobId: str
    resumeText: str
    skills: str

@router.post("/job-match")
def generate_job_match(req: JobMatchRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 90,
        "matchingSkills": "React, TS",
        "missingSkills": "GraphQL",
        "recommendation": "Strong Match"
    }

class ParseResumeRequest(BaseModel):
    resumeText: str

@router.post("/parse-resume")
def parse_resume_fields(req: ParseResumeRequest, current_user: User = Depends(get_current_user)):
    return {
        "fullName": "Jane Doe",
        "email": "jane@example.com",
        "phone": "555-0100",
        "education": "BS Computer Science",
        "skills": "Python, React",
        "experience": "Software Engineer 2020-Present"
    }

class CoverLetterRequest(BaseModel):
    jobTitle: str
    company: str
    jobDescription: str
    tone: str

@router.post("/cover-letter")
def generate_cover_letter(req: CoverLetterRequest, current_user: User = Depends(get_current_user)):
    return {"letter": "Dear Hiring Manager,\n\nI am very interested in this role."}

class ATSRequest(BaseModel):
    resumeText: str
    jobDescription: str

@router.post("/match-resume-jd")
def match_resume_to_jd(req: ATSRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 75,
        "matchingSkills": ["React"],
        "missingSkills": ["Node"],
        "hiringProbability": 70,
        "recommendation": "Good match"
    }

@router.post("/analyze-ats")
def analyze_resume_ats(req: ATSRequest, current_user: User = Depends(get_current_user)):
    return {
      "score": 88,
      "formattingChecks": [
        { "name": "File Structure", "score": 100, "status": "passed", "desc": "Clean." },
        { "name": "Section Headings", "score": 90, "status": "passed", "desc": "Good." },
        { "name": "Keyword Density", "score": 70, "status": "warning", "desc": "Okay." },
        { "name": "Quantified Metrics", "score": 60, "status": "warning", "desc": "Needs metrics." },
        { "name": "Contact & Links", "score": 100, "status": "passed", "desc": "Valid." }
      ],
      "missingKeywords": ["GraphQL"],
      "matchingKeywords": ["React"]
    }

class MockQuestionsRequest(BaseModel):
    role: str
    difficulty: str
    type: str

@router.post("/mock-questions")
def generate_mock_questions(req: MockQuestionsRequest, current_user: User = Depends(get_current_user)):
    return {
        "questions": ["Question 1?", "Question 2?", "Question 3?"]
    }

class MockGradeRequest(BaseModel):
    questions: List[str]
    answers: List[str]

@router.post("/mock-grade")
def grade_mock_session(req: MockGradeRequest, current_user: User = Depends(get_current_user)):
    return {
        "overallScore": 85,
        "technicalScore": 80,
        "communicationScore": 90,
        "confidenceScore": 85,
        "suggestions": ["Good job", "Speak louder"]
    }

class RoadmapRequest(BaseModel):
    currentSkills: str
    targetRole: str

@router.post("/roadmap")
def generate_learning_roadmap(req: RoadmapRequest, current_user: User = Depends(get_current_user)):
    return {
        "lessons": [
            { "title": "Lesson 1", "duration": "1 hr", "difficulty": "Easy", "category": "Core", "link": "https://react.dev" },
            { "title": "Lesson 2", "duration": "1 hr", "difficulty": "Easy", "category": "Core", "link": "https://react.dev" },
            { "title": "Lesson 3", "duration": "1 hr", "difficulty": "Easy", "category": "Core", "link": "https://react.dev" },
            { "title": "Lesson 4", "duration": "1 hr", "difficulty": "Easy", "category": "Core", "link": "https://react.dev" },
            { "title": "Lesson 5", "duration": "1 hr", "difficulty": "Easy", "category": "Core", "link": "https://react.dev" },
        ]
    }
