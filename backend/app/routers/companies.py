from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.dependencies import get_db, get_current_user
from app.models.models import User, Company

router = APIRouter(
    prefix="/companies",
    tags=["Companies"]
)

class CompanyBase(BaseModel):
    name: str
    overview: Optional[str] = None
    industry: Optional[str] = None
    required_skills: Optional[str] = None
    hiring_trends: Optional[str] = None
    salary_range: Optional[str] = None
    interview_process: Optional[str] = None
    interview_questions: Optional[str] = None  # Comma separated

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

PRE_POPULATED_COMPANIES = [
    {
        "name": "Google",
        "overview": "Global technology leader focusing on search, AI, cloud computing, and hardware.",
        "industry": "Technology / AI",
        "required_skills": "Python, Java, C++, Go, Distributed Systems, Machine Learning",
        "hiring_trends": "Growing demand for Generative AI and Cloud Architects.",
        "salary_range": "$130,000 - $280,000",
        "interview_process": "1. Technical Phone Screen, 2. onsite loops (Coding, System Design, Leadership / Googliness).",
        "interview_questions": "Design a distributed rate limiter., Implement a search autocomplete suggestion system., How would you optimize query latency for millions of users?"
    },
    {
        "name": "Microsoft",
        "overview": "Empowering every person and organization to achieve more via cloud, OS, and productivity tools.",
        "industry": "Software / Cloud",
        "required_skills": "C#, .NET, Azure, SQL, TypeScript, React",
        "hiring_trends": "Strong hiring focus on Azure cloud engineering and security teams.",
        "salary_range": "$110,000 - $240,000",
        "interview_process": "1. Online assessment, 2. Technical panel interviews, 3. Architectural loop.",
        "interview_questions": "Reverse a linked list in chunks., Design a collaborative document editor like Word Online., Explain Azure Cosmos DB replication consistency levels."
    },
    {
        "name": "Meta",
        "overview": "Connecting people through social media platforms and defining the future of the metaverse.",
        "industry": "Social Media / VR",
        "required_skills": "PHP, Hack, Python, C++, React, PyTorch",
        "hiring_trends": "Hiring for infrastructure engineers and large language model optimization specialists.",
        "salary_range": "$140,000 - $310,000",
        "interview_process": "1. Coding pre-screen, 2. Onsite rounds (2 Coding, 1 System Design, 1 Behavioral).",
        "interview_questions": "Find the K closest points to the origin., Design Instagram Feed service architecture., Tell me about a time you resolved a major production database bottleneck."
    }
]

@router.get("/", response_model=List[CompanyResponse])
def get_companies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch all company profiles. Auto-populates a premium preset if DB is empty."""
    companies = db.query(Company).all()
    if not companies:
        # Auto populate standard templates to wow the user instantly
        for item in PRE_POPULATED_COMPANIES:
            db_comp = Company(**item)
            db.add(db_comp)
        db.commit()
        companies = db.query(Company).all()
    return companies

@router.get("/{company_id}", response_model=CompanyResponse)
def get_company_detail(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details for a single company profile."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")
    return company

@router.post("/", response_model=CompanyResponse)
def create_company(
    payload: CompanyBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new company profile to the directory."""
    if current_user.preferred_roles not in ["admin", "recruiter"]:
        raise HTTPException(status_code=403, detail="Unauthorized role")
    
    db_company = Company(
        name=payload.name,
        overview=payload.overview,
        industry=payload.industry,
        required_skills=payload.required_skills,
        hiring_trends=payload.hiring_trends,
        salary_range=payload.salary_range,
        interview_process=payload.interview_process,
        interview_questions=payload.interview_questions
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company
