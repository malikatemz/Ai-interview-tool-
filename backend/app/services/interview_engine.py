from typing import List, Optional, Dict, Any, Callable
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
import uuid
import json


class InterviewState(str, Enum):
    SETUP = "setup"
    RUNNING = "running"
    PAUSED = "paused"
    FOLLOW_UP = "follow_up"
    TRANSITION = "transition"
    WRAP_UP = "wrap_up"
    COMPLETED = "completed"


class QuestionType(str, Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SITUATIONAL = "situational"
    CASE_STUDY = "case_study"
    OPEN_ENDED = "open_ended"


@dataclass
class Question:
    id: str
    content: str
    type: QuestionType
    category: str
    difficulty: int
    expected_duration: int
    follow_up_prompts: List[str] = field(default_factory=list)
    evaluation_criteria: List[str] = field(default_factory=list)
    sequence_order: int = 0


@dataclass
class Response:
    id: str
    question_id: str
    content: str
    start_time: float
    end_time: float
    depth_score: Optional[float] = None
    clarity_score: Optional[float] = None
    technical_score: Optional[float] = None


@dataclass
class InterviewContext:
    interview_id: str
    candidate_id: str
    job_description: str
    resume_skills: List[str]
    seniority_level: str
    questions: List[Question] = field(default_factory=list)
    responses: List[Response] = field(default_factory=list)
    current_question_index: int = 0
    state: InterviewState = InterviewState.SETUP
    started_at: Optional[datetime] = None
    config: Dict[str, Any] = field(default_factory=dict)


class InterviewOrchestrator:
    """
    Controls the interview flow, timing, question sequencing, and state management.
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.state = InterviewState.SETUP
        self.question_flow = config.get("question_flow", "sequential")
        self.difficulty_curve = config.get("difficulty_curve", "standard")
        self.follow_up_aggressiveness = config.get("follow_up_aggressiveness", 0.5)
        self.pause_policy = config.get("pause_policy", {"max_pauses": 2, "max_pause_duration": 300})
        
        self._callbacks: Dict[str, Callable] = {}

    def on(self, event: str, callback: Callable):
        """Register event callback"""
        self._callbacks[event] = callback

    def emit(self, event: str, data: Any):
        """Emit event to registered callback"""
        if event in self._callbacks:
            self._callbacks[event](data)

    def start_interview(self, context: InterviewContext) -> Question:
        """Start the interview and return first question"""
        context.state = InterviewState.RUNNING
        context.started_at = datetime.utcnow()
        self.state = InterviewState.RUNNING
        
        if context.questions:
            first_question = context.questions[0]
            self.emit("question_started", first_question)
            return first_question
        
        raise ValueError("No questions available for interview")

    def get_next_question(self, context: InterviewContext) -> Optional[Question]:
        """Get the next question based on current state and responses"""
        if context.current_question_index >= len(context.questions):
            self.state = InterviewState.WRAP_UP
            return None

        next_question = context.questions[context.current_question_index]
        context.current_question_index += 1
        
        self.emit("question_started", next_question)
        return next_question

    def process_response(
        self, 
        context: InterviewContext, 
        response: Response
    ) -> Dict[str, Any]:
        """Process a response and determine next action"""
        context.responses.append(response)
        
        # Evaluate response quality
        quality = self._evaluate_response_quality(response)
        
        # Determine next action based on quality
        action = self._determine_next_action(quality, context)
        
        return {
            "quality": quality,
            "action": action,
            "should_follow_up": quality.get("depth_score", 0) < 7.0,
            "follow_up_type": self._get_follow_up_type(quality)
        }

    def _evaluate_response_quality(self, response: Response) -> Dict[str, float]:
        """Evaluate the quality of a response"""
        # Placeholder - actual implementation would use AI
        return {
            "depth_score": response.depth_score or 7.0,
            "clarity_score": response.clarity_score or 7.0,
            "technical_score": response.technical_score or 7.0,
            "examples_score": 7.0,  # Would be extracted from analysis
        }

    def _determine_next_action(
        self, 
        quality: Dict[str, float], 
        context: InterviewContext
    ) -> str:
        """Determine what action to take after a response"""
        avg_quality = sum(quality.values()) / len(quality)
        
        if avg_quality >= 8.0:
            return "deep_dive"
        elif avg_quality >= 6.0:
            return "standard_follow_up"
        elif avg_quality >= 4.0:
            return "simplify_and_probe"
        else:
            return "redirect"

    def _get_follow_up_type(self, quality: Dict[str, float]) -> str:
        """Determine the type of follow-up question to ask"""
        if quality.get("depth_score", 0) < 5:
            return "clarification"
        elif quality.get("examples_score", 0) < 5:
            return "examples_request"
        elif quality.get("technical_score", 0) < 5:
            return "technical_deep_dive"
        else:
            return "alternative_angle"

    def should_pause(self, context: InterviewContext) -> bool:
        """Check if interview should be paused based on policy"""
        # Check if target duration reached
        if context.started_at:
            elapsed = (datetime.utcnow() - context.started_at).seconds
            if elapsed >= context.config.get("duration_target", 45) * 60:
                return True
        return False

    def end_interview(self, context: InterviewContext) -> Dict[str, Any]:
        """End the interview and prepare summary"""
        context.state = InterviewState.COMPLETED
        self.state = InterviewState.COMPLETED
        
        self.emit("interview_completed", {
            "interview_id": context.interview_id,
            "total_questions": len(context.questions),
            "total_responses": len(context.responses),
            "duration": (datetime.utcnow() - context.started_at).seconds if context.started_at else 0
        })
        
        return {
            "status": "completed",
            "summary": self._generate_summary(context)
        }

    def _generate_summary(self, context: InterviewContext) -> Dict[str, Any]:
        """Generate interview summary"""
        return {
            "interview_id": context.interview_id,
            "questions_asked": len(context.questions),
            "responses_received": len(context.responses),
            "topics_covered": list(set(q.category for q in context.questions))
        }


class QuestionGenerator:
    """
    Generates interview questions based on job description, resume, and role level.
    """

    def __init__(self, openai_client=None):
        self.openai_client = openai_client

    async def generate_questions(
        self,
        job_description: str,
        resume_skills: List[str],
        seniority_level: str,
        question_types: List[str],
        count: int = 10
    ) -> List[Question]:
        """Generate a set of interview questions"""
        
        # Extract key competencies from job description
        competencies = self._extract_competencies(job_description)
        
        # Determine difficulty range based on seniority
        difficulty_range = self._get_difficulty_range(seniority_level)
        
        questions = []
        
        # Generate questions for each type
        questions_per_type = count // len(question_types)
        
        for qtype in question_types:
            type_questions = await self._generate_questions_by_type(
                qtype,
                competencies,
                resume_skills,
                difficulty_range,
                questions_per_type
            )
            questions.extend(type_questions)
        
        # Sort by difficulty (easier first, harder later)
        questions.sort(key=lambda q: q.difficulty)
        
        # Assign sequence orders
        for i, q in enumerate(questions):
            q.sequence_order = i
        
        return questions[:count]

    def _extract_competencies(self, job_description: str) -> List[str]:
        """Extract key competencies from job description"""
        # Simplified extraction - in production would use NLP
        keywords = {
            "technical": ["python", "java", "system design", "architecture", "database", "api"],
            "soft": ["leadership", "communication", "teamwork", "problem-solving", "collaboration"],
            "domain": ["cloud", "distributed systems", "machine learning", "data engineering"]
        }
        
        competencies = []
        text_lower = job_description.lower()
        
        for category, skills in keywords.items():
            for skill in skills:
                if skill in text_lower:
                    competencies.append(skill)
        
        return competencies if competencies else ["general"]

    def _get_difficulty_range(self, seniority: str) -> tuple:
        """Get difficulty range based on seniority level"""
        ranges = {
            "junior": (1, 4),
            "mid": (3, 6),
            "senior": (5, 8),
            "lead": (7, 10),
            "principal": (8, 10)
        }
        return ranges.get(seniority.lower(), (5, 8))

    async def _generate_questions_by_type(
        self,
        qtype: str,
        competencies: List[str],
        resume_skills: List[str],
        difficulty_range: tuple,
        count: int
    ) -> List[Question]:
        """Generate questions of a specific type"""
        
        # Templates for each question type
        templates = {
            QuestionType.TECHNICAL: [
                "Can you explain how you would approach designing a {competency} system?",
                "What are the key considerations when implementing {competency}?",
                "Describe a challenge you faced with {competency} and how you solved it.",
                "How would you scale a {competency} system to handle 10x traffic?",
            ],
            QuestionType.BEHAVIORAL: [
                "Tell me about a time when you had to {competency} under pressure.",
                "Describe a project where you successfully applied {competency}.",
                "How do you approach {competency} in your daily work?",
                "Give me an example of how you've improved your {competency} skills.",
            ],
            QuestionType.SITUATIONAL: [
                "What would you do if you encountered {competency} issues in production?",
                "How would you handle a situation where {competency} became critical?",
                "If faced with {competency} challenges, what would be your approach?",
            ],
            QuestionType.CASE_STUDY: [
                "Design a {competency} solution for a mid-sized company.",
                "How would you approach the problem of {competency}?",
                "Walk me through your thought process for {competency} scenarios.",
            ]
        }
        
        questions = []
        type_enum = QuestionType(qtype)
        template_list = templates.get(type_enum, templates[QuestionType.OPEN_ENDED])
        
        for i in range(count):
            template = template_list[i % len(template_list)]
            competency = competencies[i % len(competencies)] if competencies else "technical"
            
            content = template.format(competency=competency)
            difficulty = difficulty_range[0] + (i * (difficulty_range[1] - difficulty_range[0]) // count)
            
            question = Question(
                id=str(uuid.uuid4()),
                content=content,
                type=type_enum,
                category=competency,
                difficulty=min(max(difficulty, 1), 10),
                expected_duration=180,  # 3 minutes
                follow_up_prompts=self._generate_follow_up_prompts(type_enum, competency),
                evaluation_criteria=self._get_evaluation_criteria(type_enum)
            )
            questions.append(question)
        
        return questions

    def _generate_follow_up_prompts(self, qtype: QuestionType, category: str) -> List[str]:
        """Generate follow-up prompts based on question type"""
        prompts = {
            QuestionType.TECHNICAL: [
                f"Can you provide a specific example of {category} implementation?",
                "What trade-offs did you consider in your approach?",
                "How would you test this solution?",
            ],
            QuestionType.BEHAVIORAL: [
                "What was the outcome of that situation?",
                "What would you do differently if faced with this again?",
                "How did this experience change your approach?",
            ],
            QuestionType.SITUATIONAL: [
                "Walk me through your decision-making process.",
                "What resources would you need?",
                "How would you measure success?",
            ]
        }
        return prompts.get(qtype, [])

    def _get_evaluation_criteria(self, qtype: QuestionType) -> List[str]:
        """Get evaluation criteria for question type"""
        criteria = {
            QuestionType.TECHNICAL: [
                "Technical accuracy",
                "Problem decomposition",
                "Trade-off consideration",
                "Practical experience"
            ],
            QuestionType.BEHAVIORAL: [
                "Specific examples",
                "Action orientation",
                "Outcome clarity",
                "Self-awareness"
            ],
            QuestionType.SITUATIONAL: [
                "Problem understanding",
                "Structured thinking",
                "Resource awareness",
                "Measurable outcomes"
            ]
        }
        return criteria.get(qtype, ["Clarity", "Completeness", "Relevance"])


class FollowUpEngine:
    """
    Determines when and how to ask follow-up questions.
    """

    def __init__(self, aggressiveness: float = 0.5):
        self.aggressiveness = aggressiveness

    def should_follow_up(
        self,
        response: Response,
        question: Question,
        context: InterviewContext
    ) -> bool:
        """Determine if a follow-up question should be asked"""
        
        # Check depth
        if response.depth_score and response.depth_score < 6.0:
            return True
        
        # Check for lack of examples
        if self._lacks_examples(response):
            return True
        
        # Check for technical inconsistencies
        if self._has_inconsistencies(response, context):
            return True
        
        # Random chance based on aggressiveness
        import random
        if random.random() < self.aggressiveness:
            return True
        
        return False

    def generate_follow_up(
        self,
        question: Question,
        response: Response,
        context: InterviewContext
    ) -> Question:
        """Generate an appropriate follow-up question"""
        
        if response.depth_score and response.depth_score < 5:
            return self._simplify_and_probe(question, response)
        
        if self._has_inconsistencies(response, context):
            return self._clarify_inconsistency(question, response)
        
        if response.depth_score and response.depth_score >= 8:
            return self._deep_dive(question, response)
        
        return self._alternative_angle(question)

    def _lacks_examples(self, response: Response) -> bool:
        """Check if response lacks specific examples"""
        # Placeholder - would analyze transcript for example markers
        return False

    def _has_inconsistencies(self, response: Response, context: InterviewContext) -> bool:
        """Check for inconsistencies in response"""
        # Placeholder - would compare with resume and previous responses
        return False

    def _simplify_and_probe(self, question: Question, response: Response) -> Question:
        """Ask a simpler follow-up to probe deeper"""
        return Question(
            id=str(uuid.uuid4()),
            content=f"Let me clarify - could you walk me through a specific example of when you did this?",
            type=QuestionType.TECHNICAL,
            category=question.category,
            difficulty=max(1, question.difficulty - 2),
            expected_duration=120,
            follow_up_prompts=[],
            evaluation_criteria=["Specific example", "Clarity", "Depth"]
        )

    def _clarify_inconsistency(self, question: Question, response: Response) -> Question:
        """Ask for clarification on inconsistency"""
        return Question(
            id=str(uuid.uuid4()),
            content="You mentioned X earlier, but now you're describing Y. Can you help me understand how these connect?",
            type=QuestionType.BEHAVIORAL,
            category="clarification",
            difficulty=question.difficulty,
            expected_duration=90,
            follow_up_prompts=[],
            evaluation_criteria=["Consistency", "Self-awareness", "Explanation"]
        )

    def _deep_dive(self, question: Question, response: Response) -> Question:
        """Ask a more challenging follow-up for strong answers"""
        return Question(
            id=str(uuid.uuid4()),
            content=f"You've demonstrated solid understanding of {question.category}. Let's explore a more advanced scenario - how would you handle {question.category} at scale?",
            type=QuestionType.TECHNICAL,
            category=question.category,
            difficulty=min(10, question.difficulty + 2),
            expected_duration=180,
            follow_up_prompts=["What are the potential failure points?", "How would you monitor this?"],
            evaluation_criteria=["Advanced understanding", "Scalability thinking", "Risk awareness"]
        )

    def _alternative_angle(self, question: Question) -> Question:
        """Ask from a different angle"""
        return Question(
            id=str(uuid.uuid4()),
            content=f"Interesting perspective. From a different angle - how would you approach this if you had limited time or resources?",
            type=QuestionType.SITUATIONAL,
            category=question.category,
            difficulty=question.difficulty,
            expected_duration=120,
            follow_up_prompts=["What would you prioritize?", "What trade-offs would you make?"],
            evaluation_criteria=["Practical thinking", "Prioritization", "Resourcefulness"]
        )
