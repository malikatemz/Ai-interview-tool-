from fastapi import APIRouter, HTTPException, status
from typing import List
from uuid import UUID
import uuid

from app.schemas.schemas import (
    QuestionGenerateInput, GeneratedQuestion, QuestionTemplate
)

router = APIRouter()


@router.get("/templates", response_model=List[QuestionTemplate])
async def get_question_templates():
    """Get available question templates"""
    
    templates = [
        QuestionTemplate(
            id=str(uuid.uuid4()),
            content="Describe your experience with designing scalable systems.",
            type="technical",
            category="system_design",
            difficulty=7
        ),
        QuestionTemplate(
            id=str(uuid.uuid4()),
            content="Tell me about a time you had to manage competing priorities.",
            type="behavioral",
            category="time_management",
            difficulty=5
        ),
        QuestionTemplate(
            id=str(uuid.uuid4()),
            content="How would you approach debugging a production issue?",
            type="situational",
            category="problem_solving",
            difficulty=6
        ),
        QuestionTemplate(
            id=str(uuid.uuid4()),
            content="Design a URL shortening service like Bitly.",
            type="case_study",
            category="system_design",
            difficulty=8
        ),
        QuestionTemplate(
            id=str(uuid.uuid4()),
            content="What would you do if you disagreed with a technical decision made by a senior engineer?",
            type="behavioral",
            category="conflict_resolution",
            difficulty=6
        ),
    ]
    
    return templates


@router.post("/generate", response_model=List[GeneratedQuestion])
async def generate_questions(input_data: QuestionGenerateInput):
    """Generate interview questions based on job description and candidate profile"""
    
    # Simplified question generation
    questions = []
    
    question_types = [qt.value for qt in input_data.question_types]
    
    # Technical questions
    if "technical" in question_types:
        questions.extend([
            GeneratedQuestion(
                question_id=str(uuid.uuid4()),
                content="Can you walk me through your experience with system architecture and design patterns?",
                type="technical",
                category="architecture",
                difficulty=7,
                expected_duration=180,
                follow_up_prompts=[
                    "What trade-offs did you consider?",
                    "How would you scale this for 10x traffic?"
                ],
                evaluation_criteria=[
                    "Technical accuracy",
                    "System thinking",
                    "Trade-off consideration"
                ]
            ),
            GeneratedQuestion(
                question_id=str(uuid.uuid4()),
                content="Describe a challenging technical problem you solved and the approach you took.",
                type="technical",
                category="problem_solving",
                difficulty=6,
                expected_duration=150,
                follow_up_prompts=[
                    "What alternatives did you consider?",
                    "What was the outcome?"
                ],
                evaluation_criteria=[
                    "Problem decomposition",
                    "Technical approach",
                    "Results"
                ]
            ),
        ])
    
    # Behavioral questions
    if "behavioral" in question_types:
        questions.extend([
            GeneratedQuestion(
                question_id=str(uuid.uuid4()),
                content="Tell me about a time when you had to work with a difficult team member. How did you handle it?",
                type="behavioral",
                category="collaboration",
                difficulty=5,
                expected_duration=120,
                follow_up_prompts=[
                    "What was the result?",
                    "What would you do differently?"
                ],
                evaluation_criteria=[
                    "Self-awareness",
                    "Conflict resolution",
                    "Professionalism"
                ]
            ),
            GeneratedQuestion(
                question_id=str(uuid.uuid4()),
                content="Describe a project where you had to lead or mentor others.",
                type="behavioral",
                category="leadership",
                difficulty=6,
                expected_duration=150,
                follow_up_prompts=[
                    "What challenges did you face?",
                    "How did you measure success?"
                ],
                evaluation_criteria=[
                    "Leadership skills",
                    "Communication",
                    "Impact"
                ]
            ),
        ])
    
    # Situational questions
    if "situational" in question_types:
        questions.extend([
            GeneratedQuestion(
                question_id=str(uuid.uuid4()),
                content="What would you do if you discovered a critical bug in production during a Friday evening?",
                type="situational",
                category="problem_solving",
                difficulty=7,
                expected_duration=120,
                follow_up_prompts=[
                    "How would you communicate with stakeholders?",
                    "What steps would you take to prevent future incidents?"
                ],
                evaluation_criteria=[
                    "Prioritization",
                    "Communication",
                    "Risk assessment"
                ]
            ),
        ])
    
    # Case study questions
    if "case_study" in question_types:
        questions.extend([
            GeneratedQuestion(
                question_id=str(uuid.uuid4()),
                content="Design a real-time notification system for a social media platform.",
                type="case_study",
                category="system_design",
                difficulty=8,
                expected_duration=300,
                follow_up_prompts=[
                    "How would you handle millions of concurrent users?",
                    "What about push notification delivery guarantees?"
                ],
                evaluation_criteria=[
                    "System design skills",
                    "Scalability thinking",
                    "Trade-off analysis"
                ]
            ),
        ])
    
    return questions


@router.get("/{question_id}")
async def get_question(question_id: UUID):
    """Get a specific question"""
    
    return {
        "id": str(question_id),
        "content": "Sample question content",
        "type": "technical",
        "category": "system_design",
        "difficulty": 7,
        "expected_duration": 180
    }
