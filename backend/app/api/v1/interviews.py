from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import uuid

from app.schemas.schemas import (
    InterviewCreate, InterviewResponse, InterviewDetailResponse,
    InterviewConfig, QuestionResponse, QuestionGenerateInput, GeneratedQuestion,
    InterviewSummary, ScoreResponse, RecommendationResponse
)

router = APIRouter()

# In-memory storage for demo
DEMO_INTERVIEWS = {}


@router.get("/", response_model=List[InterviewResponse])
async def list_interviews(
    status: Optional[str] = None,
    candidate_id: Optional[UUID] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """List all interviews"""
    
    interviews = list(DEMO_INTERVIEWS.values())
    
    if status:
        interviews = [i for i in interviews if i.get("status") == status]
    
    if candidate_id:
        interviews = [i for i in interviews if i.get("candidate_id") == str(candidate_id)]
    
    start = (page - 1) * limit
    end = start + limit
    
    return [
        InterviewResponse(
            id=i["id"],
            candidate_id=i["candidate_id"],
            recruiter_id=i["recruiter_id"],
            status=i["status"],
            scheduled_at=i.get("scheduled_at"),
            started_at=i.get("started_at"),
            ended_at=i.get("ended_at"),
            duration_target=i["duration_target"],
            duration_actual=i.get("duration_actual"),
            config=i.get("config"),
            interviewer_persona=i.get("interviewer_persona", "professional"),
            created_at=i.get("created_at")
        )
        for i in interviews[start:end]
    ]


@router.post("/", response_model=InterviewResponse)
async def create_interview(interview_data: InterviewCreate):
    """Create a new interview"""
    
    interview_id = str(uuid.uuid4())
    
    config = interview_data.config.dict() if interview_data.config else {}
    
    interview = {
        "id": interview_id,
        "candidate_id": str(interview_data.candidate_id),
        "job_description_id": str(interview_data.job_description_id) if interview_data.job_description_id else None,
        "recruiter_id": "demo-recruiter",  # Would come from auth
        "status": "pending",
        "scheduled_at": interview_data.scheduled_at,
        "duration_target": interview_data.duration_target,
        "config": config,
        "interviewer_persona": config.get("interviewer_persona", "professional"),
        "created_at": datetime.utcnow()
    }
    
    DEMO_INTERVIEWS[interview_id] = interview
    
    return InterviewResponse(
        id=interview_id,
        candidate_id=interview["candidate_id"],
        recruiter_id=interview["recruiter_id"],
        status=interview["status"],
        scheduled_at=interview.get("scheduled_at"),
        duration_target=interview["duration_target"],
        config=config,
        interviewer_persona=interview["interviewer_persona"],
        created_at=interview["created_at"]
    )


@router.get("/{interview_id}", response_model=InterviewDetailResponse)
async def get_interview(interview_id: UUID):
    """Get interview details"""
    
    interview = DEMO_INTERVIEWS.get(str(interview_id))
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    # Sample questions
    questions = [
        QuestionResponse(
            id=str(uuid.uuid4()),
            content="Tell me about your experience with distributed systems.",
            type="technical",
            category="system_design",
            difficulty=7,
            sequence_order=1,
            expected_duration=180,
            follow_up_prompts=["What challenges did you face?", "How did you handle failures?"]
        ),
        QuestionResponse(
            id=str(uuid.uuid4()),
            content="Describe a time when you had to lead a team through a difficult project.",
            type="behavioral",
            category="leadership",
            difficulty=5,
            sequence_order=2,
            expected_duration=120
        )
    ]
    
    return InterviewDetailResponse(
        id=interview["id"],
        candidate_id=interview["candidate_id"],
        recruiter_id=interview["recruiter_id"],
        status=interview["status"],
        scheduled_at=interview.get("scheduled_at"),
        started_at=interview.get("started_at"),
        ended_at=interview.get("ended_at"),
        duration_target=interview["duration_target"],
        duration_actual=interview.get("duration_actual"),
        config=interview.get("config"),
        interviewer_persona=interview.get("interviewer_persona"),
        questions=questions,
        overall_score=7.8,
        recommendation=RecommendationResponse(
            id=str(uuid.uuid4()),
            decision="hire",
            confidence=0.85,
            reasoning="Strong technical skills",
            areas_to_investigate=["Leadership"],
            risk_factors=[]
        ),
        created_at=interview.get("created_at")
    )


@router.post("/{interview_id}/start", response_model=InterviewResponse)
async def start_interview(interview_id: UUID):
    """Start an interview"""
    
    interview = DEMO_INTERVIEWS.get(str(interview_id))
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    interview["status"] = "in_progress"
    interview["started_at"] = datetime.utcnow()
    
    return InterviewResponse(
        id=interview["id"],
        candidate_id=interview["candidate_id"],
        recruiter_id=interview["recruiter_id"],
        status=interview["status"],
        started_at=interview["started_at"],
        duration_target=interview["duration_target"],
        created_at=interview.get("created_at")
    )


@router.post("/{interview_id}/pause", response_model=InterviewResponse)
async def pause_interview(interview_id: UUID):
    """Pause an interview"""
    
    interview = DEMO_INTERVIEWS.get(str(interview_id))
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    interview["status"] = "paused"
    
    return InterviewResponse(
        id=interview["id"],
        candidate_id=interview["candidate_id"],
        recruiter_id=interview["recruiter_id"],
        status=interview["status"],
        started_at=interview.get("started_at"),
        duration_target=interview["duration_target"],
        created_at=interview.get("created_at")
    )


@router.post("/{interview_id}/resume", response_model=InterviewResponse)
async def resume_interview(interview_id: UUID):
    """Resume a paused interview"""
    
    interview = DEMO_INTERVIEWS.get(str(interview_id))
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    interview["status"] = "in_progress"
    
    return InterviewResponse(
        id=interview["id"],
        candidate_id=interview["candidate_id"],
        recruiter_id=interview["recruiter_id"],
        status=interview["status"],
        started_at=interview.get("started_at"),
        duration_target=interview["duration_target"],
        created_at=interview.get("created_at")
    )


@router.post("/{interview_id}/end", response_model=InterviewResponse)
async def end_interview(interview_id: UUID):
    """End an interview"""
    
    interview = DEMO_INTERVIEWS.get(str(interview_id))
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    interview["status"] = "completed"
    interview["ended_at"] = datetime.utcnow()
    
    if interview.get("started_at"):
        duration = (interview["ended_at"] - interview["started_at"]).seconds
        interview["duration_actual"] = duration
    
    return InterviewResponse(
        id=interview["id"],
        candidate_id=interview["candidate_id"],
        recruiter_id=interview["recruiter_id"],
        status=interview["status"],
        started_at=interview.get("started_at"),
        ended_at=interview["ended_at"],
        duration_target=interview["duration_target"],
        duration_actual=interview.get("duration_actual"),
        created_at=interview.get("created_at")
    )


@router.get("/{interview_id}/summary", response_model=InterviewSummary)
async def get_interview_summary(interview_id: UUID):
    """Get interview summary"""
    
    return InterviewSummary(
        interview_id=str(interview_id),
        overall_score=7.8,
        decision="HIRE",
        key_strengths=[
            "Strong system design skills",
            "Clear communication",
            "Real-world experience"
        ],
        areas_to_investigate=[
            "Leadership at scale",
            "ML integration experience"
        ],
        duration_actual=2700,
        questions_count=10
    )
