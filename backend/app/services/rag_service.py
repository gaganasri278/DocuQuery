from typing import List, Optional, Tuple
from app.config import settings
from app.models.schemas import CitationItem
from app.retrieval.vector_store import vector_store, RetrievedChunk
from app.services.llm_provider import llm_provider, ANSWER_NOT_FOUND

class RAGService:
    def __init__(self):
        pass

    def answer_question(
        self,
        question: str,
        conversation_history: List[dict] = [],
        document_ids: Optional[List[str]] = None
    ) -> Tuple[str, List[CitationItem]]:
        """
        Executes complete RAG pipeline:
        1. Semantic retrieval from ChromaDB
        2. Relevance filtering
        3. Citation extraction
        4. Context formatting and LLM answer generation
        5. Answer grounding validation
        """
        # Step 1: Semantic Search
        retrieved_chunks = vector_store.search(
            query=question,
            top_k=settings.top_k_chunks,
            doc_ids=document_ids,
            max_distance=settings.relevance_distance_threshold
        )

        # If vector store has no matches or highest relevance is too low
        if not retrieved_chunks:
            return ANSWER_NOT_FOUND, []

        # Step 2: Build Citations
        citations: List[CitationItem] = []
        passages_for_llm: List[dict] = []

        for idx, chunk in enumerate(retrieved_chunks, 1):
            # Clean excerpt: take concise 280 char snippet or full chunk if short
            excerpt = chunk.text
            if len(excerpt) > 280:
                cut = excerpt[:280].rfind(". ")
                if cut > 120:
                    excerpt = excerpt[:cut + 1]
                else:
                    excerpt = excerpt[:280] + "..."

            citations.append(CitationItem(
                citation_id=idx,
                document_id=chunk.doc_id,
                document_name=chunk.filename,
                page_number=chunk.page_number,
                section=chunk.section,
                excerpt=excerpt,
                relevance_score=chunk.relevance_score
            ))

            passages_for_llm.append({
                "id": idx,
                "filename": chunk.filename,
                "page_number": chunk.page_number,
                "section": chunk.section,
                "text": chunk.text,
                "relevance_score": chunk.relevance_score
            })

        # Step 3: Generate Answer
        raw_answer = llm_provider.generate_answer(
            question=question,
            retrieved_passages=passages_for_llm,
            conversation_history=conversation_history
        )

        # Step 4: Strict Validation
        if ANSWER_NOT_FOUND.lower() in raw_answer.lower() or raw_answer.strip() == ANSWER_NOT_FOUND:
            return ANSWER_NOT_FOUND, []

        return raw_answer, citations

rag_service = RAGService()
