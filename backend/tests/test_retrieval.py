import pytest
from app.retrieval.embeddings import embedding_service
from app.retrieval.vector_store import vector_store
from app.document_processing.chunker import DocumentChunk

def test_embeddings_generation():
    texts = ["FastAPI is a modern web framework.", "ChromaDB is an open-source vector store."]
    embeddings = embedding_service.embed_documents(texts)
    assert len(embeddings) == 2
    assert len(embeddings[0]) == 384
    assert len(embeddings[1]) == 384

    query_emb = embedding_service.embed_query("What is FastAPI?")
    assert len(query_emb) == 384

def test_vector_store_add_and_search():
    chunks = [
        DocumentChunk(
            chunk_id="test_c1",
            doc_id="doc_payment",
            filename="payment_terms.pdf",
            page_number=1,
            section="Billing",
            text="The total contract value is $250,000 with a 30% initial deposit.",
            chunk_index=0,
            char_count=67
        ),
        DocumentChunk(
            chunk_id="test_c2",
            doc_id="doc_sla",
            filename="service_agreement.pdf",
            page_number=2,
            section="SLA",
            text="The provider guarantees an uptime of 99.95% during operational hours.",
            chunk_index=1,
            char_count=69
        ),
    ]

    vector_store.add_chunks(chunks)
    assert vector_store.count() >= 2

    # Query payment
    results = vector_store.search("What is the total contract value?", top_k=2)
    assert len(results) > 0
    assert results[0].doc_id == "doc_payment"
    assert "$250,000" in results[0].text
    assert results[0].page_number == 1

    # Query SLA
    sla_results = vector_store.search("What is the guaranteed uptime percentage?", top_k=2)
    assert len(sla_results) > 0
    assert "99.95%" in sla_results[0].text

    # Test filtering by doc_id
    filtered = vector_store.search("uptime", top_k=2, doc_ids=["doc_payment"])
    # doc_payment has nothing about uptime, so it should either be empty or distance threshold will filter it
    for f in filtered:
        assert f.doc_id == "doc_payment"

    # Cleanup
    vector_store.delete_document("doc_payment")
    vector_store.delete_document("doc_sla")
