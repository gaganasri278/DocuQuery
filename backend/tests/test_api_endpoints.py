import pytest
from pathlib import Path
from fastapi import UploadFile
from app.routes.documents import upload_documents, list_documents, delete_document, get_document, load_sample_documents
from app.routes.conversations import create_conversation, list_conversations, get_conversation, delete_conversation
from app.routes.chat import chat, general_chat
from app.routes.settings import get_settings, update_settings
from app.models.schemas import CreateConversationRequest, ChatRequest, GeneralChatRequest, UpdateSettingsRequest
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
