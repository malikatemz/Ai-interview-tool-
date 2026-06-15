from fastapi import APIRouter, HTTPException, status
from typing import List
from uuid import UUID
import uuid

from app.schemas.schemas import (
    ResponseCreate, EvaluationResult, InterviewSummary,
    DetailedEvaluation, ScoreDimensionSummary, RecommendationResponse
)

router = APIRouter()


@router.post("/response", response_model=EvaluationResult)
async def evaluate_response(response_data: ResponseCreate):
    """Evaluate a candidate's response to a question"""
    
    # Simplified evaluation
    # In production, this would use AI for nuanced evaluation
    
    return EvaluationResult(
        depth_score=7.5,
        clarity_score=8.0,
        technical_accuracy=7.8,
        examples_quality=7.2,
        overall_score=7.6,
        feedback="Good response with specific examples. Demonstrated solid understanding of the topic.",
        follow_up_suggested="Can you elaborate on the scalability considerations?"
    )


@router.get("/{interview_id}/summary", response_model=InterviewSummary)
async def get_interview_summary(interview_id: UUID):
    """Get summary evaluation for an interview"""
    
    return InterviewSummary(
        interview_id=str(interview_id),
        overall_score=7.8,
        decision="HIRE",
        key_strengths=[
            "Strong technical foundation",
            "Excellent communication skills",
            "Real-world problem-solving experience",
            "Leadership potential"
        ],
        areas_to_investigate=[
            "Experience with ML/AI technologies",
            "Large-scale system design at extreme scale"
        ],
        duration_actual=2700,
        questions_count=12
    )


@router.get("/{interview_id}/detailed", response_model=DetailedEvaluation)
async def get_interview_detailed(interview_id: UUID):
    """Get detailed evaluation with full score breakdown"""
    
    return DetailedEvaluation(
        interview_id=str(interview_id),
        scores=[
            ScoreDimensionSummary(
                name="technical",
                score=8.2,
                evidence={
                    "transcript": "I implemented a distributed caching layer using Redis...",
                    "timestamp_start": 125.5,
                    "timestamp_end": 142.3
                },
                explanation="Demonstrated strong understanding of distributed systems and caching strategies.",
                confidence=0.9
            ),
            ScoreDimensionSummary(
                name="communication",
                score=7.8,
                evidence={
                    "transcript": "So basically, we had multiple services talking to each other...",
                    "timestamp_start": 45.0,
                    "timestamp_end": 65.0
                },
                explanation="Clear explanations with good use of examples.",
                confidence=0.85
            ),
            ScoreDimensionSummary(
                name="problem_solving",
                score=8.0,
                evidence={
                    "transcript": "First, I would identify the bottleneck by checking metrics...",
                    "timestamp_start": 200.0,
                    "timestamp_end": 220.0
                },
                explanation="Structured approach to problem-solving with good prioritization.",
                confidence=0.88
            ),
            ScoreDimensionSummary(
                name="leadership",
                score=6.5,
                evidence={
                    "transcript": "I mentored junior developers on my team...",
                    "timestamp_start": 300.0,
                    "timestamp_end": 315.0
                },
                explanation="Has mentorship experience but limited detail on strategic leadership.",
                confidence=0.75
            ),
        ],
        recommendation=RecommendationResponse(
            id=str(uuid.uuid4()),
            decision="hire",
            confidence=0.85,
            reasoning="Strong technical candidate with good communication skills. Would benefit from more leadership opportunities.",
            areas_to_investigate=[
                "Leadership experience at scale",
                "Cross-team collaboration"
            ],
            risk_factors=[
                "Limited ML/AI experience"
            ]
        ),
        transcript_with_evaluation=[
            {
                "segment": {
                    "id": "1",
                    "speaker": "ai",
                    "text": "Tell me about your experience with system design.",
                    "start_time": 0.0,
                    "end_time": 5.0
                }
            },
            {
                "segment": {
                    "id": "2",
                    "speaker": "candidate",
                    "text": "I've worked on several large-scale distributed systems...",
                    "start_time": 5.0,
                    "end_time": 45.0
                },
                "evaluation": {
                    "depth_score": 7.5,
                    "clarity_score": 8.0,
                    "overall_score": 7.8
                }
            }
        ]
    )


@router.get("/{interview_id}/scores", response_model=List[ScoreDimensionSummary])
async def get_interview_scores(interview_id: UUID):
    """Get all dimension scores for an interview"""
    
    return [
        ScoreDimensionSummary(
            name="technical",
            score=8.2,
            evidence={
                "transcript": "Sample transcript excerpt...",
                "timestamp_start": 0.0,
                "timestamp_end": 30.0
            },
            explanation="Strong technical skills demonstrated.",
            confidence=0.9
        ),
        ScoreDimensionSummary(
            name="communication",
            score=7.8,
            evidence={
                "transcript": "Sample transcript excerpt...",
                "timestamp_start": 30.0,
                "timestamp_end": 60.0
            },
            explanation="Clear and articulate.",
            confidence=0.85
        ),
        ScoreDimensionSummary(
            name="problem_solving",
            score=8.0,
            evidence={
                "transcript": "Sample transcript excerpt...",
                "timestamp_start": 60.0,
                "timestamp_end": 90.0
            },
            explanation="Structured problem-solving approach.",
            confidence=0.88
        ),
    ]
