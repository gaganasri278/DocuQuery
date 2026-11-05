import os
from pathlib import Path
try:
    import pymupdf
except ImportError:
    import fitz as pymupdf
import docx

OUTPUT_DIR = Path(__file__).resolve().parent

def create_sample_pdf():
    pdf_path = OUTPUT_DIR / "sample_contract.pdf"
    doc = pymupdf.open()

    # Page 1: Scope of Services & Overview
    page1 = doc.new_page(width=595, height=842) # A4
    page1.insert_text(
        (50, 70),
        "MASTER SERVICES AGREEMENT",
        fontsize=16,
        fontname="helv",
        color=(0, 0, 0)
    )
    text_p1 = """Section 1: Scope of Services
The Service Provider agrees to deliver enterprise cloud migration and AI optimization services.
The project commencement date is set for January 15, 2025.
The estimated duration of the engagement is six months, ending on July 15, 2025.

Section 2: Payment and Invoicing Terms
Total contract value is fixed at $250,000 USD.
Payment schedule consists of three milestone payments:
1. Initial deposit of 30% ($75,000) due upon contract signing.
2. Midterm milestone of 40% ($100,000) upon completion of Phase 2 data migration.
3. Final milestone of 30% ($75,000) upon client acceptance testing.
Invoices are payable within 30 days of receipt."""
    page1.insert_text((50, 110), text_p1, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    # Page 2: Confidentiality & Service Level Agreements
    page2 = doc.new_page(width=595, height=842)
    page2.insert_text(
        (50, 70),
        "AGREEMENT TERMS - PAGE 2",
        fontsize=16,
        fontname="helv",
        color=(0, 0, 0)
    )
    text_p2 = """Section 3: Confidentiality and Data Security
Both parties agree to protect proprietary information for a period of five (5) years following termination.
All client data stored in the cloud must be encrypted using AES-256 at rest and TLS 1.3 in transit.
Security audits will be conducted quarterly by an independent certified third party.

Section 4: Service Level Agreement (SLA)
The Service Provider guarantees an operational system uptime of 99.95% during business hours.
Critical issues (Severity 1) must be acknowledged within 15 minutes and resolved within 4 hours.
Non-critical issues (Severity 3) will be resolved within 48 business hours.
Failure to maintain uptime will result in a 5% credit on the monthly service fee."""
    page2.insert_text((50, 110), text_p2, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    doc.save(str(pdf_path))
    doc.close()
    print(f"Created {pdf_path}")

def create_sample_docx():
    docx_path = OUTPUT_DIR / "sample_technical_spec.docx"
    doc = docx.Document()

    doc.add_heading("AI Vector Search Engine Technical Specification", level=0)

    doc.add_heading("System Architecture", level=1)
    doc.add_paragraph(
        "The architecture consists of a React TypeScript frontend, FastAPI REST backend, "
        "and ChromaDB vector database. Embeddings are generated using the sentence-transformers "
        "all-MiniLM-L6-v2 model producing 384-dimensional dense vectors."
    )

    doc.add_heading("Document Ingestion Pipeline", level=1)
    doc.add_paragraph(
        "Documents uploaded via the REST API undergo text extraction with PyMuPDF for PDFs and python-docx for DOCX files. "
        "Text is normalized to remove control characters and chunked with a sliding window of 600 characters and 120 character overlap."
    )

    doc.add_heading("Performance Benchmarks", level=2)
    p = doc.add_paragraph()
    p.add_run("Average query latency is under 45 milliseconds for vector retrieval. ").bold = True
    p.add_run("Maximum memory footprint during peak indexing is constrained to 512 MB per worker.")

    doc.save(str(docx_path))
    print(f"Created {docx_path}")

def create_sample_txt():
    txt_path = OUTPUT_DIR / "sample_notes.txt"
    content = """# Project Alpha Research Notes

## Executive Summary
Project Alpha evaluates hybrid retrieval architectures combining BM25 keyword matching with dense neural vector search. The objective is improving retrieval recall on specialized technical documentation.

## Key Findings
1. Hybrid retrieval achieved a 94.2% recall rate compared to 81.5% for pure keyword search.
2. Embedding-based search handled semantic synonyms effectively (e.g., mapping 'payment schedule' to 'invoicing milestones').
3. Strict grounding prompts reduced hallucination rates from 18.4% down to 0.5%.

## Next Milestones
- Milestone 1: Deploy ChromaDB on SSD storage by March 1st.
- Milestone 2: Conduct user acceptance testing with 50 domain specialists.
- Milestone 3: Implement streaming token generation in the React user interface.
"""
    txt_path.write_text(content, encoding="utf-8")
    print(f"Created {txt_path}")

if __name__ == "__main__":
    create_sample_pdf()
    create_sample_docx()
    create_sample_txt()
