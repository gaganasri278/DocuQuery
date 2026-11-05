from typing import List, Optional, Dict, Any
from dataclasses import dataclass
import chromadb
from app.config import settings
from app.document_processing.chunker import DocumentChunk
from app.retrieval.embeddings import embedding_service

@dataclass
class RetrievedChunk:
    chunk_id: str
    doc_id: str
    filename: str
    page_number: Optional[int]
    section: Optional[str]
    text: str
    distance: float
    relevance_score: float

class VectorStore:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorStore, cls).__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        self.client = chromadb.PersistentClient(
            path=str(settings.chroma_dir),
            settings=chromadb.config.Settings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(
            name="document_chunks",
            metadata={"hnsw:space": "cosine"}
        )

    def add_chunks(self, chunks: List[DocumentChunk]):
        if not chunks:
            return

        texts = [c.text for c in chunks]
        embeddings = embedding_service.embed_documents(texts)
        ids = [c.chunk_id for c in chunks]
        metadatas = []

        for c in chunks:
            metadatas.append({
                "doc_id": c.doc_id,
                "filename": c.filename,
                "page_number": c.page_number if c.page_number is not None else -1,
                "section": c.section or "General",
                "chunk_index": c.chunk_index,
            })

        # Batch upsert into Chroma
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )

    def delete_document(self, doc_id: str):
        """Deletes all chunks belonging to doc_id from Chroma."""
        try:
            self.collection.delete(where={"doc_id": doc_id})
        except Exception as e:
            # If collection is empty or doc not found, pass
            pass

    def search(
        self,
        query: str,
        top_k: int = 4,
        doc_ids: Optional[List[str]] = None,
        max_distance: float = 0.65
    ) -> List[RetrievedChunk]:
        """
        Performs semantic vector search for a question against indexed document chunks.
        Applies relevance distance threshold.
        """
        if self.count() == 0:
            return []

        query_embedding = embedding_service.embed_query(query)
        
        where_filter: Optional[Dict[str, Any]] = None
        if doc_ids and len(doc_ids) > 0:
            if len(doc_ids) == 1:
                where_filter = {"doc_id": doc_ids[0]}
            else:
                where_filter = {"doc_id": {"$in": doc_ids}}

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, max(1, self.count())),
            where=where_filter
        )

        retrieved: List[RetrievedChunk] = []
        if not results or not results["ids"] or not results["ids"][0]:
            return []

        ids = results["ids"][0]
        distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(ids)
        documents = results["documents"][0] if "documents" in results and results["documents"] else [""] * len(ids)
        metadatas = results["metadatas"][0] if "metadatas" in results and results["metadatas"] else [{}] * len(ids)

        for i in range(len(ids)):
            dist = float(distances[i])
            # In cosine space, distance is 1 - cos_sim.
            # dist <= max_distance implies similarity >= (1 - max_distance)
            if dist > max_distance:
                continue

            sim_score = max(0.0, min(1.0, 1.0 - dist))
            meta = metadatas[i]
            page_raw = meta.get("page_number", -1)
            page_num = page_raw if page_raw != -1 else None

            retrieved.append(RetrievedChunk(
                chunk_id=ids[i],
                doc_id=meta.get("doc_id", ""),
                filename=meta.get("filename", "Unknown Document"),
                page_number=page_num,
                section=meta.get("section", "General"),
                text=documents[i],
                distance=dist,
                relevance_score=round(sim_score, 4)
            ))

        return retrieved

    def count(self) -> int:
        return self.collection.count()

vector_store = VectorStore()
