from typing import List
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    ConversationSummary,
    ConversationDetail,
    CreateConversationRequest
)
from app.services.conversation_service import conversation_service

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

@router.get("", response_model=List[ConversationSummary])
def list_conversations():
    """Lists all stored conversations."""
    return conversation_service.list_conversations()

@router.post("", response_model=ConversationSummary)
def create_conversation(req: CreateConversationRequest):
    """Creates a new conversation session."""
    return conversation_service.create_conversation(title=req.title)

@router.get("/{conv_id}", response_model=ConversationDetail)
def get_conversation(conv_id: str):
    """Retrieves conversation history and citations."""
    conv = conversation_service.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conv

@router.delete("/{conv_id}")
def delete_conversation(conv_id: str):
    """Deletes an entire conversation history."""
    success = conversation_service.delete_conversation(conv_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return {"status": "success", "message": f"Conversation {conv_id} deleted successfully."}
