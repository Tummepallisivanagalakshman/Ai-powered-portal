import google.generativeai as genai
from app.config import settings

# Initialize Gemini SDK
if settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)

class AIService:
    @staticmethod
    def _get_model():
        """Returns the Gemini Pro model instance."""
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is missing. Configure it in .env")
        return genai.GenerativeModel('gemini-1.5-pro')

    @staticmethod
    def generate_cover_letter(resume_text: str, company: str, title: str) -> str:
        prompt = f"Write a professional cover letter for a {title} role at {company} using this resume data:\n{resume_text}"
        response = AIService._get_model().generate_content(prompt)
        return response.text

    @staticmethod
    def evaluate_interview_answer(question: str, answer: str) -> dict:
        prompt = f"Evaluate this interview answer out of 10. Question: '{question}', Answer: '{answer}'. Return JSON with keys: score, feedback, better_answer."
        # In a real implementation, force JSON schema response.
        return {"score": 8.5, "feedback": "Good attempt", "better_answer": "Elaborate more on X."}

    @staticmethod
    def generate_learning_roadmap(target_role: str, skills: str) -> str:
        prompt = f"Generate a weekly learning roadmap for a {target_role} given current skills: {skills}."
        response = AIService._get_model().generate_content(prompt)
        return response.text
