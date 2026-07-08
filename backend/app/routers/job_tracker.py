from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import SessionLocal
from app.dependencies import get_db, get_current_user
from app.models.models import User, JobTrackerItem
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/tracker",
    tags=["Job Tracker"]
)

class TrackerItemSchema(BaseModel):
    company: str
    position: str
    date: str
    status: str
    notes: Optional[str] = None

class TrackerItemResponse(TrackerItemSchema):
    id: int
    user_id: int
    model_config = {"from_attributes": True}

@router.get("/items", response_model=List[TrackerItemResponse])
def get_tracker_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch all job tracker items for the current user.
    """
    items = db.query(JobTrackerItem).filter(JobTrackerItem.user_id == current_user.id).all()
    return items

@router.post("/items", response_model=TrackerItemResponse)
def create_tracker_item(
    item: TrackerItemSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new job tracker item.
    """
    db_item = JobTrackerItem(
        user_id=current_user.id,
        company=item.company,
        position=item.position,
        date=item.date,
        status=item.status,
        notes=item.notes
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/items/{item_id}", response_model=TrackerItemResponse)
def update_tracker_item(
    item_id: int,
    item: TrackerItemSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a job tracker item (e.g., move columns).
    """
    db_item = db.query(JobTrackerItem).filter(JobTrackerItem.id == item_id, JobTrackerItem.user_id == current_user.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    db_item.company = item.company
    db_item.position = item.position
    db_item.date = item.date
    db_item.status = item.status
    db_item.notes = item.notes
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/items/{item_id}")
def delete_tracker_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a job tracker item.
    """
    db_item = db.query(JobTrackerItem).filter(JobTrackerItem.id == item_id, JobTrackerItem.user_id == current_user.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    db.delete(db_item)
    db.commit()
    return {"status": "success", "message": "Item deleted"}
