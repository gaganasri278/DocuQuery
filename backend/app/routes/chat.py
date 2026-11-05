from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, GeneralChatRequest, ChatResponse
from app.services.conversation_service import conversation_service
from app.services.rag_service import rag_service
from app.services.llm_provider import llm_provider

router = APIRouter(prefix="/api/chat", tags=["chat"])

def _process_general_chat(question: str, conv_id: str | None) -> ChatResponse:
    """
    Core handler for General AI Chat:
    - Independent from document processing and vector stores.
    - Zero document retrieval, zero vector search, zero citations.
    - Directly calls configured LLM (Google Gemini).
    - Preserves multi-turn conversational context.
    """
    # 1. Resolve or create conversation with mode="general_chat"
    if not conv_id:
        conv = conversation_service.create_conversation(title=question[:45], mode="general_chat")
        conv_id = conv.id
    else:
        existing = conversation_service.get_conversation(conv_id)
        if not existing:
            conv = conversation_service.create_conversation(title=question[:45], mode="general_chat")
            conv_id = conv.id

    # 2. Save user message
    user_msg = conversation_service.add_message(
        conv_id=conv_id,
        role="user",
        content=question,
        mode="general_chat"
    )

    # 3. Retrieve past conversation history
    history = conversation_service.get_conversation_history(conv_id=conv_id, limit=8)

    # 4. Generate answer directly using configured LLM (Google Gemini)
    try:
        answer = llm_provider.generate_general_chat_answer(
            question=question,
            conversation_history=history
        )
    except Exception as e:
        answer = f"Error generating general AI response: {str(e)}"

    # 5. Save assistant answer (strictly 0 citations)
    assistant_msg = conversation_service.add_message(
        conv_id=conv_id,
        role="assistant",
        content=answer,
        citations=[],
        mode="general_chat"
    )

    return ChatResponse(
        conversation_id=conv_id,
        user_message=user_msg,
        assistant_message=assistant_msg
    )

@router.post("/general", response_model=ChatResponse)
def general_chat(req: GeneralChatRequest):
    """
    Dedicated General AI Chat endpoint.
    Completely isolated from the Document QA / RAG pipeline.
    """
    question = req.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    return _process_general_chat(question, req.conversation_id)

@router.post("", response_model=ChatResponse)
def chat(req: ChatRequest):
    """
    Unified chat endpoint.
    If req.mode == "general_chat", routes directly to independent General AI handler.
    If req.mode == "document_qa", performs semantic retrieval with citations.
    """
    question = req.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    mode = req.mode or "document_qa"

    # Route General AI Chat requests to dedicated handler
    if mode == "general_chat":
        return _process_general_chat(question, req.conversation_id)

    # MODE 1: Document QA with semantic retrieval and citations
    conv_id = req.conversation_id
    if not conv_id:
        conv = conversation_service.create_conversation(title=question[:45], mode="document_qa")
        conv_id = conv.id
    else:
        existing = conversation_service.get_conversation(conv_id)
        if not existing:
            conv = conversation_service.create_conversation(title=question[:45], mode="document_qa")
            conv_id = conv.id

    user_msg = conversation_service.add_message(
        conv_id=conv_id,
        role="user",
        content=question,
        mode="document_qa"
    )

    history = conversation_service.get_conversation_history(conv_id=conv_id, limit=6)

    try:
        answer, citations = rag_service.answer_question(
            question=question,
            conversation_history=history,
            document_ids=req.document_ids
        )
    except Exception as e:
        answer = f"Error during document retrieval: {str(e)}"
        citations = []

    assistant_msg = conversation_service.add_message(
        conv_id=conv_id,
        role="assistant",
        content=answer,
        citations=citations,
        mode="document_qa"
    )

    return ChatResponse(
        conversation_id=conv_id,
        user_message=user_msg,
        assistant_message=assistant_msg
    )
