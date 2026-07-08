from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import SessionLocal
from app.dependencies import get_db, get_current_user
from app.models.models import User, ChatbotHistory
# from app.services.ai_service import AIService

router = APIRouter(
    prefix="/chatbot",
    tags=["Career Chatbot"]
)

class ChatMessageRequest(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    id: int
    message: str
    is_bot: bool
    model_config = {"from_attributes": True}

@router.post("/send", response_model=ChatMessageResponse)
def send_message(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save user message
    user_msg = ChatbotHistory(user_id=current_user.id, message=request.message, is_bot=False)
    db.add(user_msg)
    
    # Generate bot response via AIService (mocked for brevity)
    bot_reply = f"I am your AI Career Advisor. I see you asked: {request.message}"
    bot_msg = ChatbotHistory(user_id=current_user.id, message=bot_reply, is_bot=True)
    db.add(bot_msg)
    
    db.commit()
    db.refresh(bot_msg)
    
    return bot_msg
