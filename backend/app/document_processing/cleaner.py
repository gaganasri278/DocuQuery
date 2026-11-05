import re

def clean_text(text: str) -> str:
    """
    Cleans and normalizes extracted text:
    - Normalizes line breaks and whitespace
    - Strips non-printable ASCII/Unicode control characters
    - Preserves semantic punctuation and paragraph structure
    - Trims spaces around lines
    """
    if not text:
        return ""
    
    # Replace non-breaking spaces and special zero-width characters
    text = text.replace("\xa0", " ").replace("\u200b", "")
    
    # Normalize carriage returns
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    
    # Remove control characters except standard whitespace (\n, \t)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    
    # Clean up spaces around newlines
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    
    # Collapse multiple inline spaces and tabs into single space
    text = re.sub(r"[ \t]+", " ", text)

    # Collapse 3 or more newlines into 2 (preserve paragraph separation)
    text = re.sub(r"\n{3,}", "\n\n", text)
    
    return text.strip()
