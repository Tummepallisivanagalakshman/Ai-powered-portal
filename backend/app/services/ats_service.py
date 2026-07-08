import random
# In a real scenario, this would call the AI Service (Google Generative AI).
# For now, we will structure the service to mock the ATS logic so we can build the API skeleton.

class ATSService:
    @staticmethod
    def analyze_resume(extracted_text: str) -> dict:
        """
        Analyzes the resume text to extract skills and ATS metrics.
        """
        # Mocking an AI response for demonstration
        score = random.uniform(60.0, 95.0)
        return {
            "score": round(score, 2),
            "missing_keywords": "Docker, Kubernetes, AWS",
            "formatting_issues": "None detected",
            "strengths": "Strong Python experience, good use of metrics",
            "weaknesses": "Lacks cloud infrastructure experience"
        }
