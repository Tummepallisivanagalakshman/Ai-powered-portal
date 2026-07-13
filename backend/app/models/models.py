from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
import uuid
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    skills = Column(Text, nullable=True)
    experience = Column(Text, nullable=True)
    preferred_roles = Column(String, nullable=True)
    preferred_locations = Column(String, nullable=True)
    profile_photo_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ORM relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    job_matches = relationship("JobMatch", back_populates="user", cascade="all, delete-orphan")
    cover_letters = relationship("CoverLetter", back_populates="user", cascade="all, delete-orphan")
    chatbot_history = relationship("ChatbotHistory", back_populates="user", cascade="all, delete-orphan")
    learning_roadmaps = relationship("LearningRoadmap", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    tracker_items = relationship("JobTrackerItem", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    calendar_events = relationship("CalendarEvent", back_populates="user", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("AIFeedback", back_populates="user", cascade="all, delete-orphan")
    files = relationship("FileRecord", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    file_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="resumes")
    ats_scores = relationship("ATSScore", back_populates="resume", cascade="all, delete-orphan")
    analyses = relationship("ResumeAnalysis", back_populates="resume", cascade="all, delete-orphan")


class ResumeAnalysis(Base):
    __tablename__ = "resume_analysis"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"))
    skills = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    experience = Column(Text, nullable=True)
    certifications = Column(Text, nullable=True)
    projects = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resume = relationship("Resume", back_populates="analyses")


class ATSScore(Base):
    __tablename__ = "ats_scores"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"))
    score = Column(Float, nullable=False)
    missing_keywords = Column(Text, nullable=True)
    formatting_issues = Column(Text, nullable=True)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resume = relationship("Resume", back_populates="ats_scores")


class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"))
    job_description = Column(Text, nullable=False)
    match_percentage = Column(Float, nullable=False)
    matching_skills = Column(Text, nullable=True)
    missing_skills = Column(Text, nullable=True)
    hiring_probability = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="job_matches")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    job_role = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    total_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="interview_sessions")
    answers = relationship("InterviewAnswer", back_populates="session", cascade="all, delete-orphan")


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"))
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    score = Column(Float, nullable=False)
    feedback = Column(Text, nullable=True)
    better_answer = Column(Text, nullable=True)

    session = relationship("InterviewSession", back_populates="answers")


class LearningRoadmap(Base):
    __tablename__ = "learning_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    target_role = Column(String, nullable=False)
    current_skills = Column(Text, nullable=True)
    plan_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="learning_roadmaps")


class CoverLetter(Base):
    __tablename__ = "cover_letters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    company_name = Column(String, nullable=False)
    job_title = Column(String, nullable=False)
    tone = Column(String, nullable=True, default="Professional")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="cover_letters")


class ChatbotHistory(Base):
    __tablename__ = "chatbot_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    message = Column(Text, nullable=False)
    is_bot = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chatbot_history")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    report_type = Column(String, nullable=False)
    report_url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reports")


class JobTrackerItem(Base):
    """Kanban board job application tracker."""
    __tablename__ = "job_tracker_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company = Column(String, nullable=False)
    position = Column(String, nullable=False)
    date = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Interested")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="tracker_items")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    department = Column(Text, nullable=True)
    location = Column(Text, nullable=True)
    employment_type = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    status = Column(String(6), default="open")  # open, closed, draft
    created_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    company = Column(Text, nullable=True)
    skills = Column(ARRAY(Text), nullable=True)
    experience_required = Column(Text, nullable=True)

    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(UUID(as_uuid=True), nullable=True)
    resume_path = Column(Text, nullable=True)
    resume_text = Column(Text, nullable=True)
    cover_note = Column(Text, nullable=True)
    status = Column(String(19), default="applied")  # applied, screening, shortlisted, rejected, approved
    ai_score = Column(Integer, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_strengths = Column(Text, nullable=True)
    ai_concerns = Column(Text, nullable=True)
    ai_recommendation = Column(Text, nullable=True)
    manager_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    full_name = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)
    experience = Column(Text, nullable=True)
    ai_experience = Column(Text, nullable=True)
    match_score = Column(Integer, nullable=True)
    matching_skills = Column(Text, nullable=True)
    missing_skills = Column(Text, nullable=True)
    match_recommendation = Column(Text, nullable=True)

    job = relationship("Job", back_populates="applications")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    questions = Column(JSONB, nullable=False)
    created_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # 'application', 'interview', 'report', 'system'
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    type = Column(String, default="reminder")  # 'interview', 'learning', 'deadline', 'reminder'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="calendar_events")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    overview = Column(Text, nullable=True)
    industry = Column(String, nullable=True)
    required_skills = Column(Text, nullable=True)
    hiring_trends = Column(Text, nullable=True)
    salary_range = Column(String, nullable=True)
    interview_process = Column(Text, nullable=True)
    interview_questions = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_type = Column(String, nullable=False)  # 'job', 'company', 'report', 'question', 'roadmap'
    item_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="bookmarks")


class AIFeedback(Base):
    __tablename__ = "ai_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_type = Column(String, nullable=False)  # 'cover_letter', 'roadmap', 'ats', 'interview', 'chatbot'
    target_id = Column(String, nullable=True)
    helpful = Column(Boolean, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="feedback")


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    path = Column(String, nullable=False)
    method = Column(String, nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time = Column(Float, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FileRecord(Base):
    __tablename__ = "file_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String, nullable=False)
    category = Column(String, nullable=False)     # 'resume', 'cover_letter', 'certificate', 'report', 'export'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="files")



