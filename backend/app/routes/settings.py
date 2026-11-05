import os
from fastapi import APIRouter
from app.config import settings
from app.models.schemas import SettingsResponse, UpdateSettingsRequest
from app.retrieval.vector_store import vector_store
from app.services.document_service import document_service

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=SettingsResponse)
def get_settings():
    docs = document_service.list_documents()
    active_model = settings.llm_provider
    if settings.llm_provider == "gemini":
        active_model = f"Google Gemini ({settings.gemini_model})"
    elif settings.llm_provider == "openai":
        active_model = f"OpenAI ({settings.openai_model})"
    elif settings.llm_provider == "ollama":
        active_model = f"Ollama ({settings.ollama_model})"
    else:
        active_model = "Local Semantic Extractive Engine"

    has_gemini = bool(settings.gemini_api_key or os.getenv("GEMINI_API_KEY"))
    has_openai = bool(settings.openai_api_key or os.getenv("OPENAI_API_KEY"))

    return SettingsResponse(
        app_name=settings.app_name,
        llm_provider=settings.llm_provider,
        has_gemini_key=has_gemini,
        has_openai_key=has_openai,
        active_model=active_model,
        embedding_model=settings.embedding_model_name,
        total_documents=len(docs),
        total_chunks=vector_store.count()
    )

def _persist_env_var(key: str, value: str):
    env_paths = [
        settings.base_dir / ".env",
        settings.base_dir.parent / ".env"
    ]
    for p in env_paths:
        try:
            if p.exists():
                lines = p.read_text(encoding="utf-8").splitlines()
                updated = False
                new_lines = []
                for line in lines:
                    if line.startswith(f"{key}=") or line.startswith(f"#{key}="):
                        new_lines.append(f"{key}={value}")
                        updated = True
                    else:
                        new_lines.append(line)
                if not updated:
                    new_lines.append(f"{key}={value}")
                p.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
        except Exception as e:
            print(f"[Warning] Could not persist {key} to {p}: {e}")

@router.post("", response_model=SettingsResponse)
def update_settings(req: UpdateSettingsRequest):
    if req.llm_provider:
        settings.llm_provider = req.llm_provider
        os.environ["LLM_PROVIDER"] = req.llm_provider
        _persist_env_var("LLM_PROVIDER", req.llm_provider)
    if req.gemini_api_key is not None:
        settings.gemini_api_key = req.gemini_api_key
        os.environ["GEMINI_API_KEY"] = req.gemini_api_key
        _persist_env_var("GEMINI_API_KEY", req.gemini_api_key)
    if req.openai_api_key is not None:
        settings.openai_api_key = req.openai_api_key
        os.environ["OPENAI_API_KEY"] = req.openai_api_key
        _persist_env_var("OPENAI_API_KEY", req.openai_api_key)

    return get_settings()
