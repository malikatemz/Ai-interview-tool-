from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import uuid

from app.schemas.schemas import (
    CandidateCreate, CandidateUpdate, CandidateResponse,
    InterviewScore, Transcript, TranscriptSegment
)

router = APIRouter()

# In-memory storage for demo
DEMO_CANDIDATES = {}


@router.get("/", response_model=List[CandidateResponse])
async def list_candidates(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """List all candidates with optional filters"""
    
    candidates = list(DEMO_CANDIDATES.values())
    
    # Apply filters
    if status:
        candidates = [c for c in candidates if c.get("status") == status]
    
    if search:
        search_lower = search.lower()
        candidates = [
            c for c in candidates 
            if search_lower in c.get("full_name", "").lower() 
            or search_lower in c.get("email", "").lower()
        ]
    
    # Paginate
    start = (page - 1) * limit
    end = start + limit
    paginated = candidates[start:end]
    
    return [
        CandidateResponse(
            id=c["id"],
            email=c["email"],
            full_name=c["full_name"],
            phone=c.get("phone"),
            location=c.get("location"),
            avatar_url=c.get("avatar_url"),
            resume_url=c.get("resume_url"),
            resume_parsed=c.get("resume_parsed"),
            source=c.get("source"),
            status=c.get("status", "applied"),
            created_at=c.get("created_at")
        )
        for c in paginated
    ]


@router.post("/", response_model=CandidateResponse)
async def create_candidate(candidate_data: CandidateCreate):
    """Create a new candidate"""
    
    candidate_id = str(uuid.uuid4())
    
    candidate = {
        "id": candidate_id,
        "email": candidate_data.email,
        "full_name": candidate_data.full_name,
        "phone": candidate_data.phone,
        "location": candidate_data.location,
        "resume_url": candidate_data.resume_url,
        "source": candidate_data.source,
        "status": "applied",
        "created_at": datetime.utcnow()
    }
    
    DEMO_CANDIDATES[candidate_id] = candidate
    
    return CandidateResponse(
        id=candidate_id,
        email=candidate_data.email,
        full_name=candidate_data.full_name,
        phone=candidate_data.phone,
        resume_url=candidate_data.resume_url,
        source=candidate_data.source,
        created_at=candidate["created_at"]
    )


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: UUID):
    """Get a specific candidate"""
    
    candidate = DEMO_CANDIDATES.get(str(candidate_id))
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    return CandidateResponse(
        id=candidate["id"],
        email=candidate["email"],
        full_name=candidate["full_name"],
        phone=candidate.get("phone"),
        location=candidate.get("location"),
        avatar_url=candidate.get("avatar_url"),
        resume_url=candidate.get("resume_url"),
        resume_parsed=candidate.get("resume_parsed"),
        source=candidate.get("source"),
        status=candidate.get("status", "applied"),
        created_at=candidate.get("created_at")
    )


@router.put("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(candidate_id: UUID, update_data: CandidateUpdate):
    """Update a candidate"""
    
    candidate = DEMO_CANDIDATES.get(str(candidate_id))
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Update fields
    if update_data.full_name is not None:
        candidate["full_name"] = update_data.full_name
    if update_data.phone is not None:
        candidate["phone"] = update_data.phone
    if update_data.location is not None:
        candidate["location"] = update_data.location
    if update_data.resume_url is not None:
        candidate["resume_url"] = update_data.resume_url
    if update_data.status is not None:
        candidate["status"] = update_data.status
    
    return CandidateResponse(
        id=candidate["id"],
        email=candidate["email"],
        full_name=candidate["full_name"],
        phone=candidate.get("phone"),
        location=candidate.get("location"),
        avatar_url=candidate.get("avatar_url"),
        resume_url=candidate.get("resume_url"),
        resume_parsed=candidate.get("resume_parsed"),
        source=candidate.get("source"),
        status=candidate.get("status", "applied"),
        created_at=candidate.get("created_at")
    )


@router.delete("/{candidate_id}")
async def delete_candidate(candidate_id: UUID):
    """Delete a candidate"""
    
    if str(candidate_id) not in DEMO_CANDIDATES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    del DEMO_CANDIDATES[str(candidate_id)]
    
    return {"message": "Candidate deleted successfully"}


@router.get("/{candidate_id}/score", response_model=InterviewScore)
async def get_candidate_score(candidate_id: UUID):
    """Get interview score for a candidate"""
    
    # In production, this would query actual interview data
    return InterviewScore(
        overall_score=7.8,
        dimensions=[
            {"name": "technical", "score": 8.0, "confidence": 0.9},
            {"name": "communication", "score": 7.5, "confidence": 0.85},
            {"name": "problem_solving", "score": 8.2, "confidence": 0.88},
            {"name": "leadership", "score": 7.0, "confidence": 0.8},
        ],
        recommendation={
            "decision": "HIRE",
            "confidence": 0.85,
            "reasoning": "Strong technical skills with good communication",
            "areas_to_investigate": ["Leadership experience"]
        }
    )


@router.get("/{candidate_id}/transcript", response_model=Transcript)
async def get_candidate_transcript(candidate_id: UUID):
    """Get interview transcript for a candidate"""
    
    # Sample transcript
    return Transcript(
        segments=[
            TranscriptSegment(
                id="1",
                speaker="ai",
                text="Can you tell me about your experience with system design?",
                start_time=0.0,
                end_time=5.0
            ),
            TranscriptSegment(
                id="2",
                speaker="candidate",
                text="Sure, I've worked on several large-scale systems...",
                start_time=5.0,
                end_time=45.0
            ),
            TranscriptSegment(
                id="3",
                speaker="ai",
                text="That's interesting. Can you dive deeper into the architecture?",
                start_time=45.0,
                end_time=50.0
            ),
        ],
        full_text="Interview transcript..."
    )
