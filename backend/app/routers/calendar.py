from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.dependencies import get_db, get_current_user
from app.models.models import User, CalendarEvent

router = APIRouter(
    prefix="/calendar",
    tags=["Calendar"]
)

class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    type: str  # 'interview', 'learning', 'deadline', 'reminder'

class CalendarEventResponse(CalendarEventBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=list[CalendarEventResponse])
def get_my_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch all calendar events for the authenticated user."""
    return db.query(CalendarEvent).filter(
        CalendarEvent.user_id == current_user.id
    ).order_by(CalendarEvent.start_time.asc()).all()

@router.post("/", response_model=CalendarEventResponse)
def create_event(
    event: CalendarEventBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new calendar event."""
    db_event = CalendarEvent(
        user_id=current_user.id,
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        type=event.type
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.put("/{event_id}", response_model=CalendarEventResponse)
def update_event(
    event_id: int,
    event: CalendarEventBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit an existing calendar event."""
    db_event = db.query(CalendarEvent).filter(
        CalendarEvent.id == event_id,
        CalendarEvent.user_id == current_user.id
    ).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db_event.title = event.title
    db_event.description = event.description
    db_event.start_time = event.start_time
    db_event.end_time = event.end_time
    db_event.type = event.type
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific calendar event."""
    db_event = db.query(CalendarEvent).filter(
        CalendarEvent.id == event_id,
        CalendarEvent.user_id == current_user.id
    ).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(db_event)
    db.commit()
    return {"status": "success", "message": "Event deleted successfully"}
