from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.models import User
from app.schemas.user import UserResponse, UserBase
from app.dependencies import get_current_user, get_db

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Returns the currently authenticated user's profile information.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
def update_users_me(
    payload: UserBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update profile details for the currently authenticated user.
    """
    current_user.name = payload.name
    current_user.phone = payload.phone
    current_user.skills = payload.skills
    current_user.experience = payload.experience
    current_user.preferred_roles = payload.preferred_roles
    current_user.preferred_locations = payload.preferred_locations
    
    db.commit()
    db.refresh(current_user)
    return current_user
