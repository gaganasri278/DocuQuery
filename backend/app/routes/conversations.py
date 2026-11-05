from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Response
from app.models.schemas import (
    ConversationSummary,
    ConversationDetail,
    CreateConversationRequest,
    UpdateConversationRequest
)
from app.services.conversation_service import conversation_service

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

@router.get("", response_model=List[ConversationSummary])
def list_conversations(
    mode: Optional[str] = None,
    search: Optional[str] = None
):
    """Lists stored conversations with optional mode filter and text search."""
    return conversation_service.list_conversations(mode=mode, search=search)

@router.post("", response_model=ConversationSummary)
def create_conversation(req: CreateConversationRequest):
    """Creates a new conversation session."""
    return conversation_service.create_conversation(title=req.title, mode=req.mode or "document_qa")

@router.get("/{conv_id}", response_model=ConversationDetail)
def get_conversation(conv_id: str):
    """Retrieves conversation history and citations."""
    conv = conversation_service.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conv

@router.patch("/{conv_id}", response_model=ConversationSummary)
def update_conversation(conv_id: str, req: UpdateConversationRequest):
    """Updates conversation title or pinned status."""
    updated = conversation_service.update_conversation(
        conv_id=conv_id,
        title=req.title,
        is_pinned=req.is_pinned
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return updated

@router.get("/{conv_id}/export")
def export_conversation(conv_id: str):
    """Exports conversation transcript as formatted plain text."""
    conv = conversation_service.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    lines = [
        f"=== DocuQuery AI Chat Transcript ===",
        f"Title: {conv.title}",
        f"Mode: {'General AI Chat' if conv.mode == 'general_chat' else 'Document QA'}",
        f"Exported At: {conv.updated_at}",
        f"=====================================\n"
    ]

    for m in conv.messages:
        role_label = "USER" if m.role == "user" else "ASSISTANT (DocuQuery AI)"
        lines.append(f"[{m.created_at}] {role_label}:")
        lines.append(m.content)
        if m.citations:
            lines.append("\n  Citations & Sources:")
            for c in m.citations:
                src = f"    [{c.citation_id}] {c.document_name}"
                if c.page_number:
                    src += f" (p. {c.page_number})"
                lines.append(src)
                lines.append(f'      "{c.excerpt.strip()}"')
        lines.append("\n" + "-" * 40 + "\n")

    content = "\n".join(lines)
    filename = f"chat_{conv_id[:8]}.txt"
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.delete("/{conv_id}")
def delete_conversation(conv_id: str):
    """Deletes an entire conversation history."""
    success = conversation_service.delete_conversation(conv_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return {"status": "success", "message": f"Conversation {conv_id} deleted successfully."}
