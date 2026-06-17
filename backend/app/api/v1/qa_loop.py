"""
Q&A Loop API — orchestrates the core interview question-response-evaluation loop.
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
import uuid
import asyncio

from pydantic import BaseModel, Field

from app.services.interview_engine import (
    InterviewOrchestrator,
    QuestionGenerator,
    FollowUpEngine,
    InterviewContext,
    InterviewState,
    Question,
    Response,
    QuestionType,
)
from app.services.evaluation import ScoringEngine, Rubric, ScoreDimension


router = APIRouter(prefix="/qa-loop", tags=["Q&A Loop"])


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────────────────────────────────────

class QALoopStartRequest(BaseModel):
    interview_id: str
    candidate_id: str
    job_description: str = ""
    resume_skills: List[str] = []
    seniority_level: str = "mid"
    question_types: List[str] = ["technical", "behavioral"]
    duration_target: int = Field(default=45, ge=15, le=120)
    follow_up_aggressiveness: float = Field(default=0.5, ge=0.0, le=1.0)


class QALoopQuestion(BaseModel):
    id: str
    content: str
    type: str
    category: str
    difficulty: int
    expected_duration: int
    follow_up_prompts: List[str]
    evaluation_criteria: List[str]
    sequence_order: int


class QALoopResponse(BaseModel):
    id: str
    question_id: str
    content: str
    start_time: float
    end_time: float
    depth_score: Optional[float] = None
    clarity_score: Optional[float] = None
    technical_score: Optional[float] = None


class QALoopEvaluation(BaseModel):
    depth_score: float
    clarity_score: float
    technical_accuracy: float
    examples_quality: float
    overall_score: float
    feedback: str
    follow_up_suggested: Optional[str] = None
    should_follow_up: bool
    follow_up_type: Optional[str] = None


class QALoopAction(BaseModel):
    action: str  # "next_question" | "follow_up" | "end_interview"
    question: Optional[QALoopQuestion] = None
    evaluation: Optional[QALoopEvaluation] = None


class QALoopState(BaseModel):
    interview_id: str
    status: str  # setup | running | paused | follow_up | wrap_up | completed
    current_question: Optional[QALoopQuestion]
    current_question_index: int
    total_questions: int
    responses: List[Dict[str, Any]]
    elapsed_seconds: int
    remaining_seconds: int
    warnings: List[Dict[str, Any]]


class QALoopSummary(BaseModel):
    interview_id: str
    status: str
    total_questions: int
    total_responses: int
    duration_seconds: int
    overall_score: float
    recommendation: str
    key_strengths: List[str]
    areas_to_investigate: List[str]


# ─────────────────────────────────────────────────────────────────────────────
# In-Memory State (per interview session)
# ─────────────────────────────────────────────────────────────────────────────

class QALoopSession:
    """Holds all state for a single interview Q&A session."""

    def __init__(self, interview_id: str, candidate_id: str, config: Dict[str, Any]):
        self.interview_id = interview_id
        self.candidate_id = candidate_id
        self.config = config
        self.started_at = datetime.utcnow()

        # Build orchestrator
        orch_config = {
            "question_flow": "adaptive",
            "difficulty_curve": config.get("difficulty_curve", "standard"),
            "follow_up_aggressiveness": config.get("follow_up_aggressiveness", 0.5),
            "duration_target": config.get("duration_target", 45),
        }
        self.orchestrator = InterviewOrchestrator(orch_config)
        self.question_generator = QuestionGenerator()
        self.follow_up_engine = FollowUpEngine(aggressiveness=config.get("follow_up_aggressiveness", 0.5))

        # Scoring
        role_type = "senior_engineer" if config.get("seniority_level") == "senior" else "junior_engineer"
        self.scoring_engine = ScoringEngine(Rubric.get_rubric(role_type))

        # Questions & responses
        self.questions: List[Question] = []
        self.responses: List[Response] = []
        self.current_question_index = 0
        self.current_question: Optional[Question] = None

        # State
        self.status = "setup"
        self.warnings: List[Dict[str, Any]] = []
        self.response_start_time: Optional[float] = None

    def _question_to_model(self, q: Question, seq: int) -> QALoopQuestion:
        return QALoopQuestion(
            id=q.id,
            content=q.content,
            type=q.type.value if isinstance(q.type, QuestionType) else q.type,
            category=q.category,
            difficulty=q.difficulty,
            expected_duration=q.expected_duration,
            follow_up_prompts=q.follow_up_prompts,
            evaluation_criteria=q.evaluation_criteria,
            sequence_order=seq,
        )

    async def start(self) -> QALoopQuestion:
        """Generate questions and return the first one."""
        self.status = "running"

        # Generate questions from config
        self.questions = await self.question_generator.generate_questions(
            job_description=self.config.get("job_description", ""),
            resume_skills=self.config.get("resume_skills", []),
            seniority_level=self.config.get("seniority_level", "mid"),
            question_types=self.config.get("question_types", ["technical", "behavioral"]),
            count=self.config.get("question_count", 10),
        )

        if not self.questions:
            raise HTTPException(status_code=500, detail="Failed to generate questions")

        self.current_question = self.questions[0]
        self.current_question_index = 0
        return self._question_to_model(self.current_question, 1)

    async def submit_response(
        self,
        content: str,
        start_time: float,
        end_time: float,
    ) -> QALoopAction:
        """Process a candidate response and decide next action."""
        if not self.current_question:
            raise HTTPException(status_code=400, detail="No active question")

        # Record response
        response = Response(
            id=str(uuid.uuid4()),
            question_id=self.current_question.id,
            content=content,
            start_time=start_time,
            end_time=end_time,
        )
        self.responses.append(response)

        # Evaluate response using the scoring engine
        eval_result = self._evaluate_response(response)

        # Ask orchestrator what to do next
        action = self.orchestrator.process_response(
            self._build_context(),
            response,
        )

        should_follow_up = action.get("should_follow_up", False)
        follow_up_type = action.get("follow_up_type")

        if should_follow_up:
            # Generate follow-up question
            self.status = "follow_up"
            follow_up = self.follow_up_engine.generate_follow_up(
                self.current_question,
                response,
                self._build_context(),
            )
            self.current_question = follow_up
            return QALoopAction(
                action="follow_up",
                question=self._question_to_model(
                    follow_up,
                    self.current_question_index + 1,
                ),
                evaluation=eval_result,
            )

        # Move to next question
        return await self._next_question(eval_result)

    async def _next_question(self, evaluation: Optional[QALoopEvaluation] = None) -> QALoopAction:
        """Advance to the next question or end the interview."""
        self.current_question_index += 1

        elapsed = (datetime.utcnow() - self.started_at).seconds
        remaining = self.config.get("duration_target", 45) * 60 - elapsed

        # Check time limit
        if remaining <= 0 or self.current_question_index >= len(self.questions):
            self.status = "wrap_up"
            return QALoopAction(
                action="end_interview",
                evaluation=evaluation,
            )

        # Get next planned question
        if self.current_question_index < len(self.questions):
            self.current_question = self.questions[self.current_question_index]
            self.status = "running"
            return QALoopAction(
                action="next_question",
                question=self._question_to_model(
                    self.current_question,
                    self.current_question_index + 1,
                ),
                evaluation=evaluation,
            )

        self.status = "wrap_up"
        return QALoopAction(action="end_interview", evaluation=evaluation)

    def _evaluate_response(self, response: Response) -> QALoopEvaluation:
        """Evaluate a candidate response."""
        # Use scoring engine to analyze
        transcript_seg = {
            "start_time": response.start_time,
            "end_time": response.end_time,
        }

        # Get primary dimension from question type
        dim = self.scoring_engine._get_primary_dimension(
            self.current_question.type.value if isinstance(self.current_question.type, QuestionType) else self.current_question.type
        )

        dim_score = self.scoring_engine.score_response(
            response_text=response.content,
            question_type=self.current_question.type.value if isinstance(self.current_question.type, QuestionType) else self.current_question.type,
            evaluation_criteria=self.current_question.evaluation_criteria,
            transcript_segment=transcript_seg,
        )

        # Build evaluation result
        overall = dim_score.score
        depth = min(10.0, overall + 0.5)
        clarity = min(10.0, overall - 0.2)
        technical = dim_score.score if dim == ScoreDimension.TECHNICAL else min(10.0, overall + 0.3)
        examples = 7.0  # Would need transcript analysis

        should_follow = overall < 7.0
        follow_type = None
        if should_follow:
            if clarity < 5:
                follow_type = "clarification"
            elif examples < 5:
                follow_type = "examples_request"
            elif technical < 5:
                follow_type = "technical_deep_dive"
            else:
                follow_type = "alternative_angle"

        feedback = dim_score.explanation or f"Good response with {dim.value} depth."

        return QALoopEvaluation(
            depth_score=depth,
            clarity_score=clarity,
            technical_accuracy=technical,
            examples_quality=examples,
            overall_score=overall,
            feedback=feedback,
            follow_up_suggested=f"Consider exploring {self.current_question.category} further." if should_follow else None,
            should_follow_up=should_follow,
            follow_up_type=follow_type,
        )

    def _build_context(self) -> InterviewContext:
        return InterviewContext(
            interview_id=self.interview_id,
            candidate_id=self.candidate_id,
            job_description=self.config.get("job_description", ""),
            resume_skills=self.config.get("resume_skills", []),
            seniority_level=self.config.get("seniority_level", "mid"),
            questions=self.questions,
            responses=self.responses,
            current_question_index=self.current_question_index,
            state=InterviewState(self.status) if self.status in [s.value for s in InterviewState] else InterviewState.RUNNING,
        )

    def get_state(self) -> QALoopState:
        elapsed = (datetime.utcnow() - self.started_at).seconds
        remaining = max(0, self.config.get("duration_target", 45) * 60 - elapsed)

        return QALoopState(
            interview_id=self.interview_id,
            status=self.status,
            current_question=self._question_to_model(self.current_question, self.current_question_index + 1) if self.current_question else None,
            current_question_index=self.current_question_index,
            total_questions=len(self.questions),
            responses=[
                {
                    "id": r.id,
                    "question_id": r.question_id,
                    "content": r.content,
                    "start_time": r.start_time,
                    "end_time": r.end_time,
                }
                for r in self.responses
            ],
            elapsed_seconds=elapsed,
            remaining_seconds=remaining,
            warnings=self.warnings,
        )

    def end(self) -> QALoopSummary:
        self.status = "completed"
        elapsed = (datetime.utcnow() - self.started_at).seconds

        # Calculate overall score from responses
        if self.responses:
            scores = [r.depth_score or 7.0 for r in self.responses]
            overall = sum(scores) / len(scores)
        else:
            overall = 0.0

        rubric = self.scoring_engine.rubric
        rec = rubric.get_decision(overall)

        strengths = []
        areas = []
        if overall >= 7.0:
            strengths.append("Strong overall performance")
            areas.append("Advanced scenarios")
        else:
            strengths.append("Shows foundational knowledge")
            areas.append("Deep-dive technical skills")

        return QALoopSummary(
            interview_id=self.interview_id,
            status="completed",
            total_questions=len(self.questions),
            total_responses=len(self.responses),
            duration_seconds=elapsed,
            overall_score=round(overall, 1),
            recommendation=rec,
            key_strengths=strengths,
            areas_to_investigate=areas,
        )

    def add_warning(self, warning_type: str, message: str):
        self.warnings.append({
            "type": warning_type,
            "message": message,
            "timestamp": datetime.utcnow().timestamp(),
        })


# ─────────────────────────────────────────────────────────────────────────────
# Session Store
# ─────────────────────────────────────────────────────────────────────────────

_sessions: Dict[str, QALoopSession] = {}


def get_session(interview_id: str) -> QALoopSession:
    session = _sessions.get(interview_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


# ─────────────────────────────────────────────────────────────────────────────
# API Routes
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/start", response_model=QALoopQuestion)
async def start_qa_loop(req: QALoopStartRequest):
    """Start a new Q&A loop session — generates questions and returns first one."""
    session = QALoopSession(
        interview_id=req.interview_id,
        candidate_id=req.candidate_id,
        config={
            "job_description": req.job_description,
            "resume_skills": req.resume_skills,
            "seniority_level": req.seniority_level,
            "question_types": req.question_types,
            "duration_target": req.duration_target,
            "follow_up_aggressiveness": req.follow_up_aggressiveness,
            "question_count": 10,
        },
    )
    _sessions[req.interview_id] = session

    first_question = await session.start()
    return first_question


@router.post("/{interview_id}/respond", response_model=QALoopAction)
async def submit_response(
    interview_id: str,
    content: str,
    start_time: float,
    end_time: float,
):
    """Submit a candidate response and get the next action (next question, follow-up, or end)."""
    session = get_session(interview_id)
    action = await session.submit_response(content, start_time, end_time)
    return action


@router.get("/{interview_id}/state", response_model=QALoopState)
async def get_state(interview_id: str):
    """Get the current Q&A loop state."""
    session = get_session(interview_id)
    return session.get_state()


@router.post("/{interview_id}/warning")
async def add_warning(
    interview_id: str,
    warning_type: str,
    message: str,
):
    """Record a warning (e.g. tab switch)."""
    session = get_session(interview_id)
    session.add_warning(warning_type, message)
    return {"status": "recorded"}


@router.post("/{interview_id}/end", response_model=QALoopSummary)
async def end_qa_loop(interview_id: str):
    """End the Q&A loop and return the final summary."""
    session = get_session(interview_id)
    summary = session.end()
    # Clean up session after ending
    if interview_id in _sessions:
        del _sessions[interview_id]
    return summary
