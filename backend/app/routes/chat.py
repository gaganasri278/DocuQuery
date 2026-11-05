from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.services.conversation_service import conversation_service
from app.services.rag_service import rag_service
from app.services.llm_provider import llm_provider

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
def chat(req: ChatRequest):
    """
    Unified dual-mode chat endpoint:
    MODE 1: document_qa (default) - Grounded strictly in uploaded documents with citations.
    MODE 2: general_chat - Open AI chat powered by LLM without searching documents.
    """
    question = req.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    mode = req.mode or "document_qa"

    # Resolve or create conversation
    conv_id = req.conversation_id
    if not conv_id:
        conv = conversation_service.create_conversation(title=question[:45], mode=mode)
        conv_id = conv.id
    else:
        existing = conversation_service.get_conversation(conv_id)
        if not existing:
            conv = conversation_service.create_conversation(title=question[:45], mode=mode)
            conv_id = conv.id

    # 1. Save user question
    user_msg = conversation_service.add_message(
        conv_id=conv_id,
        role="user",
        content=question,
        mode=mode
    )

    # 2. Get past turns for conversational context
    history = conversation_service.get_conversation_history(conv_id=conv_id, limit=6)

    # 3. Process question based on mode
    if mode == "general_chat":
        try:
            answer = llm_provider.generate_general_chat_answer(
                question=question,
                conversation_history=history
            )
        except Exception as e:
            answer = f"Error generating general AI response: {str(e)}"
        citations = []
    else:
        # MODE 1: Document QA
        try:
            answer, citations = rag_service.answer_question(
                question=question,
                conversation_history=history,
                document_ids=req.document_ids
            )
        except Exception as e:
            answer = f"Error during document retrieval: {str(e)}"
            citations = []

    # 4. Save assistant answer
    assistant_msg = conversation_service.add_message(
        conv_id=conv_id,
        role="assistant",
        content=answer,
        citations=citations,
        mode=mode
    )

    return ChatResponse(
        conversation_id=conv_id,
        user_message=user_msg,
        assistant_message=assistant_msg
    )
