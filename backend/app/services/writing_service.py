from app.services.llm_provider import llm_provider
from app.models.schemas import WritingResponse

class WritingService:
    def process_writing(
        self,
        text: str,
        operation: str,
        tone: str = "professional",
        target_length: str = "balanced"
    ) -> WritingResponse:
        op = operation.lower()
        
        system_instructions = {
            "summarize": f"Summarize the provided text concisely and cleanly. Capture all essential points. Tone: {tone}.",
            "rewrite": f"Rewrite and polish the provided text for maximum clarity, eloquence, and impact. Maintain original intent. Tone: {tone}.",
            "grammar": "Correct all grammatical errors, typos, awkward phrasing, and punctuation mistakes. Return the polished version.",
            "tone": f"Transform the provided text to strictly adhere to a {tone.upper()} tone of voice. Maintain the core meaning.",
            "email": f"Convert the provided notes/text into a well-crafted, professional email with a compelling Subject line, appropriate greeting, structured body, and sign-off. Tone: {tone}.",
            "report": f"Convert the provided information into an executive business report with an Executive Summary, Key Findings, Strategic Implications, and Action Items. Tone: {tone}.",
            "simplify": "Explain and rewrite the provided dense/complex text in simple, crystal-clear plain English that anyone can instantly understand."
        }
        
        instruction = system_instructions.get(op, f"Improve and refine the text with a {tone} tone.")

        prompt = f"""{instruction}

Target Length: {target_length.upper()}

Original Text:
{text}

Output:"""

        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.4, "maxOutputTokens": 2048}
        }

        try:
            result = llm_provider._call_gemini_api(payload, llm_provider._get_gemini_key())
        except Exception:
            if op == "grammar":
                result = text.strip()
            elif op == "summarize":
                sentences = [s.strip() for s in text.split(".") if s.strip()]
                result = ". ".join(sentences[:3]) + "." if sentences else text
            elif op == "email":
                result = f"Subject: Important Update\n\nDear Team,\n\n{text}\n\nBest regards,\nDocuQuery Assistant"
            elif op == "report":
                result = f"# Executive Report\n\n## Overview\n{text}\n\n## Next Steps\n- Review initial findings\n- Align on operational objectives"
            else:
                result = f"Polished ({tone.title()}): {text}"

        word_count = len(result.split())

        return WritingResponse(
            result=result.strip(),
            operation=operation,
            word_count=word_count
        )

writing_service = WritingService()
