from fastapi import APIRouter, Depends
from app.models.models import User
from app.schemas.user import UserResponse
from app.dependencies import get_current_user

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
