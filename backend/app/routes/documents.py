from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import DocumentResponse
from app.services.document_service import document_service

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/upload", response_model=List[DocumentResponse])
def upload_documents(files: List[UploadFile] = File(...)):
    """
    Accepts single or multiple document uploads (PDF, DOCX, TXT).
    Processes, extracts, chunks, and indexes in ChromaDB.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    responses = []
    errors = []

    for file in files:
        try:
            doc = document_service.upload_and_process(file)
            responses.append(doc)
        except HTTPException as he:
            errors.append(f"{file.filename}: {he.detail}")
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")

    if not responses and errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))

    return responses

@router.post("/load-samples", response_model=List[DocumentResponse])
def load_sample_documents():
    """Loads bundled sample documents (PDF, DOCX, TXT) into the knowledge base."""
    return document_service.load_samples()

@router.get("", response_model=List[DocumentResponse])
def list_documents():
    """Returns metadata for all uploaded documents."""
    return document_service.list_documents()

@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: str):
    doc = document_service.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc

@router.post("/{doc_id}/reindex", response_model=DocumentResponse)
def reindex_document(doc_id: str):
    """Re-indexes an existing document."""
    return document_service.reindex_document(doc_id)

@router.delete("/{doc_id}")
def delete_document(doc_id: str):
    """Deletes document metadata, physical file, and vector store embeddings."""
    success = document_service.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"status": "success", "message": f"Document {doc_id} deleted successfully."}
