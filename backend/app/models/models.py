from datetime import datetime
from enum import Enum as PyEnum
from typing import List, Optional
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, 
    ForeignKey, JSON, Enum, LargeBinary, Index
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship, declarative_base
import uuid

Base = declarative_base()


class UserRole(str, PyEnum):
    ADMIN = "admin"
    RECRUITER = "recruiter"
    HIRING_MANAGER = "hiring_manager"
    CANDIDATE = "candidate"


class InterviewStatus(str, PyEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class QuestionType(str, PyEnum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SITUATIONAL = "situational"
    CASE_STUDY = "case_study"
    OPEN_ENDED = "open_ended"


class ScoreDimension(str, PyEnum):
    COMMUNICATION = "communication"
    TECHNICAL = "technical"
    PROBLEM_SOLVING = "problem_solving"
    CONFIDENCE = "confidence"
    LEADERSHIP = "leadership"
    DOMAIN_KNOWLEDGE = "domain_knowledge"


class RecommendationDecision(str, PyEnum):
    STRONG_HIRE = "strong_hire"
    HIRE = "hire"
    HOLD = "hold"
    REJECT = "reject"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CANDIDATE)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    otp_secret = Column(String(32), nullable=True)
    otp_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", back_populates="users")
    candidates = relationship("Candidate", back_populates="created_by_user")
    interviews = relationship("Interview", back_populates="recruiter")


class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    logo_url = Column(String(500), nullable=True)
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="company")
    job_descriptions = relationship("JobDescription", back_populates="company")
    candidates = relationship("Candidate", back_populates="company")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    resume_url = Column(String(500), nullable=True)
    resume_parsed = Column(JSON, nullable=True)
    source = Column(String(100), nullable=True)
    status = Column(String(50), default="applied")
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", back_populates="candidates")
    created_by_user = relationship("User", back_populates="candidates")
    interviews = relationship("Interview", back_populates="candidate")
    applications = relationship("Application", back_populates="candidate")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    department = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    seniority = Column(String(50), nullable=True)
    skills_required = Column(ARRAY(String), default=[])
    skills_nice_to_have = Column(ARRAY(String), default=[])
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", back_populates="job_descriptions")
    applications = relationship("Application", back_populates="job_description")


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"), nullable=False)
    job_description_id = Column(UUID(as_uuid=True), ForeignKey("job_descriptions.id"), nullable=True)
    status = Column(String(50), default="applied")
    stage = Column(String(50), default="applied")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="applications")
    job_description = relationship("JobDescription", back_populates="applications")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"), nullable=False)
    job_description_id = Column(UUID(as_uuid=True), ForeignKey("job_descriptions.id"), nullable=True)
    recruiter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(Enum(InterviewStatus), default=InterviewStatus.PENDING)
    scheduled_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    duration_target = Column(Integer, default=45)
    duration_actual = Column(Integer, nullable=True)
    config = Column(JSON, default=dict)
    interviewer_persona = Column(String(50), default="professional")
    recording_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="interviews")
    recruiter = relationship("User", back_populates="interviews")
    questions = relationship("Question", back_populates="interview")
    responses = relationship("Response", back_populates="interview")
    scores = relationship("Score", back_populates="interview")
    recommendation = relationship("Recommendation", back_populates="interview", uselist=False)
    warnings = relationship("InterviewWarning", back_populates="interview")

    __table_args__ = (
        Index("idx_interview_candidate", "candidate_id"),
        Index("idx_interview_status", "status"),
    )


class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(Enum(QuestionType), nullable=False)
    category = Column(String(100), nullable=True)
    difficulty = Column(Integer, default=5)
    sequence_order = Column(Integer, nullable=False)
    expected_duration = Column(Integer, default=180)
    follow_up_prompts = Column(ARRAY(String), default=[])
    evaluation_criteria = Column(ARRAY(String), default=[])
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="questions")
    responses = relationship("Response", back_populates="question")


class Response(Base):
    __tablename__ = "responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False)
    content = Column(Text, nullable=True)
    audio_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    transcript = Column(Text, nullable=True)
    start_time = Column(Float, nullable=True)
    end_time = Column(Float, nullable=True)
    duration = Column(Integer, nullable=True)
    depth_score = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    technical_accuracy = Column(Float, nullable=True)
    examples_quality = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="responses")
    question = relationship("Question", back_populates="responses")


class Score(Base):
    __tablename__ = "scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False)
    dimension = Column(Enum(ScoreDimension), nullable=False)
    score = Column(Float, nullable=False)
    evidence = Column(JSON, nullable=True)
    explanation = Column(Text, nullable=True)
    confidence = Column(Float, default=0.9)
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="scores")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False, unique=True)
    decision = Column(Enum(RecommendationDecision), nullable=False)
    confidence = Column(Float, default=0.9)
    reasoning = Column(Text, nullable=True)
    areas_to_investigate = Column(ARRAY(String), default=[])
    risk_factors = Column(ARRAY(String), default=[])
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="recommendation")


class InterviewWarning(Base):
    __tablename__ = "interview_warnings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False)
    warning_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=True)
    timestamp = Column(Float, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="warnings")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_audit_user", "user_id"),
        Index("idx_audit_created", "created_at"),
    )


class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_type = Column(String(50), nullable=False)
    source_id = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    metadata = Column(JSON, nullable=True)
    embedding = Column(LargeBinary, nullable=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_kb_company", "company_id"),
    )


class InterviewerPersona(Base):
    __tablename__ = "interviewer_personas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    system_prompt = Column(Text, nullable=False)
    tone = Column(String(20), default="formal")
    follow_up_style = Column(String(20), default="moderate")
    voice_settings = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class InterviewMemory(Base):
    __tablename__ = "interview_memory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False, unique=True)
    context_window = Column(JSON, default=list)
    question_history = Column(JSON, default=list)
    current_topic = Column(String(255), nullable=True)
    answered_topics = Column(ARRAY(String), default=[])
    pending_questions = Column(ARRAY(String), default=[])
    session_context = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
