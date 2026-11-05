from typing import List
from fastapi import APIRouter
from app.models.schemas import (
    DocumentSummaryResponse,
    DocumentCompareRequest,
    DocumentCompareResponse,
    DocumentPreviewResponse
)
from app.services.document_intelligence import document_intelligence_service

router = APIRouter(prefix="/api/documents", tags=["document_intelligence"])

@router.post("/{doc_id}/summarize", response_model=DocumentSummaryResponse)
def summarize_document(doc_id: str):
    """Generates an executive summary, key points, definitions, and revision notes."""
    return document_intelligence_service.summarize_document(doc_id)

@router.post("/{doc_id}/key-points")
def get_key_points(doc_id: str):
    """Extracts high-yield bulleted key points."""
    res = document_intelligence_service.summarize_document(doc_id)
    return {"document_id": doc_id, "key_points": res.key_points}

@router.post("/{doc_id}/definitions")
def get_definitions(doc_id: str):
    """Extracts key definitions and terminology glossary."""
    res = document_intelligence_service.summarize_document(doc_id)
    return {"document_id": doc_id, "definitions": res.definitions}

@router.post("/{doc_id}/revision-notes")
def get_revision_notes(doc_id: str):
    """Extracts structured revision notes."""
    res = document_intelligence_service.summarize_document(doc_id)
    return {"document_id": doc_id, "revision_notes": res.revision_notes}

@router.post("/compare", response_model=DocumentCompareResponse)
def compare_documents(req: DocumentCompareRequest):
    """Cross-analyzes and compares 2 or more documents."""
    return document_intelligence_service.compare_documents(req.document_ids)

@router.get("/{doc_id}/preview", response_model=DocumentPreviewResponse)
def get_document_preview(doc_id: str):
    """Retrieves full text and page metadata for preview modal."""
    return document_intelligence_service.get_document_preview(doc_id)
