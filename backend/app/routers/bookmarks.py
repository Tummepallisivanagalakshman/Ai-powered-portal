from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app.dependencies import get_db, get_current_user
from app.models.models import User, Bookmark

router = APIRouter(
    prefix="/bookmarks",
    tags=["Bookmarks"]
)

class BookmarkBase(BaseModel):
    item_type: str  # 'job', 'company', 'report', 'question', 'roadmap'
    item_id: str

class BookmarkResponse(BookmarkBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=list[BookmarkResponse])
def get_my_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch all bookmarks of the current user."""
    return db.query(Bookmark).filter(Bookmark.user_id == current_user.id).all()

@router.post("/", response_model=BookmarkResponse)
def create_bookmark(
    bookmark: BookmarkBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bookmark an item."""
    # Check if already bookmarked
    existing = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.item_type == bookmark.item_type,
        Bookmark.item_id == bookmark.item_id
    ).first()
    if existing:
        return existing
        
    db_bookmark = Bookmark(
        user_id=current_user.id,
        item_type=bookmark.item_type,
        item_id=bookmark.item_id
    )
    db.add(db_bookmark)
    db.commit()
    db.refresh(db_bookmark)
    return db_bookmark

@router.delete("/{bookmark_id}")
def delete_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove an item from favorites/bookmarks."""
    db_bookmark = db.query(Bookmark).filter(
        Bookmark.id == bookmark_id,
        Bookmark.user_id == current_user.id
    ).first()
    if not db_bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
        
    db.delete(db_bookmark)
    db.commit()
    return {"status": "success", "message": "Bookmark removed successfully"}
