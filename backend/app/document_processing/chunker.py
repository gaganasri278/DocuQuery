import re
from typing import List, Optional
from dataclasses import dataclass
from app.document_processing.cleaner import clean_text
from app.document_processing.extractor import ExtractedUnit

@dataclass
class DocumentChunk:
    chunk_id: str
    doc_id: str
    filename: str
    page_number: Optional[int]
    section: Optional[str]
    text: str
    chunk_index: int
    char_count: int

class TextChunker:
    def __init__(self, chunk_size: int = 600, chunk_overlap: int = 120):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document(self, doc_id: str, filename: str, units: List[ExtractedUnit]) -> List[DocumentChunk]:
        """
        Splits extracted units into semantic, overlapping chunks with metadata preservation.
        """
        all_chunks: List[DocumentChunk] = []
        global_chunk_idx = 0

        for unit in units:
            cleaned = clean_text(unit.text)
            if not cleaned:
                continue

            # If unit text is smaller than or equal to chunk_size, create a single chunk
            if len(cleaned) <= self.chunk_size:
                all_chunks.append(DocumentChunk(
                    chunk_id=f"{doc_id}_chunk_{global_chunk_idx}",
                    doc_id=doc_id,
                    filename=filename,
                    page_number=unit.page_number,
                    section=unit.section,
                    text=cleaned,
                    chunk_index=global_chunk_idx,
                    char_count=len(cleaned)
                ))
                global_chunk_idx += 1
                continue

            # Split larger text by sentence or paragraph breaks
            unit_sub_chunks = self._split_text_with_overlap(cleaned)
            for sub_text in unit_sub_chunks:
                if len(sub_text.strip()) < 20:
                    continue
                all_chunks.append(DocumentChunk(
                    chunk_id=f"{doc_id}_chunk_{global_chunk_idx}",
                    doc_id=doc_id,
                    filename=filename,
                    page_number=unit.page_number,
                    section=unit.section,
                    text=sub_text.strip(),
                    chunk_index=global_chunk_idx,
                    char_count=len(sub_text.strip())
                ))
                global_chunk_idx += 1

        return all_chunks

    def _split_text_with_overlap(self, text: str) -> List[str]:
        # Split text into sentences using punctuation boundaries
        sentence_delimiters = re.split(r'(?<=[.!?])\s+|\n\n+', text)
        sentences = [s.strip() for s in sentence_delimiters if s.strip()]
        
        chunks: List[str] = []
        current_chunk: List[str] = []
        current_len = 0

        for s in sentences:
            s_len = len(s)
            # If a single sentence exceeds chunk_size, split by characters
            if s_len > self.chunk_size:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = []
                    current_len = 0
                for i in range(0, s_len, self.chunk_size - self.chunk_overlap):
                    sub = s[i:i + self.chunk_size]
                    if sub.strip():
                        chunks.append(sub.strip())
                continue

            if current_len + s_len + 1 > self.chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                # Compute overlap from end of current chunk
                overlap_chunk: List[str] = []
                overlap_len = 0
                for prev in reversed(current_chunk):
                    if overlap_len + len(prev) <= self.chunk_overlap:
                        overlap_chunk.insert(0, prev)
                        overlap_len += len(prev)
                    else:
                        break
                current_chunk = overlap_chunk
                current_len = sum(len(x) + 1 for x in current_chunk)

            current_chunk.append(s)
            current_len += s_len + 1

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks
