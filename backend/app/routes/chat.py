from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.services.conversation_service import conversation_service
from app.services.rag_service import rag_service

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
def chat(req: ChatRequest):
    """
    Core RAG question-answering endpoint:
    - Grounded retrieval from indexed documents
    - LLM answer generation with strict system constraints
    - Traceable source citations
    - Persistent conversation history
    """
    question = req.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Resolve or create conversation
    conv_id = req.conversation_id
    if not conv_id:
        conv = conversation_service.create_conversation(title=question[:45])
        conv_id = conv.id
    else:
        existing = conversation_service.get_conversation(conv_id)
        if not existing:
            conv = conversation_service.create_conversation(title=question[:45])
            conv_id = conv.id

    # 1. Save user question
    user_msg = conversation_service.add_message(
        conv_id=conv_id,
        role="user",
        content=question
    )

    # 2. Get past turns for conversational context
    history = conversation_service.get_conversation_history(conv_id=conv_id, limit=6)

    # 3. Execute RAG pipeline
    try:
        answer, citations = rag_service.answer_question(
            question=question,
            conversation_history=history,
            document_ids=req.document_ids
        )
    except Exception as e:
        answer = f"Error during retrieval: {str(e)}"
        citations = []

    # 4. Save assistant answer with citations
    assistant_msg = conversation_service.add_message(
        conv_id=conv_id,
        role="assistant",
        content=answer,
        citations=citations
    )

    return ChatResponse(
        conversation_id=conv_id,
        user_message=user_msg,
        assistant_message=assistant_msg
    )
