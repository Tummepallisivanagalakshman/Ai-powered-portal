from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.dependencies import get_db, get_current_user
from app.models.models import User, LearningRoadmap
from app.services.ai_service import AIService
import json

router = APIRouter(
    prefix="/roadmap",
    tags=["Learning Roadmaps"]
)

class RoadmapRequest(BaseModel):
    target_role: str
    current_skills: str

class RoadmapResponse(BaseModel):
    id: int
    target_role: str
    current_skills: str | None
    plan_json: str
    model_config = {"from_attributes": True}

@router.get("/", response_model=list[RoadmapResponse])
def list_my_roadmaps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all generated learning roadmaps for the current user.
    """
    roadmaps = db.query(LearningRoadmap).filter(LearningRoadmap.user_id == current_user.id).order_by(LearningRoadmap.id.desc()).all()
    return roadmaps

@router.post("/generate", response_model=RoadmapResponse)
def generate_and_save_roadmap(
    request: RoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a personalized Learning Roadmap using the AI Service and saves it.
    """
    try:
        content = AIService.generate_learning_roadmap(
            target_role=request.target_role, 
            skills=request.current_skills
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")
        
    db_roadmap = LearningRoadmap(
        user_id=current_user.id,
        target_role=request.target_role,
        current_skills=request.current_skills,
        plan_json=content
    )
    db.add(db_roadmap)
    db.commit()
    db.refresh(db_roadmap)
    
    return db_roadmap
