import os
import sys
import unittest
import uuid
import json
from datetime import datetime

# Configure env before importing app
os.environ["DATABASE_URL"] = "sqlite:///./test_temp.db"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.compiler import compiles

# Patch PostgreSQL-specific types for SQLite support in testing
import sqlalchemy.types as types

class SQLiteARRAY(types.TypeDecorator):
    impl = types.JSON
    cache_ok = True
    def __init__(self, *args, **kwargs):
        super().__init__()

class SQLiteJSONB(types.TypeDecorator):
    impl = types.JSON
    cache_ok = True
    def __init__(self, *args, **kwargs):
        super().__init__()

import sqlalchemy.dialects.postgresql as pg_dial
pg_dial.ARRAY = SQLiteARRAY
pg_dial.JSONB = SQLiteJSONB

from sqlalchemy.dialects.postgresql import UUID

@compiles(UUID, "sqlite")
def compile_uuid_sqlite(element, compiler, **kw):
    return "CHAR(36)"

# Import DB and App
from app.database import Base
from app.main import app
from app.dependencies import get_db
from app.models.models import User, Job, Application, InterviewSession, Notification, CoverLetter, LearningRoadmap, JobTrackerItem, Resume

# Setup SQLite engine for testing
DB_PATH = "./test_temp.db"
if os.path.exists(DB_PATH):
    try:
        os.remove(DB_PATH)
    except:
        pass

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Valid minimal PDF byte payload that PyMuPDF (fitz) can parse without crashing
MINIMAL_PDF_BYTES = (
    b"%PDF-1.4\n1 0 obj\n<<\/Type\/Catalog\/Pages 2 0 R>>\nendobj\n"
    b"2 0 obj\n<<\/Type\/Pages\/Kids[3 0 R]\/Count 1>>\nendobj\n"
    b"3 0 obj\n<<\/Type\/Page\/Parent 2 0 R\/Resources<<>>\/MediaBox[0 0 500 800]\/Contents 4 0 R>>\nendobj\n"
    b"4 0 obj\n<<\/Length 44>>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(Mock Resume Text with Python skills) Tj\nET\nendstream\nendobj\n"
    b"xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000213 00000 n\n"
    b"trailer\n<<\/Size 5\/Root 1 0 R>>\nstartxref\n308\n%%EOF"
)

class CareerPortalTestSuite(unittest.TestCase):
    client = TestClient(app)
    
    # Store tokens & IDs for multi-stage testing
    candidate_token = ""
    recruiter_token = ""
    manager_token = ""
    admin_token = ""
    
    candidate_id = None
    recruiter_id = None
    manager_id = None
    admin_id = None
    
    job_id = None
    application_id = None
    session_id = None
    letter_id = None
    roadmap_id = None
    tracker_id = None
    notification_id = None
    resume_id = None

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        # Mock PDF parser to return predictable text content
        from app.services.pdf_parser import PDFParserService
        PDFParserService.extract_text = staticmethod(lambda file_bytes: "Mock Resume Text with Python skills")

    @classmethod
    def tearDownClass(cls):
        engine.dispose()
        if os.path.exists(DB_PATH):
            try:
                os.remove(DB_PATH)
            except:
                pass

    # ─── SECTION 1: AUTHENTICATION & REGISTRATION (001 - 019) ───────────────
    def test_001_register_candidate_success(self):
        res = self.client.post("/api/auth/register", json={
            "name": "Candidate Alice",
            "email": "alice@careersuccess.com",
            "password": "Password123"
        })
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("id", data)
        CareerPortalTestSuite.candidate_id = data["id"]

    def test_002_register_candidate_duplicate_email(self):
        res = self.client.post("/api/auth/register", json={
            "name": "Another Alice",
            "email": "alice@careersuccess.com",
            "password": "Password123"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("already registered", res.json()["detail"].lower())

    def test_003_register_candidate_empty_name(self):
        res = self.client.post("/api/auth/register", json={
            "email": "emptyname@careersuccess.com",
            "password": "Password123"
        })
        self.assertEqual(res.status_code, 422)

    def test_004_register_candidate_invalid_email(self):
        res = self.client.post("/api/auth/register", json={
            "name": "Bad Email",
            "email": "invalid_email_format",
            "password": "Password123"
        })
        self.assertEqual(res.status_code, 422)

    def test_005_register_candidate_empty_password(self):
        res = self.client.post("/api/auth/register", json={
            "name": "Empty Pwd",
            "email": "emptypwd@careersuccess.com"
        })
        self.assertEqual(res.status_code, 422)

    def test_006_register_recruiter_success(self):
        res = self.client.post("/api/auth/register", json={
            "name": "Recruiter Bob",
            "email": "bob@careersuccess.com",
            "password": "Password123",
            "preferred_roles": "recruiter"
        })
        self.assertEqual(res.status_code, 201)
        CareerPortalTestSuite.recruiter_id = res.json()["id"]

    def test_007_register_manager_success(self):
        res = self.client.post("/api/auth/register", json={
            "name": "Manager Charlie",
            "email": "charlie@careersuccess.com",
            "password": "Password123",
            "preferred_roles": "hiring_manager"
        })
        self.assertEqual(res.status_code, 201)
        CareerPortalTestSuite.manager_id = res.json()["id"]

    def test_008_register_admin_success(self):
        res = self.client.post("/api/auth/register", json={
            "name": "Admin Chief",
            "email": "admin@careersuccess.com",
            "password": "Password123",
            "preferred_roles": "admin"
        })
        self.assertEqual(res.status_code, 201)
        CareerPortalTestSuite.admin_id = res.json()["id"]

    def test_009_login_candidate_success(self):
        res = self.client.post("/api/auth/login", data={
            "username": "alice@careersuccess.com",
            "password": "Password123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        CareerPortalTestSuite.candidate_token = data["access_token"]

    def test_010_login_candidate_wrong_password(self):
        res = self.client.post("/api/auth/login", data={
            "username": "alice@careersuccess.com",
            "password": "WrongPassword"
        })
        self.assertEqual(res.status_code, 401)

    def test_011_login_candidate_non_existent(self):
        res = self.client.post("/api/auth/login", data={
            "username": "not_exists@careersuccess.com",
            "password": "Password123"
        })
        self.assertEqual(res.status_code, 401)

    def test_012_login_recruiter_success(self):
        res = self.client.post("/api/auth/login", data={
            "username": "bob@careersuccess.com",
            "password": "Password123"
        })
        self.assertEqual(res.status_code, 200)
        CareerPortalTestSuite.recruiter_token = res.json()["access_token"]

    def test_013_login_manager_success(self):
        res = self.client.post("/api/auth/login", data={
            "username": "charlie@careersuccess.com",
            "password": "Password123"
        })
        self.assertEqual(res.status_code, 200)
        CareerPortalTestSuite.manager_token = res.json()["access_token"]

    def test_014_login_admin_success(self):
        res = self.client.post("/api/auth/login", data={
            "username": "admin@careersuccess.com",
            "password": "Password123"
        })
        self.assertEqual(res.status_code, 200)
        CareerPortalTestSuite.admin_token = res.json()["access_token"]

    def test_015_get_me_unauthorized(self):
        res = self.client.get("/api/users/me")
        self.assertEqual(res.status_code, 401)

    def test_016_get_me_authorized(self):
        res = self.client.get("/api/users/me", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["email"], "alice@careersuccess.com")

    def test_017_update_me_profile_skills(self):
        res = self.client.put("/api/users/me", json={
            "name": "Candidate Alice",
            "email": "alice@careersuccess.com",
            "skills": "Python, FastApi, React"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["skills"], "Python, FastApi, React")

    def test_018_update_me_profile_experience(self):
        res = self.client.put("/api/users/me", json={
            "name": "Candidate Alice",
            "email": "alice@careersuccess.com",
            "experience": "2 years software engineer"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["experience"], "2 years software engineer")

    def test_019_update_me_profile_locations(self):
        res = self.client.put("/api/users/me", json={
            "name": "Candidate Alice",
            "email": "alice@careersuccess.com",
            "preferred_locations": "Remote, New York"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["preferred_locations"], "Remote, New York")

    # ─── SECTION 2: JOBS & APPLICATIONS (020 - 048) ─────────────────────────
    def test_020_post_job_unauthorized(self):
        res = self.client.post("/api/jobs", json={
            "title": "Software Engineer",
            "description": "Develop cool features",
            "status": "open"
        })
        self.assertEqual(res.status_code, 401)

    def test_021_post_job_recruiter_success(self):
        res = self.client.post("/api/jobs", json={
            "title": "Full Stack Dev",
            "company": "Careersuccess Corp",
            "department": "Engineering",
            "location": "Remote",
            "description": "Develop full stack products",
            "requirements": "React, Python",
            "skills": ["React", "Python"],
            "status": "open"
        }, headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("id", data)
        CareerPortalTestSuite.job_id = data["id"]

    def test_022_post_job_empty_title(self):
        # Omit title to trigger 422
        res = self.client.post("/api/jobs", json={
            "description": "Valid Description",
            "status": "open"
        }, headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res.status_code, 422)

    def test_023_post_job_draft_status(self):
        res = self.client.post("/api/jobs", json={
            "title": "Data Scientist Draft",
            "description": "Valid Description",
            "status": "draft"
        }, headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "draft")

    def test_024_list_jobs_anonymous(self):
        res = self.client.get("/api/jobs")
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()), 0)

    def test_025_list_jobs_filtered_location(self):
        res = self.client.get("/api/jobs?location=Remote")
        self.assertEqual(res.status_code, 200)

    def test_026_list_jobs_filtered_department(self):
        res = self.client.get("/api/jobs?department=Engineering")
        self.assertEqual(res.status_code, 200)

    def test_027_list_jobs_filtered_status_open(self):
        res = self.client.get("/api/jobs?status=open")
        self.assertEqual(res.status_code, 200)

    def test_028_get_job_by_id_exists(self):
        res = self.client.get(f"/api/jobs/{self.job_id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["title"], "Full Stack Dev")

    def test_029_get_job_by_id_missing(self):
        fake_uuid = str(uuid.uuid4())
        res = self.client.get(f"/api/jobs/{fake_uuid}")
        self.assertEqual(res.status_code, 404)

    def test_030_edit_job_success(self):
        res = self.client.put(f"/api/jobs/{self.job_id}", json={
            "title": "Lead Full Stack Dev",
            "description": "Develop full stack products",
            "location": "Boston",
            "status": "open"
        }, headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["title"], "Lead Full Stack Dev")
        self.assertEqual(res.json()["location"], "Boston")

    def test_031_edit_job_not_found(self):
        fake_uuid = str(uuid.uuid4())
        res = self.client.put(f"/api/jobs/{fake_uuid}", json={
            "title": "Lead Full Stack Dev",
            "description": "valid description",
            "status": "open"
        }, headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res.status_code, 404)

    def test_032_edit_job_unauthorized(self):
        res = self.client.put(f"/api/jobs/{self.job_id}", json={
            "title": "Lead Full Stack Dev",
            "description": "valid description",
            "status": "open"
        })
        self.assertEqual(res.status_code, 401)

    def test_033_submit_application_success(self):
        res = self.client.post(f"/api/jobs/{self.job_id}/apply", json={
            "fullName": "Alice Candidate",
            "email": "alice@careersuccess.com",
            "phone": "1234567890",
            "education": "BS in CS",
            "skills": "Python, FastAPI",
            "experience": "2 years software developer",
            "coverNote": "I love FastApi!",
            "resumeText": "Mock resume content describing Python skills"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        data_res = res.json()
        self.assertIn("application_id", data_res)
        CareerPortalTestSuite.application_id = data_res["application_id"]

    def test_034_submit_application_missing_fields(self):
        res = self.client.post(f"/api/jobs/{self.job_id}/apply", json={
            "fullName": ""
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 422)

    def test_035_submit_application_invalid_job_id(self):
        res = self.client.post(f"/api/jobs/{str(uuid.uuid4())}/apply", json={
            "fullName": "Test Candidate",
            "email": "test@careersuccess.com",
            "phone": "123",
            "education": "None",
            "skills": "None",
            "experience": "None"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 404)

    def test_036_list_applications_me(self):
        res = self.client.get("/api/jobs/applications/me", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()), 0)

    def test_037_list_applications_recruiter(self):
        res = self.client.get("/api/jobs/applications/all", headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()), 0)

    def test_038_list_applications_unauthorized(self):
        res = self.client.get("/api/jobs/applications/all")
        self.assertEqual(res.status_code, 401)

    def test_039_get_application_detail_exists(self):
        res = self.client.get(f"/api/jobs/applications/{self.application_id}", headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["email"], "alice@careersuccess.com")

    def test_040_get_application_detail_missing(self):
        res = self.client.get(f"/api/jobs/applications/{str(uuid.uuid4())}", headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res.status_code, 404)

    def test_041_update_application_status_screening(self):
        res = self.client.patch(f"/api/jobs/applications/{self.application_id}/status?status=screening", headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "success")

    def test_042_update_application_status_shortlisted(self):
        res = self.client.patch(f"/api/jobs/applications/{self.application_id}/status?status=shortlisted", headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res.status_code, 200)

    def test_043_update_application_status_interview_scheduled(self):
        res = self.client.patch(f"/api/jobs/applications/{self.application_id}/status?status=interview_scheduled", headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res.status_code, 200)

    def test_044_update_application_status_rejected(self):
        res = self.client.patch(f"/api/jobs/applications/{self.application_id}/status?status=rejected", headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res.status_code, 200)

    def test_045_update_application_status_approved(self):
        res = self.client.patch(f"/api/jobs/applications/{self.application_id}/status?status=approved", headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res.status_code, 200)

    def test_046_update_application_status_unauthorized(self):
        res = self.client.patch(f"/api/jobs/applications/{self.application_id}/status?status=approved")
        self.assertEqual(res.status_code, 401)

    def test_047_update_application_decision_approve(self):
        res = self.client.patch(f"/api/jobs/applications/{self.application_id}/decision", json={
            "decision": "approve",
            "notes": "Looks solid"
        }, headers={"Authorization": f"Bearer {self.manager_token}"})
        self.assertEqual(res.status_code, 200)

    def test_048_delete_job_success(self):
        res_post = self.client.post("/api/jobs", json={
            "title": "Temp Job To Delete",
            "description": "temp job",
            "status": "open"
        }, headers={"Authorization": f"Bearer {self.recruiter_token}"})
        temp_job_id = res_post.json()["id"]
        
        res_del = self.client.delete(f"/api/jobs/{temp_job_id}", headers={"Authorization": f"Bearer {self.recruiter_token}"})
        self.assertEqual(res_del.status_code, 200)

    # ─── SECTION 3: AI MOCK INTERVIEWS (049 - 058) ──────────────────────────
    def test_049_create_interview_session_success(self):
        res = self.client.post("/api/interviews/sessions", json={
            "job_role": "Backend Engineer",
            "difficulty": "Intermediate"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("id", data)
        self.assertEqual(data["job_role"], "Backend Engineer")
        CareerPortalTestSuite.session_id = data["id"]

    def test_050_create_interview_session_unauthorized(self):
        res = self.client.post("/api/interviews/sessions", json={
            "job_role": "Backend Engineer",
            "difficulty": "Intermediate"
        })
        self.assertEqual(res.status_code, 401)

    def test_051_create_interview_session_missing_fields(self):
        res = self.client.post("/api/interviews/sessions", json={
            "job_role": ""
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 422)

    def test_052_get_interview_sessions_list(self):
        res = self.client.get("/api/interviews/sessions", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()), 0)

    def test_053_get_interview_session_by_id(self):
        res = self.client.get(f"/api/interviews/sessions/{self.session_id}", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["id"], self.session_id)

    def test_054_submit_interview_answers_success(self):
        res = self.client.post("/api/interviews/answers/evaluate", json={
            "session_id": self.session_id,
            "question": "What is dependency injection?",
            "answer": "Passing dependencies to constructors."
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("score", res.json())

    def test_055_submit_interview_answers_missing_session(self):
        res = self.client.post("/api/interviews/answers/evaluate", json={
            "session_id": 99999,
            "question": "What is dependency injection?",
            "answer": "constructors"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 404)

    def test_056_submit_interview_answers_unauthorized(self):
        res = self.client.post("/api/interviews/answers/evaluate", json={
            "session_id": self.session_id,
            "question": "What is DI?",
            "answer": "DI"
        })
        self.assertEqual(res.status_code, 401)

    def test_057_get_interview_feedback_details(self):
        res = self.client.get(f"/api/interviews/sessions/{self.session_id}/feedback", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("answers", res.json())

    def test_058_get_interview_feedback_unauthorized(self):
        res = self.client.get(f"/api/interviews/sessions/{self.session_id}/feedback")
        self.assertEqual(res.status_code, 401)

    # ─── SECTION 4: CAREER CHATBOT (059 - 065) ──────────────────────────────
    def test_059_chatbot_list_history_empty(self):
        res = self.client.get("/api/chatbot/history", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 0)

    def test_060_chatbot_send_message_user(self):
        res = self.client.post("/api/chatbot/chat", json={
            "message": "Hello career assistant!"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("reply", res.json())

    def test_061_chatbot_list_history_not_empty(self):
        res = self.client.get("/api/chatbot/history", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()), 0)

    def test_062_chatbot_send_message_unauthorized(self):
        res = self.client.post("/api/chatbot/chat", json={
            "message": "Hello!"
        })
        self.assertEqual(res.status_code, 401)

    def test_063_chatbot_clear_history_success(self):
        res = self.client.delete("/api/chatbot/history", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["message"], "Chat history cleared successfully")

    def test_064_chatbot_clear_history_unauthorized(self):
        res = self.client.delete("/api/chatbot/history")
        self.assertEqual(res.status_code, 401)

    def test_065_chatbot_history_empty_again(self):
        res = self.client.get("/api/chatbot/history", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 0)

    # ─── SECTION 5: ATS ANALYSIS & RESUME PARSING (066 - 071) ───────────────
    def test_066_upload_resume_invalid_file_type(self):
        files = {"file": ("test.png", b"Fake PNG file bytes", "image/png")}
        res = self.client.post("/api/resumes/upload", files=files, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 400)

    def test_067_upload_resume_pdf_success(self):
        files = {"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")}
        res = self.client.post("/api/resumes/upload", files=files, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("id", data)
        CareerPortalTestSuite.resume_id = data["id"]

    def test_068_ats_analyze_success(self):
        res = self.client.post("/api/ai/analyze-ats", json={
            "resumeText": "Experienced Python and FastAPI backend software developer",
            "jobDescription": "We are seeking a Python backend engineer with FastAPI skills"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("score", data)

    def test_069_ats_analyze_unauthorized(self):
        res = self.client.post("/api/ai/analyze-ats", json={
            "resumeText": "Experienced software developer",
            "jobDescription": "We are seeking a developer"
        })
        self.assertEqual(res.status_code, 401)

    def test_070_ats_match_resume_jd_success(self):
        res = self.client.post("/api/ai/match-resume-jd", json={
            "resumeText": "React developer skills",
            "jobDescription": "React frontend position"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)

    def test_071_ats_endpoint_db_score_calculation(self):
        # POST /ats/{resume_id}/analyze in ats.py
        res = self.client.post(f"/api/ats/{self.resume_id}/analyze", json={
            "job_description": "seeking python developer"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("score", res.json())

    # ─── SECTION 6: COVER LETTERS & LEARNING ROADMAPS (072 - 078) ────────────
    def test_072_generate_cover_letter_success(self):
        res = self.client.post("/api/cover-letter/generate", json={
            "resume_id": self.resume_id,
            "company_name": "Google",
            "job_title": "Software Engineer"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("id", data)
        CareerPortalTestSuite.letter_id = data["id"]

    def test_073_generate_cover_letter_unauthorized(self):
        res = self.client.post("/api/cover-letter/generate", json={
            "resume_id": self.resume_id,
            "company_name": "Google",
            "job_title": "Software Engineer"
        })
        self.assertEqual(res.status_code, 401)

    def test_074_list_cover_letters_me(self):
        res = self.client.get("/api/cover-letter/", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()), 0)

    def test_075_list_cover_letters_unauthorized(self):
        res = self.client.get("/api/cover-letter/")
        self.assertEqual(res.status_code, 401)

    def test_076_generate_roadmap_success(self):
        res = self.client.post("/api/roadmap/generate", json={
            "target_role": "Data Scientist",
            "current_skills": "Python, SQL"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("id", data)
        CareerPortalTestSuite.roadmap_id = data["id"]

    def test_077_generate_roadmap_unauthorized(self):
        res = self.client.post("/api/roadmap/generate", json={
            "target_role": "Data Scientist",
            "current_skills": "Python"
        })
        self.assertEqual(res.status_code, 401)

    def test_078_list_roadmaps_me(self):
        res = self.client.get("/api/roadmap/", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()), 0)

    # ─── SECTION 7: NOTIFICATION CENTER (079 - 087) ──────────────────────────
    def test_079_notification_list_initially_has_elements(self):
        # Triggers in application status change or evaluations create notifications
        res = self.client.get("/api/notifications/", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        notifications = res.json()
        self.assertGreater(len(notifications), 0)
        CareerPortalTestSuite.notification_id = notifications[0]["id"]

    def test_080_notification_list_unauthorized(self):
        res = self.client.get("/api/notifications/")
        self.assertEqual(res.status_code, 401)

    def test_081_notification_mark_single_read(self):
        res = self.client.patch(f"/api/notifications/{self.notification_id}/read", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["is_read"], True)

    def test_082_notification_mark_single_not_found(self):
        res = self.client.patch("/api/notifications/99999/read", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 404)

    def test_083_notification_mark_single_unauthorized(self):
        res = self.client.patch(f"/api/notifications/{self.notification_id}/read")
        self.assertEqual(res.status_code, 401)

    def test_084_notification_mark_all_read(self):
        res = self.client.post("/api/notifications/read-all", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["message"], "All notifications marked as read")

    def test_085_notification_mark_all_read_unauthorized(self):
        res = self.client.post("/api/notifications/read-all")
        self.assertEqual(res.status_code, 401)

    def test_086_notification_bell_unread_count_is_zero(self):
        res = self.client.get("/api/notifications/", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        unread = [n for n in res.json() if not n["is_read"]]
        self.assertEqual(len(unread), 0)

    def test_087_create_manual_notification_on_interview_grading(self):
        # evaluate answer triggers a notification
        self.client.post("/api/interviews/answers/evaluate", json={
            "session_id": self.session_id,
            "question": "What is Python?",
            "answer": "A programming language."
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        
        # Confirm notification exists
        res_notif = self.client.get("/api/notifications/", headers={"Authorization": f"Bearer {self.candidate_token}"})
        unread = [n for n in res_notif.json() if not n["is_read"]]
        self.assertGreater(len(unread), 0)

    # ─── SECTION 8: JOB TRACKER KANBAN (088 - 094) ──────────────────────────
    def test_088_tracker_list_initially_empty(self):
        # Since we deleted previous tracker, let's list to verify
        res = self.client.get("/api/tracker/items", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 0)

    def test_089_tracker_create_item_interested(self):
        res = self.client.post("/api/tracker/items", json={
            "company": "Microsoft",
            "position": "Security Specialist",
            "status": "Interested",
            "date": "2026-07-13",
            "notes": "Salary: 120k"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("id", data)
        self.assertEqual(data["status"], "Interested")
        CareerPortalTestSuite.tracker_id = data["id"]

    def test_090_tracker_create_item_applied(self):
        res = self.client.post("/api/tracker/items", json={
            "company": "Apple",
            "position": "iOS Engineer",
            "status": "Applied",
            "date": "2026-07-13"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "Applied")

    def test_091_tracker_update_stage_success(self):
        res = self.client.put(f"/api/tracker/items/{self.tracker_id}", json={
            "company": "Microsoft",
            "position": "Security Specialist",
            "status": "Interview",
            "date": "2026-07-13",
            "notes": "Interviewing soon"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "Interview")

    def test_092_tracker_update_stage_invalid_not_found(self):
        res = self.client.put("/api/tracker/items/99999", json={
            "company": "Microsoft",
            "position": "Security Specialist",
            "status": "Interview",
            "date": "2026-07-13"
        }, headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 404)

    def test_093_tracker_delete_item(self):
        res = self.client.delete(f"/api/tracker/items/{self.tracker_id}", headers={"Authorization": f"Bearer {self.candidate_token}"})
        self.assertEqual(res.status_code, 200)

    def test_094_tracker_list_unauthorized(self):
        res = self.client.get("/api/tracker/items")
        self.assertEqual(res.status_code, 401)

    # ─── SECTION 9: ADMIN STATS & AUDITS (095 - 100) ─────────────────────────
    def test_095_admin_stats_unauthorized(self):
        res = self.client.get("/api/admin/stats")
        self.assertEqual(res.status_code, 401)

    def test_096_admin_stats_authorized(self):
        res = self.client.get("/api/admin/stats", headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total_users", data)

    def test_097_admin_users_list_authorized(self):
        res = self.client.get("/api/admin/users", headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()), 0)

    def test_098_admin_update_user_role(self):
        res = self.client.put(f"/api/admin/users/{self.recruiter_id}/role", json={
            "preferred_roles": "admin"
        }, headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["preferred_roles"], "admin")

    def test_099_admin_delete_user_self_fail(self):
        res = self.client.delete(f"/api/admin/users/{self.admin_id}", headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("own active admin profile", res.json()["detail"].lower())

    def test_100_admin_audit_logs(self):
        res = self.client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()), 0)

if __name__ == "__main__":
    unittest.main()
