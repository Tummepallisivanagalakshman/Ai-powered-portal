from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    file_name: str
    extracted_text: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

class ATSScoreResponse(BaseModel):
    id: int
    resume_id: int
    score: float
    missing_keywords: Optional[str]
    formatting_issues: Optional[str]
    strengths: Optional[str]
    weaknesses: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
