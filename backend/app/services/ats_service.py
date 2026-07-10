from app.services.ai_service import AIService

class ATSService:
    @staticmethod
    def analyze_resume(extracted_text: str) -> dict:
        """
        Analyzes the resume text using live Gemini and extracts skills and ATS metrics.
        """
        return AIService.analyze_resume_ats(extracted_text, "General Industry Standards")
