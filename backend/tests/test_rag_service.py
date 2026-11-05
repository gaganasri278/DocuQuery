import pytest
from app.services.rag_service import rag_service
from app.retrieval.vector_store import vector_store
from app.document_processing.chunker import DocumentChunk

def test_rag_with_known_context():
    # Index a known passage
    chunk = DocumentChunk(
        chunk_id="chunk_ml_1",
        doc_id="ml_doc",
        filename="model_spec.pdf",
        page_number=3,
        section="Architecture",
        text="The neural network employs 12 transformer layers with 768 hidden dimensions.",
        chunk_index=0,
        char_count=77
    )
    vector_store.add_chunks([chunk])

    try:
        answer, citations = rag_service.answer_question(
            question="How many transformer layers does the neural network employ?"
        )
        assert "12" in answer or "transformer" in answer
        assert len(citations) > 0
        assert citations[0].document_name == "model_spec.pdf"
        assert citations[0].page_number == 3
        assert citations[0].section == "Architecture"
    finally:
        vector_store.delete_document("ml_doc")

def test_rag_answer_not_found():
    # Question about quantum teleportation that is completely absent
    answer, citations = rag_service.answer_question(
        question="What is the quantum teleportation frequency of the subatomic particle reactor?"
    )
    assert answer == "Answer not found in the uploaded documents."
    assert len(citations) == 0
