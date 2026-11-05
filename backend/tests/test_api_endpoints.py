import pytest
from pathlib import Path
from fastapi import UploadFile
from app.routes.documents import upload_documents, list_documents, delete_document, get_document, load_sample_documents
from app.routes.conversations import (
    create_conversation,
    list_conversations,
    get_conversation,
    update_conversation,
    export_conversation,
    delete_conversation
)
from app.routes.chat import chat, general_chat
from app.routes.settings import get_settings, update_settings
from app.routes.document_intelligence import (
    get_document_preview,
    summarize_document,
    get_key_points,
    get_definitions,
    get_revision_notes,
    compare_documents
)
from app.routes.study import (
    generate_mcqs,
    generate_flashcards,
    explain_concept,
    list_study_sets
)
from app.routes.writing import process_writing
from app.routes.dashboard import get_dashboard_stats
from app.routes.preferences import get_preferences, update_preferences
from app.models.schemas import (
    CreateConversationRequest,
    UpdateConversationRequest,
    ChatRequest,
    GeneralChatRequest,
    UpdateSettingsRequest,
    DocumentCompareRequest,
    GenerateMCQRequest,
    GenerateFlashcardsRequest,
    ConceptExplainRequest,
    WritingRequest,
    UserPreferences
)
from app.database.connection import init_db

SAMPLES_DIR = Path(__file__).resolve().parent.parent / "test_samples"

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_settings_endpoints():
    s = get_settings()
    assert s.app_name is not None
    assert s.embedding_model == "all-MiniLM-L6-v2"
    
    updated = update_settings(UpdateSettingsRequest(llm_provider="local"))
    assert updated.llm_provider == "local"

def test_document_and_chat_lifecycle():
    # 1. Upload sample text file
    txt_path = SAMPLES_DIR / "sample_notes.txt"
    assert txt_path.exists()

    with open(txt_path, "rb") as f:
        upload_file = UploadFile(filename="sample_notes.txt", file=f)
        docs = upload_documents(files=[upload_file])

    assert len(docs) == 1
    doc_id = docs[0].id
    assert docs[0].filename == "sample_notes.txt"
    assert docs[0].status == "ready"
    assert docs[0].chunk_count > 0

    # 2. List documents
    all_docs = list_documents()
    assert any(d.id == doc_id for d in all_docs)

    # 3. Create conversation & ask question
    conv = create_conversation(CreateConversationRequest(title="Test Chat"))
    conv_id = conv.id

    chat_resp = chat(ChatRequest(
        conversation_id=conv_id,
        message="What recall rate was achieved by hybrid retrieval in Project Alpha?"
    ))
    assert "94.2%" in chat_resp.assistant_message.content
    assert len(chat_resp.assistant_message.citations) > 0
    assert chat_resp.assistant_message.citations[0].document_name == "sample_notes.txt"

    # 4. Ask out-of-domain question
    not_found_resp = chat(ChatRequest(
        conversation_id=conv_id,
        message="What is the speed of an unladen swallow according to the documents?"
    ))
    assert "Answer not found in the uploaded documents." in not_found_resp.assistant_message.content
    assert len(not_found_resp.assistant_message.citations) == 0

    # 5. Delete document
    del_resp = delete_document(doc_id)
    assert del_resp["status"] == "success"

    # 6. Delete conversation
    del_conv = delete_conversation(conv_id)
    assert del_conv["status"] == "success"

def test_load_sample_documents():
    # Test batch loading sample documents (PDF, DOCX, TXT)
    samples = load_sample_documents()
    assert len(samples) > 0
    for s in samples:
        assert s.status == "ready"
        assert s.chunk_count > 0
        delete_document(s.id)

def test_dual_mode_and_reindex():
    # 1. Test separate conversation histories per mode
    doc_conv = create_conversation(CreateConversationRequest(title="Doc Conv", mode="document_qa"))
    gen_conv = create_conversation(CreateConversationRequest(title="Gen Conv", mode="general_chat"))

    doc_list = list_conversations(mode="document_qa")
    gen_list = list_conversations(mode="general_chat")

    assert any(c.id == doc_conv.id for c in doc_list)
    assert not any(c.id == gen_conv.id for c in doc_list)
    assert any(c.id == gen_conv.id for c in gen_list)
    assert not any(c.id == doc_conv.id for c in gen_list)

    # 2. Test general chat response
    gen_resp = chat(ChatRequest(
        conversation_id=gen_conv.id,
        message="Explain database indexing in simple terms",
        mode="general_chat"
    ))
    assert gen_resp.assistant_message.mode == "general_chat"
    assert len(gen_resp.assistant_message.citations) == 0

    # 3. Cleanup
    delete_conversation(doc_conv.id)
    delete_conversation(gen_conv.id)

def test_dedicated_general_chat_endpoint():
    resp = general_chat(GeneralChatRequest(message="What is artificial intelligence?"))
    assert resp.conversation_id is not None
    assert resp.assistant_message.mode == "general_chat"
    assert len(resp.assistant_message.citations) == 0
    assert "Answer not found in the uploaded documents." not in resp.assistant_message.content
    delete_conversation(resp.conversation_id)

def test_conversation_smart_management():
    conv = create_conversation(CreateConversationRequest(title="Initial Title", mode="general_chat"))
    conv_id = conv.id

    updated = update_conversation(conv_id, UpdateConversationRequest(title="Renamed Title", is_pinned=True))
    assert updated.title == "Renamed Title"
    assert updated.is_pinned is True

    searched = list_conversations(search="Renamed")
    assert any(c.id == conv_id for c in searched)

    exported = export_conversation(conv_id)
    content_str = exported.body.decode("utf-8") if hasattr(exported, "body") else str(exported)
    assert "=== DocuQuery AI Chat Transcript ===" in content_str
    assert "Renamed Title" in content_str

    delete_conversation(conv_id)

def test_document_intelligence_and_preview():
    # 1. Upload sample document for intelligence testing
    txt_path = SAMPLES_DIR / "sample_notes.txt"
    with open(txt_path, "rb") as f:
        upload_file = UploadFile(filename="sample_notes.txt", file=f)
        docs = upload_documents(files=[upload_file])
    doc_id = docs[0].id

    # Test preview
    preview = get_document_preview(doc_id)
    assert preview.document_id == doc_id
    assert preview.filename == "sample_notes.txt"
    assert len(preview.content) > 0
    assert preview.total_chunks > 0

    # Test key points
    kp = get_key_points(doc_id)
    assert kp["document_id"] == doc_id
    assert isinstance(kp["key_points"], list)

    # Test definitions
    defs = get_definitions(doc_id)
    assert defs["document_id"] == doc_id
    assert isinstance(defs["definitions"], list)

    # Test revision notes
    rev = get_revision_notes(doc_id)
    assert rev["document_id"] == doc_id
    assert len(rev["revision_notes"]) > 0

    # Test document comparison
    comp = compare_documents(DocumentCompareRequest(document_ids=[doc_id, doc_id]))
    assert len(comp.document_titles) >= 1
    assert comp.synthesis is not None

    delete_document(doc_id)

def test_study_assistant():
    # Upload sample
    txt_path = SAMPLES_DIR / "sample_notes.txt"
    with open(txt_path, "rb") as f:
        upload_file = UploadFile(filename="sample_notes.txt", file=f)
        docs = upload_documents(files=[upload_file])
    doc_id = docs[0].id

    # Test MCQ generation
    mcqs = generate_mcqs(GenerateMCQRequest(document_id=doc_id, difficulty="medium", count=3))
    assert len(mcqs) > 0
    assert mcqs[0].question is not None
    assert len(mcqs[0].options) == 4
    assert mcqs[0].correct_answer is not None

    # Test Flashcard generation
    flashcards = generate_flashcards(GenerateFlashcardsRequest(document_id=doc_id, count=3))
    assert len(flashcards) > 0
    assert flashcards[0].front is not None
    assert flashcards[0].back is not None

    # Test Concept explanation
    exp = explain_concept(ConceptExplainRequest(concept="Vector Embeddings", level="beginner", document_id=doc_id))
    assert exp["concept"] == "Vector Embeddings"
    assert len(exp["explanation"]) > 0

    # Test List study sets
    sets = list_study_sets()
    assert isinstance(sets, list)
    assert len(sets) >= 1

    delete_document(doc_id)

def test_writing_assistant():
    resp = process_writing(WritingRequest(
        text="The quick brown fox jumps over the lazy dog.",
        operation="simplify",
        tone="friendly"
    ))
    assert resp.operation == "simplify"
    assert len(resp.result) > 0

def test_dashboard_and_preferences():
    # Test dashboard stats
    stats = get_dashboard_stats()
    assert stats.total_documents >= 0
    assert stats.total_chunks >= 0
    assert stats.active_model is not None
    assert isinstance(stats.recent_activity, list)

    # Test preferences GET
    prefs = get_preferences()
    assert prefs.theme in ["light", "dark", "system"]
    assert prefs.response_length in ["concise", "balanced", "detailed"]

    # Test preferences PUT
    updated = update_preferences(UserPreferences(
        response_length="concise",
        response_style="bullet_points",
        tone="professional",
        theme="dark",
        voice_enabled=True
    ))
    assert updated.response_length == "concise"
    assert updated.theme == "dark"

