from fastapi import APIRouter
from app.models.schemas import DashboardStatsResponse
from app.config import settings
from app.database.connection import get_db
from app.retrieval.vector_store import vector_store

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats():
    with get_db() as conn:
        cursor = conn.cursor()

        # Documents count
        cursor.execute("SELECT COUNT(*) as total FROM documents")
        total_docs = cursor.fetchone()["total"]

        # Conversations count by mode
        cursor.execute("SELECT COUNT(*) as total FROM conversations")
        total_convs = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as total FROM conversations WHERE mode = 'document_qa'")
        doc_qa_convs = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as total FROM conversations WHERE mode = 'general_chat'")
        gen_chat_convs = cursor.fetchone()["total"]

        # Recent activities
        recent = []
        cursor.execute("SELECT filename, created_at FROM documents ORDER BY created_at DESC LIMIT 4")
        for d in cursor.fetchall():
            recent.append({
                "type": "document_upload",
                "title": f"Document Indexed: {d['filename']}",
                "timestamp": str(d["created_at"])
            })

        cursor.execute("SELECT title, mode, updated_at FROM conversations ORDER BY updated_at DESC LIMIT 4")
        for c in cursor.fetchall():
            mode_name = "General AI Chat" if c["mode"] == "general_chat" else "Document QA"
            recent.append({
                "type": "conversation",
                "title": f"{mode_name}: {c['title']}",
                "timestamp": str(c["updated_at"])
            })

        # Sort combined recent activity by timestamp
        recent.sort(key=lambda x: x["timestamp"], reverse=True)

    active_model = settings.gemini_model if settings.llm_provider == "gemini" else settings.llm_provider

    return DashboardStatsResponse(
        total_documents=total_docs,
        total_chunks=vector_store.count(),
        total_conversations=total_convs,
        doc_qa_conversations=doc_qa_convs,
        general_chat_conversations=gen_chat_convs,
        active_provider=settings.llm_provider.title(),
        active_model=f"Google Gemini ({active_model})",
        recent_activity=recent[:8]
    )
