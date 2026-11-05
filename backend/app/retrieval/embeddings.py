from typing import List
from sentence_transformers import SentenceTransformer
from app.config import settings

class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._init_model()
        return cls._instance

    def _init_model(self):
        # Load local cached model without attempting network checks
        try:
            self._model = SentenceTransformer(settings.embedding_model_name, local_files_only=True)
        except Exception:
            self._model = SentenceTransformer(settings.embedding_model_name)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        embeddings = self._model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        embedding = self._model.encode(query, show_progress_bar=False, normalize_embeddings=True)
        return embedding.tolist()

embedding_service = EmbeddingService()
