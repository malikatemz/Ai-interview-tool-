from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID
from enum import Enum


# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    RECRUITER = "recruiter"
    HIRING_MANAGER = "hiring_manager"
    CANDIDATE = "candidate"


class InterviewStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class QuestionType(str, Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SITUATIONAL = "situational"
    CASE_STUDY = "case_study"
    OPEN_ENDED = "open_ended"


class ScoreDimension(str, Enum):
    COMMUNICATION = "communication"
    TECHNICAL = "technical"
    PROBLEM_SOLVING = "problem_solving"
    CONFIDENCE = "confidence"
    LEADERSHIP = "leadership"
    DOMAIN_KNOWLEDGE = "domain_knowledge"


class RecommendationDecision(str, Enum):
    STRONG_HIRE = "strong_hire"
    HIRE = "hire"
    HOLD = "hold"
    REJECT = "reject"


# Base schemas
class TimestampMixin(BaseModel):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1)
    role: UserRole = UserRole.CANDIDATE


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(TimestampMixin):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    email: str
    full_name: str
    role: UserRole
    avatar_url: Optional[str] = None
    is_active: bool = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class OTPRequest(BaseModel):
    email: EmailStr


class OTPVerify(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


# Candidate schemas
class CandidateCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1)
    phone: Optional[str] = None
    location: Optional[str] = None
    resume_url: Optional[str] = None
    source: Optional[str] = None


class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    resume_url: Optional[str] = None
    status: Optional[str] = None


class WorkExperience(BaseModel):
    company: str
    title: str
    duration: str
    description: Optional[str] = None


class Education(BaseModel):
    institution: str
    degree: str
    year: str


class ResumeParsed(BaseModel):
    skills: List[str] = []
    experience: List[WorkExperience] = []
    education: List[Education] = []


class CandidateResponse(TimestampMixin):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    email: str
    full_name: str
    phone: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    resume_url: Optional[str] = None
    resume_parsed: Optional[Dict[str, Any]] = None
    source: Optional[str] = None
    status: str = "applied"


# Interview schemas
class InterviewConfig(BaseModel):
    question_types: List[QuestionType] = [QuestionType.TECHNICAL, QuestionType.BEHAVIORAL]
    difficulty_curve: str = "standard"
    follow_up_aggressiveness: float = 0.5
    interviewer_persona: Optional[str] = "professional"


class InterviewCreate(BaseModel):
    candidate_id: UUID
    job_description_id: Optional[UUID] = None
    scheduled_at: Optional[datetime] = None
    duration_target: int = Field(default=45, ge=15, le=120)
    config: Optional[InterviewConfig] = None


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    content: str
    type: QuestionType
    category: Optional[str] = None
    difficulty: int = 5
    sequence_order: int
    expected_duration: int = 180
    follow_up_prompts: List[str] = []


class InterviewResponse(TimestampMixin):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    candidate_id: UUID
    job_description_id: Optional[UUID] = None
    recruiter_id: UUID
    status: InterviewStatus
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_target: int
    duration_actual: Optional[int] = None
    config: Optional[Dict[str, Any]] = None
    interviewer_persona: str = "professional"


class InterviewDetailResponse(InterviewResponse):
    candidate: Optional[CandidateResponse] = None
    questions: List[QuestionResponse] = []
    overall_score: Optional[float] = None
    recommendation: Optional['RecommendationResponse'] = None


# Question schemas
class QuestionGenerateInput(BaseModel):
    job_description: str
    resume_skills: List[str] = []
    experience_years: int = 0
    seniority_level: str = "mid"
    question_types: List[QuestionType] = [QuestionType.TECHNICAL, QuestionType.BEHAVIORAL]
    count: int = Field(default=10, ge=5, le=30)


class GeneratedQuestion(BaseModel):
    question_id: str
    content: str
    type: QuestionType
    category: str
    difficulty: int
    expected_duration: int
    follow_up_prompts: List[str] = []
    evaluation_criteria: List[str] = []


# Response schemas
class ResponseCreate(BaseModel):
    question_id: UUID
    content: Optional[str] = None
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    transcript: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    duration: Optional[int] = None


class EvaluationResult(BaseModel):
    depth_score: float
    clarity_score: float
    technical_accuracy: float
    examples_quality: float
    overall_score: float
    feedback: str
    follow_up_suggested: Optional[str] = None


# Score schemas
class ScoreEvidence(BaseModel):
    transcript: str
    timestamp_start: float
    timestamp_end: float
    keywords_matched: List[str] = []
    concepts_detected: List[str] = []


class ScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    dimension: ScoreDimension
    score: float
    evidence: Optional[Dict[str, Any]] = None
    explanation: Optional[str] = None
    confidence: float = 0.9


class ScoreDimensionSummary(BaseModel):
    name: str
    score: float
    evidence: Optional[ScoreEvidence] = None
    explanation: Optional[str] = None
    confidence: float = 0.9


# Recommendation schemas
class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    decision: RecommendationDecision
    confidence: float
    reasoning: Optional[str] = None
    areas_to_investigate: List[str] = []
    risk_factors: List[str] = []


class InterviewSummary(BaseModel):
    interview_id: UUID
    overall_score: float
    decision: str
    key_strengths: List[str] = []
    areas_to_investigate: List[str] = []
    duration_actual: int
    questions_count: int


class InterviewScore(BaseModel):
    overall_score: float
    dimensions: List[ScoreDimensionSummary]
    recommendation: RecommendationResponse


# Transcript schemas
class TranscriptSegment(BaseModel):
    id: str
    speaker: str  # "ai" or "candidate"
    text: str
    start_time: float
    end_time: float


class Transcript(BaseModel):
    segments: List[TranscriptSegment]
    full_text: str


# Dashboard schemas
class PipelineStage(BaseModel):
    id: str
    name: str
    count: int
    candidates: List[CandidateResponse] = []


class DashboardStats(BaseModel):
    total_candidates: int
    active_interviews: int
    completed_today: int
    average_score: float
    pipeline_summary: Dict[str, int]


class FunnelStep(BaseModel):
    stage: str
    count: int
    percentage: float


class AnalyticsData(BaseModel):
    funnel_conversion: List[FunnelStep]
    completion_rate: float
    average_duration: float
    score_distribution: Dict[str, int]
    time_to_hire: List[int]
    interview_quality: float


# Warning schemas
class WarningCreate(BaseModel):
    warning_type: str
    message: Optional[str] = None
    timestamp: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class WarningResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    warning_type: str
    message: Optional[str] = None
    timestamp: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


# WebSocket events
class WSQuestionEvent(BaseModel):
    event: str = "question:new"
    data: GeneratedQuestion


class WSTranscriptEvent(BaseModel):
    event: str = "transcript:segment"
    data: TranscriptSegment


class WSScoreUpdate(BaseModel):
    event: str = "score:update"
    data: Dict[str, Any]


class WSTimingUpdate(BaseModel):
    event: str = "timing:update"
    data: Dict[str, Any]


# Pagination
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    limit: int
    total_pages: int


# Update forward references
InterviewDetailResponse.model_rebuild()
