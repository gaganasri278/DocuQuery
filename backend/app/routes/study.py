from typing import List, Dict, Any
from fastapi import APIRouter
from app.models.schemas import (
    MCQItem,
    GenerateMCQRequest,
    FlashcardItem,
    GenerateFlashcardsRequest,
    ConceptExplainRequest
)
from app.services.study_service import study_service

router = APIRouter(prefix="/api/study", tags=["study"])

@router.post("/mcq", response_model=List[MCQItem])
def generate_mcqs(req: GenerateMCQRequest):
    """Generates multiple choice questions with explanations based on document."""
    return study_service.generate_mcqs(
        doc_id=req.document_id,
        difficulty=req.difficulty or "medium",
        count=req.count or 5
    )

@router.post("/flashcards", response_model=List[FlashcardItem])
def generate_flashcards(req: GenerateFlashcardsRequest):
    """Generates revision flashcards from document."""
    return study_service.generate_flashcards(
        doc_id=req.document_id,
        count=req.count or 6
    )

@router.post("/explain")
def explain_concept(req: ConceptExplainRequest):
    """Explains a complex concept with intuitive analogies and breakdowns."""
    explanation = study_service.explain_concept(
        concept=req.concept,
        level=req.level or "beginner",
        doc_id=req.document_id
    )
    return {"concept": req.concept, "level": req.level, "explanation": explanation}

@router.get("/sets")
def list_study_sets() -> List[Dict[str, Any]]:
    """Returns saved study sets (flashcards & quizzes)."""
    return study_service.list_study_sets()
