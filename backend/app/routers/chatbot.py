from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Any
from app.dependencies import get_db, get_current_user
from app.models.models import User, ChatbotHistory
from app.services.ai_service import AIService

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

    # Fetch recent context from database history
    try:
        db_history = db.query(ChatbotHistory).filter(
            ChatbotHistory.user_id == current_user.id
        ).order_by(ChatbotHistory.created_at.desc()).limit(10).all()
        db_history.reverse()
        history_list = [{"message": h.message, "is_bot": h.is_bot} for h in db_history]
    except Exception:
        history_list = []

    # Call Gemini model
    bot_reply = AIService.chat_with_assistant(
        user_name=current_user.name or "User",
        message=request.message,
        history=history_list
    )

    # Save bot message
    bot_msg = ChatbotHistory(
        user_id=current_user.id,
        message=bot_reply,
        is_bot=True
    )
    db.add(bot_msg)
    db.commit()

    return {"reply": bot_reply}

class ChatMessageRequest(BaseModel):
    message: str

@router.post("/send")
def send_message(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Backward-compatible /send endpoint routing to live AI agent.
    """
    user_msg = ChatbotHistory(
        user_id=current_user.id,
        message=request.message,
        is_bot=False
    )
    db.add(user_msg)

    # Call Gemini model
    bot_reply = AIService.chat_with_assistant(
        user_name=current_user.name or "User",
        message=request.message,
        history=[]
    )

    bot_msg = ChatbotHistory(
        user_id=current_user.id,
        message=bot_reply,
        is_bot=True
    )
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)

    return {"id": bot_msg.id, "message": bot_msg.message, "is_bot": bot_msg.is_bot}

@router.get("/history")
def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch chatbot conversation history for the current user.
    """
    history = db.query(ChatbotHistory).filter(
        ChatbotHistory.user_id == current_user.id
    ).order_by(ChatbotHistory.created_at.asc()).all()
    return [{"id": h.id, "message": h.message, "is_bot": h.is_bot, "created_at": h.created_at} for h in history]

@router.delete("/history")
def clear_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete chatbot conversation history for the current user.
    """
    db.query(ChatbotHistory).filter(ChatbotHistory.user_id == current_user.id).delete()
    db.commit()
    return {"status": "success", "message": "Chat history cleared successfully"}
