import re
from pathlib import Path
from typing import List, Optional
from dataclasses import dataclass

try:
    import pymupdf  # PyMuPDF
except ImportError:
    import fitz as pymupdf

import docx

class ExtractionError(Exception):
    pass

@dataclass
class ExtractedUnit:
    text: str
    page_number: Optional[int] = None
    section: Optional[str] = None

class DocumentExtractor:
    @staticmethod
    def extract(file_path: Path) -> List[ExtractedUnit]:
        """
        Extracts structured content from PDF, DOCX, or TXT file.
        Preserves page numbers (PDF) and section headings (DOCX/TXT).
        """
        if not file_path.exists():
            raise ExtractionError(f"File not found: {file_path}")
        
        if file_path.stat().st_size == 0:
            raise ExtractionError("The uploaded file is empty (0 bytes).")
        
        ext = file_path.suffix.lower()
        if ext == ".pdf":
            return DocumentExtractor._extract_pdf(file_path)
        elif ext == ".docx":
            return DocumentExtractor._extract_docx(file_path)
        elif ext == ".txt":
            return DocumentExtractor._extract_txt(file_path)
        else:
            raise ExtractionError(f"Unsupported file format '{ext}'. Supported: .pdf, .docx, .txt")

    @staticmethod
    def _extract_pdf(file_path: Path) -> List[ExtractedUnit]:
        units: List[ExtractedUnit] = []
        try:
            doc = pymupdf.open(str(file_path))
        except Exception as e:
            raise ExtractionError(f"Corrupted or invalid PDF file: {str(e)}")
        
        if doc.page_count == 0:
            raise ExtractionError("PDF file contains no pages.")
        
        total_text_length = 0
        for page_idx in range(doc.page_count):
            page = doc[page_idx]
            page_num = page_idx + 1
            
            # Extract text blocks to identify possible section headers
            blocks = page.get_text("blocks")
            current_section: Optional[str] = None
            page_text_parts: List[str] = []
            
            for b in blocks:
                # b: (x0, y0, x1, y1, text, block_no, block_type)
                if len(b) >= 5:
                    block_text = b[4].strip()
                    if not block_text:
                        continue
                    
                    # Detect if single short line looks like a header (e.g. bold or short uppercase/numbered)
                    lines = block_text.splitlines()
                    if len(lines) == 1 and len(block_text) < 80:
                        if re.match(r"^(\d+(\.\d+)*|[A-Z][\w\s]{2,40}):?$", block_text):
                            current_section = block_text
                    
                    page_text_parts.append(block_text)
            
            combined_page_text = "\n\n".join(page_text_parts)
            if combined_page_text.strip():
                units.append(ExtractedUnit(
                    text=combined_page_text,
                    page_number=page_num,
                    section=current_section or f"Page {page_num}"
                ))
                total_text_length += len(combined_page_text)
                
        doc.close()
        
        if total_text_length == 0:
            raise ExtractionError("No readable text could be extracted from this PDF. It may contain scanned images without OCR.")
            
        return units

    @staticmethod
    def _extract_docx(file_path: Path) -> List[ExtractedUnit]:
        units: List[ExtractedUnit] = []
        try:
            doc = docx.Document(str(file_path))
        except Exception as e:
            raise ExtractionError(f"Corrupted or invalid DOCX document: {str(e)}")
        
        current_section = "General"
        current_section_paragraphs: List[str] = []
        
        for p in doc.paragraphs:
            text = p.text.strip()
            if not text:
                continue
            
            style_name = (p.style.name if p.style else "").lower()
            if "heading" in style_name or "title" in style_name:
                # Save previous section if it has text
                if current_section_paragraphs:
                    units.append(ExtractedUnit(
                        text="\n\n".join(current_section_paragraphs),
                        page_number=None,
                        section=current_section
                    ))
                    current_section_paragraphs = []
                current_section = text
            else:
                current_section_paragraphs.append(text)
        
        # Also extract table text
        for table in doc.tables:
            table_rows: List[str] = []
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    table_rows.append(row_text)
            if table_rows:
                current_section_paragraphs.append("\n".join(table_rows))
        
        if current_section_paragraphs:
            units.append(ExtractedUnit(
                text="\n\n".join(current_section_paragraphs),
                page_number=None,
                section=current_section
            ))
            
        if not units:
            raise ExtractionError("The DOCX document contains no text.")
            
        return units

    @staticmethod
    def _extract_txt(file_path: Path) -> List[ExtractedUnit]:
        content = ""
        # Try different encodings
        for enc in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
            try:
                content = file_path.read_text(encoding=enc)
                break
            except UnicodeDecodeError:
                continue
                
        if not content.strip():
            raise ExtractionError("The TXT document is empty or unreadable.")
            
        units: List[ExtractedUnit] = []
        lines = content.splitlines()
        current_section = "General"
        current_paragraphs: List[str] = []
        
        for line in lines:
            trimmed = line.strip()
            # Detect Markdown headers: # Heading, ## Subheading
            header_match = re.match(r"^#{1,4}\s+(.+)$", trimmed)
            if header_match:
                if current_paragraphs:
                    units.append(ExtractedUnit(
                        text="\n".join(current_paragraphs),
                        page_number=None,
                        section=current_section
                    ))
                    current_paragraphs = []
                current_section = header_match.group(1).strip()
            elif re.match(r"^[A-Z0-9\s_-]{3,50}:$", trimmed):
                if current_paragraphs:
                    units.append(ExtractedUnit(
                        text="\n".join(current_paragraphs),
                        page_number=None,
                        section=current_section
                    ))
                    current_paragraphs = []
                current_section = trimmed.rstrip(":")
            else:
                if trimmed:
                    current_paragraphs.append(trimmed)
                    
        if current_paragraphs:
            units.append(ExtractedUnit(
                text="\n".join(current_paragraphs),
                page_number=None,
                section=current_section
            ))
            
        return units
