from fastapi import APIRouter
from app.models.schemas import WritingRequest, WritingResponse
from app.services.writing_service import writing_service

router = APIRouter(prefix="/api/writing", tags=["writing"])

@router.post("/process", response_model=WritingResponse)
def process_writing(req: WritingRequest):
    """Processes text using specialized writing transformations."""
    return writing_service.process_writing(
        text=req.text,
        operation=req.operation,
        tone=req.tone or "professional",
        target_length=req.target_length or "balanced"
    )
