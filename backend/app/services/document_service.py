import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import UploadFile, HTTPException

from app.config import settings
from app.database.connection import get_db
from app.models.schemas import DocumentResponse
from app.document_processing.extractor import DocumentExtractor, ExtractionError
from app.document_processing.chunker import TextChunker
from app.retrieval.vector_store import vector_store

class DocumentService:
    def __init__(self):
        self.chunker = TextChunker(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap
        )

    def upload_and_process(self, file: UploadFile) -> DocumentResponse:
        filename = file.filename or "unknown_file"
        ext = Path(filename).suffix.lower()

        if ext not in settings.allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(settings.allowed_extensions)}"
            )

        doc_id = str(uuid.uuid4())
        safe_filename = f"{doc_id}_{Path(filename).name}"
        saved_path = settings.upload_dir / safe_filename

        # Write uploaded bytes to disk
        file_size = 0
        try:
            with open(saved_path, "wb") as buffer:
                while True:
                    content = file.file.read(1024 * 1024)
                    if not content:
                        break
                    file_size += len(content)
                    if file_size > settings.max_file_size_mb * 1024 * 1024:
                        buffer.close()
                        if saved_path.exists():
                            saved_path.unlink()
                        raise HTTPException(
                            status_code=413,
                            detail=f"File exceeds maximum allowed size of {settings.max_file_size_mb} MB."
                        )
                    buffer.write(content)
        except HTTPException:
            raise
        except Exception as e:
            if saved_path.exists():
                saved_path.unlink()
            raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

        # Insert record in SQLite as processing
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO documents (id, filename, file_type, file_size, file_path, status, chunk_count)
                VALUES (?, ?, ?, ?, ?, 'processing', 0)
                """,
                (doc_id, filename, ext.lstrip("."), file_size, str(saved_path))
            )
            conn.commit()

        # Process document
        try:
            extracted_units = DocumentExtractor.extract(saved_path)
            chunks = self.chunker.chunk_document(doc_id=doc_id, filename=filename, units=extracted_units)
            
            if not chunks:
                raise ExtractionError("No meaningful chunks could be created from this document.")

            # Index in ChromaDB
            vector_store.add_chunks(chunks)

            # Update SQLite as ready
            with get_db() as conn:
                conn.execute(
                    """
                    UPDATE documents
                    SET status = 'ready', chunk_count = ?
                    WHERE id = ?
                    """,
                    (len(chunks), doc_id)
                )
                conn.commit()

            return self.get_document(doc_id)

        except Exception as e:
            error_msg = str(e)
            with get_db() as conn:
                conn.execute(
                    """
                    UPDATE documents
                    SET status = 'failed', error_message = ?
                    WHERE id = ?
                    """,
                    (error_msg, doc_id)
                )
                conn.commit()
            
            raise HTTPException(status_code=422, detail=f"Document processing failed: {error_msg}")

    def load_samples(self) -> List[DocumentResponse]:
        """Loads bundled test samples into knowledge base without duplicating existing files."""
        samples_dir = settings.base_dir / "test_samples"
        results = []
        if not samples_dir.exists():
            return results

        existing = {d.filename for d in self.list_documents()}

        for sample_file in samples_dir.iterdir():
            if sample_file.suffix.lower() in settings.allowed_extensions:
                if sample_file.name in existing:
                    continue
                with open(sample_file, "rb") as f:
                    upload_file = UploadFile(filename=sample_file.name, file=f)
                    doc = self.upload_and_process(upload_file)
                    results.append(doc)
        return results

    def list_documents(self) -> List[DocumentResponse]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM documents ORDER BY created_at DESC")
            rows = cursor.fetchall()

        docs = []
        for r in rows:
            docs.append(DocumentResponse(
                id=r["id"],
                filename=r["filename"],
                file_type=r["file_type"],
                file_size=r["file_size"],
                status=r["status"],
                chunk_count=r["chunk_count"],
                error_message=r["error_message"],
                created_at=str(r["created_at"])
            ))
        return docs

    def get_document(self, doc_id: str) -> Optional[DocumentResponse]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
            r = cursor.fetchone()

        if not r:
            return None

        return DocumentResponse(
            id=r["id"],
            filename=r["filename"],
            file_type=r["file_type"],
            file_size=r["file_size"],
            status=r["status"],
            chunk_count=r["chunk_count"],
            error_message=r["error_message"],
            created_at=str(r["created_at"])
        )

    def delete_document(self, doc_id: str) -> bool:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT file_path FROM documents WHERE id = ?", (doc_id,))
            row = cursor.fetchone()
            if not row:
                return False

            file_path = Path(row["file_path"])
            if file_path.exists():
                try:
                    file_path.unlink()
                except Exception:
                    pass

            # Remove from Chroma
            vector_store.delete_document(doc_id)

            # Remove from SQLite
            cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
            conn.commit()
            return True

document_service = DocumentService()
