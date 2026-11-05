from .documents import router as documents_router
from .conversations import router as conversations_router
from .chat import router as chat_router
from .settings import router as settings_router
from .document_intelligence import router as document_intelligence_router
from .study import router as study_router
from .writing import router as writing_router
from .preferences import router as preferences_router
from .dashboard import router as dashboard_router

__all__ = [
    "documents_router",
    "conversations_router",
    "chat_router",
    "settings_router",
    "document_intelligence_router",
    "study_router",
    "writing_router",
    "preferences_router",
    "dashboard_router"
]
