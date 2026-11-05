import pytest
from pathlib import Path
from app.document_processing.extractor import DocumentExtractor, ExtractionError
from app.document_processing.cleaner import clean_text
from app.document_processing.chunker import TextChunker

SAMPLES_DIR = Path(__file__).resolve().parent.parent / "test_samples"

def test_clean_text():
    dirty = "  Hello   world \xa0 with\r\nnewlines \n\n\n\n and spaces.  \x00 "
    cleaned = clean_text(dirty)
    assert cleaned == "Hello world with\nnewlines\n\nand spaces."

def test_extract_pdf():
    pdf_path = SAMPLES_DIR / "sample_contract.pdf"
    assert pdf_path.exists()
    units = DocumentExtractor.extract(pdf_path)
    
    assert len(units) >= 2
    # Verify page numbers preserved
    pages = [u.page_number for u in units]
    assert 1 in pages
    assert 2 in pages
    
    # Check text content
    p1_text = " ".join(u.text for u in units if u.page_number == 1)
    assert "$250,000" in p1_text or "Scope of Services" in p1_text
    
    p2_text = " ".join(u.text for u in units if u.page_number == 2)
    assert "99.95%" in p2_text or "AES-256" in p2_text

def test_extract_docx():
    docx_path = SAMPLES_DIR / "sample_technical_spec.docx"
    assert docx_path.exists()
    units = DocumentExtractor.extract(docx_path)
    
    assert len(units) > 0
    sections = [u.section for u in units if u.section]
    assert any("System Architecture" in s or "Ingestion" in s for s in sections)
    
    combined_text = " ".join(u.text for u in units)
    assert "ChromaDB" in combined_text
    assert "all-MiniLM-L6-v2" in combined_text

def test_extract_txt():
    txt_path = SAMPLES_DIR / "sample_notes.txt"
    assert txt_path.exists()
    units = DocumentExtractor.extract(txt_path)
    
    assert len(units) > 0
    sections = [u.section for u in units if u.section]
    assert any("Executive Summary" in s or "Key Findings" in s for s in sections)
    
    combined_text = " ".join(u.text for u in units)
    assert "94.2%" in combined_text

def test_chunking():
    chunker = TextChunker(chunk_size=300, chunk_overlap=50)
    pdf_path = SAMPLES_DIR / "sample_contract.pdf"
    units = DocumentExtractor.extract(pdf_path)
    chunks = chunker.chunk_document(doc_id="test_doc_1", filename="contract.pdf", units=units)
    
    assert len(chunks) > 0
    for c in chunks:
        assert c.doc_id == "test_doc_1"
        assert c.filename == "contract.pdf"
        assert c.page_number in [1, 2]
        assert len(c.text) > 0

def test_empty_file_handling(tmp_path):
    empty_file = tmp_path / "empty.txt"
    empty_file.write_text("")
    with pytest.raises(ExtractionError):
        DocumentExtractor.extract(empty_file)

def test_corrupt_file_handling(tmp_path):
    corrupt_pdf = tmp_path / "corrupt.pdf"
    corrupt_pdf.write_bytes(b"Not a real pdf header at all.")
    with pytest.raises(ExtractionError):
        DocumentExtractor.extract(corrupt_pdf)
