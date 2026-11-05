import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent

# Storage configuration (configurable via DATA_DIR for persistent mounts or Docker)
DATA_DIR = Path(os.getenv("DATA_DIR", BASE_DIR / "data"))
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", DATA_DIR / "uploads"))
CHROMA_DIR = Path(os.getenv("CHROMA_DIR", DATA_DIR / "chroma_db"))
DB_PATH = Path(os.getenv("SQLITE_DB_PATH", DATA_DIR / "qa_system.db"))

# Ensure storage directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

# Disable telemetry and set offline defaults
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY"] = "False"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Offline mode for huggingface / transformers: default to "1" if not overridden
if "HF_HUB_OFFLINE" not in os.environ:
    os.environ["HF_HUB_OFFLINE"] = os.getenv("HF_HUB_OFFLINE", "1")
if "TRANSFORMERS_OFFLINE" not in os.environ:
    os.environ["TRANSFORMERS_OFFLINE"] = os.getenv("TRANSFORMERS_OFFLINE", "1")

class Settings(BaseSettings):
    app_name: str = "AI-Powered Document Question Answering System"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Paths
    base_dir: Path = BASE_DIR
    data_dir: Path = DATA_DIR
    upload_dir: Path = UPLOAD_DIR
    chroma_dir: Path = CHROMA_DIR
    sqlite_db_path: Path = DB_PATH
    
    # Embeddings & Retrieval
    embedding_model_name: str = "all-MiniLM-L6-v2"
    chunk_size: int = 600
    chunk_overlap: int = 120
    top_k_chunks: int = 4
    # Max cosine distance threshold (Chroma default is cosine distance;
    # for cosine space, distance <= 0.78 allows genuine document questions
    # while rejecting out-of-domain questions with distance > 0.85)
    relevance_distance_threshold: float = 0.78
    
    # LLM Configuration
    # Supported: "gemini", "openai", "ollama", "local"
    llm_provider: str = os.getenv("LLM_PROVIDER", "gemini")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3")
    
    # File limits
    max_file_size_mb: int = 25
    allowed_extensions: list[str] = [".pdf", ".docx", ".txt"]
    
    # Server / CORS
    cors_origins: list[str] = ["*"]

    model_config = {
        "env_file": [str(BASE_DIR.parent / ".env"), str(BASE_DIR / ".env"), ".env"],
        "extra": "ignore"
    }

settings = Settings()
