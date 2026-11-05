from typing import Optional, List
from pydantic import BaseModel, Field

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    status: str
    chunk_count: int
    error_message: Optional[str] = None
    created_at: str

class CitationItem(BaseModel):
    citation_id: int
    document_id: Optional[str] = None
    document_name: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    excerpt: str
    relevance_score: float

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: str
    citations: List[CitationItem] = []
    mode: Optional[str] = "document_qa"

class ConversationSummary(BaseModel):
    id: str
    title: str
    mode: Optional[str] = "document_qa"
    created_at: str
    updated_at: str
    message_count: int

class ConversationDetail(BaseModel):
    id: str
    title: str
    mode: Optional[str] = "document_qa"
    created_at: str
    updated_at: str
    messages: List[MessageResponse]

class CreateConversationRequest(BaseModel):
    title: Optional[str] = "New Conversation"
    mode: Optional[str] = "document_qa"

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1)
    document_ids: Optional[List[str]] = None
    mode: Optional[str] = "document_qa"

class ChatResponse(BaseModel):
    conversation_id: str
    user_message: MessageResponse
    assistant_message: MessageResponse

class SettingsResponse(BaseModel):
    app_name: str
    llm_provider: str
    has_gemini_key: bool
    has_openai_key: bool
    active_model: str
    embedding_model: str
    total_documents: int
    total_chunks: int

class UpdateSettingsRequest(BaseModel):
    llm_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
