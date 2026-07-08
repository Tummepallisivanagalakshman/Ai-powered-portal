from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Any
from app.dependencies import get_db, get_current_user
from app.models.models import User, ChatbotHistory

router = APIRouter(
    prefix="/chatbot",
    tags=["Career Chatbot"]
)

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Any]] = []

class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accepts a message + history and returns an AI response.
    Saves both the user message and bot reply to the database.
    """
    # Save user message
    user_msg = ChatbotHistory(
        user_id=current_user.id,
        message=request.message,
        is_bot=False
    )
    db.add(user_msg)

    # Generate bot response (mocked — replace with Gemini SDK call)
    context_hint = ""
    if request.history:
        context_hint = f" (continuing a conversation of {len(request.history)} messages)"
    bot_reply = (
        f"Hello {current_user.name}! I'm your AI Career Advisor{context_hint}. "
        f"Regarding your question about \"{request.message[:60]}...\": "
        "I recommend tailoring your resume to the job description, "
        "practicing STAR-format answers for behavioral rounds, and researching "
        "the company's recent projects before interviews."
    )

    bot_msg = ChatbotHistory(
        user_id=current_user.id,
        message=bot_reply,
        is_bot=True
    )
    db.add(bot_msg)
    db.commit()

    return {"reply": bot_reply}

# Keep original /send endpoint for backward compat
class ChatMessageRequest(BaseModel):
    message: str

@router.post("/send")
def send_message(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_msg = ChatbotHistory(user_id=current_user.id, message=request.message, is_bot=False)
    db.add(user_msg)
    bot_reply = f"I am your AI Career Advisor. I see you asked: {request.message}"
    bot_msg = ChatbotHistory(user_id=current_user.id, message=bot_reply, is_bot=True)
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)
    return {"id": bot_msg.id, "message": bot_msg.message, "is_bot": bot_msg.is_bot}
