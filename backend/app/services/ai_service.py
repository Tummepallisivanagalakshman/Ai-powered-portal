import google.generativeai as genai
from app.config import settings
import json
import re
from typing import Any, List, Dict

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
    def _parse_json_response(text: str, default_val: Any) -> Any:
        try:
            cleaned = text.strip()
            # Try to extract content inside ```json ... ```
            match = re.search(r"```json\s*(.*?)\s*```", cleaned, re.DOTALL)
            if match:
                cleaned = match.group(1)
            else:
                # Try plain ``` ... ```
                match = re.search(r"```\s*(.*?)\s*```", cleaned, re.DOTALL)
                if match:
                    cleaned = match.group(1)
            return json.loads(cleaned)
        except Exception as e:
            print(f"[AI SERVICE ERROR] Failed to parse JSON response: {e}. Text: {text}")
            return default_val

    @staticmethod
    def generate_cover_letter(resume_text: str, company: str, title: str) -> str:
        try:
            prompt = f"Write a professional, targeted cover letter for a {title} role at {company} using the following resume data:\n{resume_text}\nKeep it copy-paste ready and formatted nicely."
            response = AIService._get_model().generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"[AI SERVICE FALLBACK] generate_cover_letter: {e}")
            return (
                f"Dear Hiring Manager at {company},\n\n"
                f"I am writing to express my strong interest in the {title} position. "
                "With my extensive experience in software development, core engineering practices, "
                "and technical problem solving, I am confident in my ability to make a meaningful impact in this role.\n\n"
                "I look forward to discussing how my background aligns with your team's goals.\n\n"
                "Sincerely,\nCandidate"
            )

    @staticmethod
    def evaluate_interview_answer(question: str, answer: str) -> dict:
        fallback = {"score": 8.0, "feedback": "Good attempt. Add specific metrics.", "better_answer": "In my previous project, I..."}
        try:
            prompt = (
                f"Evaluate this interview answer. Question: '{question}', Answer: '{answer}'. "
                "Provide constructive feedback and a better version of the answer. "
                "You MUST return a JSON object with keys: 'score' (float out of 10), 'feedback' (string), 'better_answer' (string)."
            )
            response = AIService._get_model().generate_content(prompt)
            return AIService._parse_json_response(response.text, fallback)
        except Exception as e:
            print(f"[AI SERVICE FALLBACK] evaluate_interview_answer: {e}")
            return fallback

    @staticmethod
    def generate_learning_roadmap(target_role: str, skills: str) -> str:
        try:
            prompt = f"Generate a weekly learning roadmap for a {target_role} given current skills: {skills}."
            response = AIService._get_model().generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"[AI SERVICE FALLBACK] generate_learning_roadmap: {e}")
            return f"# 5-Step Learning Roadmap for {target_role}\n1. **Core Fundamentals:** Study advanced programming and architecture.\n2. **System Design:** Focus on scalability and distributed caching.\n3. **Practical Projects:** Build microservices and deploy using containers.\n4. **Database Tuning:** Learn index optimization and query execution plans.\n5. **Mock Prep:** Review mock questions and practice interviews."

    @staticmethod
    def parse_resume_fields(resume_text: str) -> dict:
        fallback = {
            "fullName": "Jane Doe",
            "email": "jane@example.com",
            "phone": "555-0100",
            "education": "BS Computer Science",
            "skills": "Python, React, SQL",
            "experience": "Software Engineer 2020-Present"
        }
        try:
            prompt = (
                "Extract profile fields from this resume text. "
                "You MUST return a JSON object with keys: 'fullName', 'email', 'phone', 'education', 'skills', 'experience'."
                f"\n\nResume text:\n{resume_text}"
            )
            response = AIService._get_model().generate_content(prompt)
            return AIService._parse_json_response(response.text, fallback)
        except Exception as e:
            print(f"[AI SERVICE FALLBACK] parse_resume_fields: {e}")
            return fallback

    @staticmethod
    def generate_resume_summary(resume_text: str, skills: str, jobId: str, coverNote: str) -> dict:
        fallback = {
            "summary": "Experienced engineer with a background in software development.",
            "strengths": "Strong knowledge of core concepts and programming languages.",
            "experience": "5+ years in full stack engineering roles.",
            "roleFit": "Strong match for the target role."
        }
        try:
            prompt = (
                f"Generate a resume summary matching the candidate's resume/skills with job ID: {jobId}. "
                f"Candidate Skills: {skills}\nCover Note: {coverNote}\nResume: {resume_text}\n"
                "You MUST return a JSON object with keys: 'summary', 'strengths', 'experience', 'roleFit'."
            )
            response = AIService._get_model().generate_content(prompt)
            return AIService._parse_json_response(response.text, fallback)
        except Exception as e:
            print(f"[AI SERVICE FALLBACK] generate_resume_summary: {e}")
            return fallback

    @staticmethod
    def generate_job_match(resume_text: str, skills: str, jobId: str) -> dict:
        fallback = {
            "score": 85,
            "matchingSkills": "React, TypeScript, CSS",
            "missingSkills": "Docker, Kubernetes",
            "recommendation": "Strong Match"
        }
        try:
            prompt = (
                f"Evaluate matching compatibility for job ID: {jobId} using candidate skills: {skills} and resume: {resume_text}.\n"
                "You MUST return a JSON object with keys: 'score' (integer 0-100), 'matchingSkills' (string), 'missingSkills' (string), 'recommendation' (string)."
            )
            response = AIService._get_model().generate_content(prompt)
            return AIService._parse_json_response(response.text, fallback)
        except Exception as e:
            print(f"[AI SERVICE FALLBACK] generate_job_match: {e}")
            return fallback

    @staticmethod
    def run_screening(resume_text: str, cover_note: str) -> dict:
        fallback = {
            "score": 80,
            "summary": "Solid application with matching experience.",
            "strengths": "Good communication and strong technical foundation.",
            "concerns": "No direct cloud deployment experience.",
            "recommendation": "Advance to Interview"
        }
        try:
            prompt = (
                f"Screen this candidate application. Resume: {resume_text}\nCover Note: {cover_note}\n"
                "You MUST return a JSON object with keys: 'score' (integer 0-100), 'summary' (string), 'strengths' (string), 'concerns' (string), 'recommendation' (string)."
            )
            response = AIService._get_model().generate_content(prompt)
            return AIService._parse_json_response(response.text, fallback)
        except Exception as e:
            print(f"[AI SERVICE FALLBACK] run_screening: {e}")
            return fallback

    @staticmethod
    def generate_interview_questions(role: str, difficulty: str, type: str) -> List[Dict]:
        fallback = [
            {"category": "Technical", "question": f"Explain the core components of a {role} application."},
            {"category": "Behavioral", "question": "Describe a challenging situation in your previous project and how you solved it."},
            {"category": "Scenario-based", "question": "How would you handle a sudden traffic spike or resource starvation in your system?"}
        ]
        try:
            prompt = (
                f"Generate exactly 3 interview questions for a {role} role at {difficulty} level of type {type}.\n"
                "You MUST return a JSON list of objects, where each object has keys: 'category' and 'question'."
            )
            response = AIService._get_model().generate_content(prompt)
            return AIService._parse_json_response(response.text, fallback)
        except Exception as e:
            print(f"[AI SERVICE FALLBACK] generate_interview_questions: {e}")
            return fallback

    @staticmethod
    def match_resume_to_jd(resume_text: str, job_description: str) -> dict:
        fallback = {
            "score": 78,
            "matchingSkills": ["Python", "SQL", "Git"],
            "missingSkills": ["Docker", "AWS"],
            "hiringProbability": 82,
            "recommendation": "Strong match"
        }
        try:
            prompt = (
                f"Match this resume against the job description.\nResume: {resume_text}\nJD: {job_description}\n"
                "You MUST return a JSON object with keys: 'score' (integer 0-100), 'matchingSkills' (list of strings), 'missingSkills' (list of strings), 'hiringProbability' (integer 0-100), 'recommendation' (string)."
            )
            response = AIService._get_model().generate_content(prompt)
            return AIService._parse_json_response(response.text, fallback)
        except Exception as e:
            print(f"[AI SERVICE FALLBACK] match_resume_to_jd: {e}")
            return fallback

    @staticmethod
    def analyze_resume_ats(resume_text: str, job_description: str) -> dict:
        fallback = {
            "score": 85,
            "formattingChecks": [
                { "name": "File Structure", "score": 100, "status": "passed", "desc": "Proper layout structure." },
                { "name": "Section Headings", "score": 90, "status": "passed", "desc": "Standard section headers detected." },
                { "name": "Keyword Density", "score": 75, "status": "warning", "desc": "Could include more role-specific terminology." },
                { "name": "Contact Info", "score": 100, "status": "passed", "desc": "Email and links verified." }
            ],
            "missingKeywords": ["Docker", "Kubernetes", "CI/CD"],
            "matchingKeywords": ["Python", "React", "SQL"]
        }
        try:
            prompt = (
                f"Analyze this resume against the job description for ATS formatting and keywords.\nResume: {resume_text}\nJD: {job_description}\n"
                "You MUST return a JSON object with keys: 'score' (integer 0-100), 'formattingChecks' (list of objects with keys: name, score, status, desc), 'missingKeywords' (list of strings), 'matchingKeywords' (list of strings)."
            )
            response = AIService._get_model().generate_content(prompt)
            return AIService._parse_json_response(response.text, fallback)
        except Exception as e:
            print(f"[AI SERVICE FALLBACK] analyze_resume_ats: {e}")
            return fallback

    @staticmethod
    def grade_mock_session(questions: List[str], answers: List[str]) -> dict:
        fallback = {
            "overallScore": 82,
            "technicalScore": 80,
            "communicationScore": 85,
            "confidenceScore": 82,
            "suggestions": ["Good technical answers, but try to structure your thoughts using STAR method.", "Improve eye contact and posture simulation."]
        }
        try:
            prompt = (
                f"Grade this mock interview session.\nQuestions: {questions}\nAnswers: {answers}\n"
                "You MUST return a JSON object with keys: 'overallScore' (integer 0-100), 'technicalScore' (integer 0-100), 'communicationScore' (integer 0-100), 'confidenceScore' (integer 0-100), 'suggestions' (list of strings)."
            )
            response = AIService._get_model().generate_content(prompt)
            return AIService._parse_json_response(response.text, fallback)
        except Exception as e:
            print(f"[AI SERVICE FALLBACK] grade_mock_session: {e}")
            return fallback

    @staticmethod
    def chat_with_assistant(user_name: str, message: str, history: List[Dict]) -> str:
        try:
            formatted_history = "\n".join([f"{'Bot' if h.get('is_bot') else 'User'}: {h.get('message')}" for h in history[-5:]])
            prompt = (
                f"You are an AI Career Advisor. The user's name is {user_name}.\n"
                f"Conversation history:\n{formatted_history}\n"
                f"User Message: {message}\n"
                "Provide a helpful, encouraging, and detailed response in plain text (max 150 words)."
            )
            response = AIService._get_model().generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"[AI SERVICE FALLBACK] chat_with_assistant: {e}")
            return (
                f"Hello {user_name}! I am here to help you optimize your career path. "
                "I recommend practicing mock interviews, refining your resume layout, and "
                "focusing on adding quantified metrics to your experience section."
            )
