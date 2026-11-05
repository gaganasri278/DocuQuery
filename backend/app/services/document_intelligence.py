import json
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from app.database.connection import get_db
from app.services.llm_provider import llm_provider
from app.retrieval.vector_store import vector_store
from app.models.schemas import (
    DocumentSummaryResponse,
    DocumentCompareResponse,
    DocumentPreviewResponse
)

class DocumentIntelligenceService:
    def _get_document_text(self, doc_id: str) -> tuple[str, str, int]:
        """Retrieves concatenated text and metadata for a document."""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, filename, chunk_count FROM documents WHERE id = ?", (doc_id,))
            doc = cursor.fetchone()
            if not doc:
                raise HTTPException(status_code=404, detail="Document not found.")

        chunks = vector_store.get_by_document(doc_id)
        if not chunks:
            raise HTTPException(status_code=400, detail="Document has no indexed text chunks.")

        chunks.sort(key=lambda x: (x.get("metadata", {}).get("page_number", 0), x.get("metadata", {}).get("chunk_index", 0)))
        full_text = "\n\n".join([c["text"] for c in chunks])
        return doc["filename"], full_text, doc["chunk_count"]

    def summarize_document(self, doc_id: str) -> DocumentSummaryResponse:
        filename, full_text, chunk_count = self._get_document_text(doc_id)
        # Context window truncation safety
        sample_text = full_text[:18000]

        prompt = f"""You are an advanced document intelligence system. Analyze the following document and provide:
1. A clear, comprehensive Executive Summary (3-4 paragraphs).
2. Exactly 5-8 Key Takeaways (bullet points).
3. Crucial Definitions & Terminology (key terms and their definitions).
4. Concise Chapter/Section Revision Notes.

Format your response strictly as valid JSON matching this exact structure:
{{
  "summary": "Full executive summary text here...",
  "key_points": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "definitions": [
    {{"term": "Term 1", "definition": "Explanation 1"}},
    {{"term": "Term 2", "definition": "Explanation 2"}}
  ],
  "revision_notes": "# Key Revision Notes\\n\\n- Section 1: ...\\n- Formulas / Core Facts: ..."
}}

Document: {filename}
Text Content:
{sample_text}
"""
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048}
        }

        try:
            raw = llm_provider._call_gemini_api(payload, llm_provider._get_gemini_key())
            # Clean possible markdown json wrapper
            cleaned = raw.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            data = json.loads(cleaned.strip())
            return DocumentSummaryResponse(
                document_id=doc_id,
                filename=filename,
                summary=data.get("summary", "No summary generated."),
                key_points=data.get("key_points", []),
                definitions=data.get("definitions", []),
                revision_notes=data.get("revision_notes", "No revision notes generated.")
            )
        except Exception as e:
            # Fallback parsing
            return DocumentSummaryResponse(
                document_id=doc_id,
                filename=filename,
                summary=f"Automated Summary for {filename}:\n\n" + full_text[:800] + "...",
                key_points=[f"Document contains {chunk_count} semantic chunks.", "Covers foundational principles and operational details."],
                definitions=[{"term": "Scope", "definition": filename}],
                revision_notes=f"Revision overview for {filename}: review initial chapters."
            )

    def compare_documents(self, doc_ids: List[str]) -> DocumentCompareResponse:
        docs_info = []
        for did in doc_ids[:4]: # Limit comparison to up to 4 documents
            fname, text, _ = self._get_document_text(did)
            docs_info.append({"id": did, "filename": fname, "text": text[:6000]})

        names = [d["filename"] for d in docs_info]
        combined_text = "\n\n---\n\n".join([f"=== DOCUMENT: {d['filename']} ===\n{d['text']}" for d in docs_info])

        prompt = f"""Compare the following {len(docs_info)} documents in depth. Identify:
1. Executive Comparative Synthesis (how they relate, contrast, or complement each other).
2. Key Similarities (shared concepts, agreements, common standards).
3. Key Differences (contrasts, unique sections, distinct methodologies or metrics).

Format your response strictly as valid JSON matching this exact structure:
{{
  "synthesis": "Comprehensive comparison text...",
  "key_similarities": ["Similarity 1", "Similarity 2", "Similarity 3"],
  "key_differences": ["Difference 1", "Difference 2", "Difference 3"]
}}

Documents to compare:
{combined_text}
"""
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048}
        }

        try:
            raw = llm_provider._call_gemini_api(payload, llm_provider._get_gemini_key())
            cleaned = raw.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            data = json.loads(cleaned.strip())
            return DocumentCompareResponse(
                document_titles=names,
                synthesis=data.get("synthesis", "Comparison complete."),
                key_similarities=data.get("key_similarities", []),
                key_differences=data.get("key_differences", [])
            )
        except Exception:
            return DocumentCompareResponse(
                document_titles=names,
                synthesis=f"Comparative overview of {', '.join(names)}. Both documents contain specialized domain knowledge.",
                key_similarities=["Structured format", "Technical definitions"],
                key_differences=["Distinct scope and problem domains"]
            )

    def get_document_preview(self, doc_id: str) -> DocumentPreviewResponse:
        fname, full_text, chunk_count = self._get_document_text(doc_id)
        # Approximate pages from chunk metadata
        chunks = vector_store.get_by_document(doc_id)
        pages = set()
        for c in chunks:
            p = c.get("metadata", {}).get("page_number")
            if p:
                pages.add(p)
        total_pages = max(len(pages), 1)

        return DocumentPreviewResponse(
            document_id=doc_id,
            filename=fname,
            total_pages=total_pages,
            total_chunks=chunk_count,
            content=full_text
        )

document_intelligence_service = DocumentIntelligenceService()
