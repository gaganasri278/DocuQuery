from typing import Optional, List, Dict, Any
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
    is_pinned: bool = False
    created_at: str
    updated_at: str
    message_count: int

class ConversationDetail(BaseModel):
    id: str
    title: str
    mode: Optional[str] = "document_qa"
    is_pinned: bool = False
    created_at: str
    updated_at: str
    messages: List[MessageResponse]

class CreateConversationRequest(BaseModel):
    title: Optional[str] = "New Conversation"
    mode: Optional[str] = "document_qa"

class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None
    is_pinned: Optional[bool] = None

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1)
    document_ids: Optional[List[str]] = None
    mode: Optional[str] = "document_qa"

class GeneralChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1)

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

# Document Intelligence
class DocumentSummaryResponse(BaseModel):
    document_id: str
    filename: str
    summary: str
    key_points: List[str]
    definitions: List[Dict[str, str]]
    revision_notes: str

class DocumentCompareRequest(BaseModel):
    document_ids: List[str] = Field(..., min_length=2)

class DocumentCompareResponse(BaseModel):
    document_titles: List[str]
    synthesis: str
    key_similarities: List[str]
    key_differences: List[str]

class DocumentPreviewResponse(BaseModel):
    document_id: str
    filename: str
    total_pages: int
    total_chunks: int
    content: str

# Study Assistant
class MCQItem(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_answer: str
    explanation: str
    difficulty: str

class GenerateMCQRequest(BaseModel):
    document_id: str
    difficulty: Optional[str] = "medium"
    count: Optional[int] = 5

class FlashcardItem(BaseModel):
    id: int
    front: str
    back: str
    tag: Optional[str] = None

class GenerateFlashcardsRequest(BaseModel):
    document_id: str
    count: Optional[int] = 6

class ConceptExplainRequest(BaseModel):
    document_id: Optional[str] = None
    concept: str
    level: Optional[str] = "beginner"

# Writing Assistant
class WritingRequest(BaseModel):
    text: str = Field(..., min_length=1)
    operation: str
    tone: Optional[str] = "professional"
    target_length: Optional[str] = "balanced"

class WritingResponse(BaseModel):
    result: str
    operation: str
    word_count: int

# User Preferences
class UserPreferences(BaseModel):
    response_length: str = "balanced"
    response_style: str = "balanced"
    tone: str = "friendly"
    theme: str = "system"
    voice_enabled: bool = True

class DashboardStatsResponse(BaseModel):
    total_documents: int
    total_chunks: int
    total_conversations: int
    doc_qa_conversations: int
    general_chat_conversations: int
    active_provider: str
    active_model: str
    recent_activity: List[dict]
