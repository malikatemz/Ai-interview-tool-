from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
import json


class ScoreDimension(str, Enum):
    COMMUNICATION = "communication"
    TECHNICAL = "technical"
    PROBLEM_SOLVING = "problem_solving"
    CONFIDENCE = "confidence"
    LEADERSHIP = "leadership"
    DOMAIN_KNOWLEDGE = "domain_knowledge"


@dataclass
class ScoreEvidence:
    """Evidence supporting a score"""
    transcript: str
    timestamp_start: float
    timestamp_end: float
    keywords_matched: List[str]
    concepts_detected: List[str]


@dataclass
class DimensionScore:
    """Score for a single dimension"""
    dimension: ScoreDimension
    score: float
    evidence: Optional[ScoreEvidence] = None
    explanation: Optional[str] = None
    confidence: float = 0.9


@dataclass
class InterviewScore:
    """Complete interview score"""
    overall_score: float
    dimensions: List[DimensionScore]
    weighted_score: float
    recommendation: 'Recommendation'


@dataclass
class Recommendation:
    """Hiring recommendation"""
    decision: str  # STRONG_HIRE, HIRE, HOLD, REJECT
    confidence: float
    reasoning: str
    areas_to_investigate: List[str]
    risk_factors: List[str]


class Rubric:
    """Scoring rubric with weights and thresholds"""
    
    DEFAULT_RUBRICS = {
        "senior_engineer": {
            "weights": {
                ScoreDimension.TECHNICAL: 0.35,
                ScoreDimension.PROBLEM_SOLVING: 0.25,
                ScoreDimension.COMMUNICATION: 0.15,
                ScoreDimension.LEADERSHIP: 0.15,
                ScoreDimension.DOMAIN_KNOWLEDGE: 0.10,
            },
            "thresholds": {
                "strong_hire": 8.5,
                "hire": 7.0,
                "hold": 5.5,
                "reject": 0.0
            }
        },
        "junior_engineer": {
            "weights": {
                ScoreDimension.TECHNICAL: 0.25,
                ScoreDimension.PROBLEM_SOLVING: 0.25,
                ScoreDimension.COMMUNICATION: 0.25,
                ScoreDimension.DOMAIN_KNOWLEDGE: 0.15,
                ScoreDimension.CONFIDENCE: 0.10,
            },
            "thresholds": {
                "strong_hire": 8.0,
                "hire": 6.5,
                "hold": 5.0,
                "reject": 0.0
            }
        },
        "product_manager": {
            "weights": {
                ScoreDimension.COMMUNICATION: 0.30,
                ScoreDimension.LEADERSHIP: 0.25,
                ScoreDimension.PROBLEM_SOLVING: 0.20,
                ScoreDimension.DOMAIN_KNOWLEDGE: 0.15,
                ScoreDimension.CONFIDENCE: 0.10,
            },
            "thresholds": {
                "strong_hire": 8.0,
                "hire": 6.5,
                "hold": 5.0,
                "reject": 0.0
            }
        }
    }

    def __init__(self, name: str, weights: Dict[ScoreDimension, float], thresholds: Dict[str, float]):
        self.name = name
        self.weights = weights
        self.thresholds = thresholds

    @classmethod
    def get_rubric(cls, role_type: str) -> 'Rubric':
        """Get rubric by role type"""
        rubric_data = cls.DEFAULT_RUBRICS.get(role_type, cls.DEFAULT_RUBRICS["senior_engineer"])
        return cls(role_type, rubric_data["weights"], rubric_data["thresholds"])

    def get_decision(self, weighted_score: float) -> str:
        """Get recommendation decision based on weighted score"""
        if weighted_score >= self.thresholds["strong_hire"]:
            return "STRONG_HIRE"
        elif weighted_score >= self.thresholds["hire"]:
            return "HIRE"
        elif weighted_score >= self.thresholds["hold"]:
            return "HOLD"
        else:
            return "REJECT"


class ScoringEngine:
    """
    Evidence-based scoring engine that provides transparent, auditable scores.
    """

    def __init__(self, rubric: Rubric):
        self.rubric = rubric

    def score_response(
        self,
        response_text: str,
        question_type: str,
        evaluation_criteria: List[str],
        transcript_segment: Dict[str, Any]
    ) -> DimensionScore:
        """Score a single response and return dimension score with evidence"""
        
        # Analyze transcript segment
        analysis = self._analyze_transcript(response_text, question_type, evaluation_criteria)
        
        # Map to dimension scores
        dimension = self._get_primary_dimension(question_type)
        score = self._calculate_dimension_score(analysis, dimension)
        
        return DimensionScore(
            dimension=dimension,
            score=score,
            evidence=ScoreEvidence(
                transcript=response_text,
                timestamp_start=transcript_segment.get("start_time", 0),
                timestamp_end=transcript_segment.get("end_time", 0),
                keywords_matched=analysis.get("keywords", []),
                concepts_detected=analysis.get("concepts", [])
            ),
            explanation=analysis.get("explanation", ""),
            confidence=analysis.get("confidence", 0.8)
        )

    def _analyze_transcript(
        self,
        text: str,
        question_type: str,
        criteria: List[str]
    ) -> Dict[str, Any]:
        """
        Analyze transcript text for scoring.
        In production, this would use AI/LLM for nuanced analysis.
        """
        
        # Placeholder analysis
        text_lower = text.lower()
        
        # Count criteria-related keywords
        criteria_keywords = {
            "Technical accuracy": ["implemented", "designed", "built", "developed", "architected", "optimized"],
            "Problem decomposition": ["first", "then", "next", "step", "break down", "decompose", "approach"],
            "Trade-off consideration": ["however", "but", "trade-off", "pros", "cons", "alternative", "versus"],
            "Specific examples": ["for example", "for instance", "such as", "specifically", "when i", "my project"],
            "Action orientation": ["i did", "i implemented", "i led", "i created", "i drove", "i managed"],
            "Outcome clarity": ["resulted in", "achieved", "improved", "increased", "reduced", "outcome", "impact"]
        }
        
        keywords_found = []
        concepts_detected = []
        
        for criterion, words in criteria_keywords.items():
            for word in words:
                if word in text_lower:
                    keywords_found.append(word)
                    if criterion not in concepts_detected:
                        concepts_detected.append(criterion)
        
        # Calculate base score (placeholder - real implementation would use AI)
        base_score = 5.0 + (len(keywords_found) * 0.2)
        base_score = min(10.0, max(1.0, base_score))
        
        return {
            "keywords": list(set(keywords_found)),
            "concepts": concepts_detected,
            "score": base_score,
            "explanation": f"Found {len(keywords_found)} keyword matches and {len(concepts_detected)} relevant concepts.",
            "confidence": 0.8
        }

    def _get_primary_dimension(self, question_type: str) -> ScoreDimension:
        """Map question type to primary scoring dimension"""
        mapping = {
            "technical": ScoreDimension.TECHNICAL,
            "behavioral": ScoreDimension.COMMUNICATION,
            "situational": ScoreDimension.PROBLEM_SOLVING,
            "case_study": ScoreDimension.PROBLEM_SOLVING,
            "open_ended": ScoreDimension.COMMUNICATION
        }
        return mapping.get(question_type, ScoreDimension.COMMUNICATION)

    def _calculate_dimension_score(
        self, 
        analysis: Dict[str, Any], 
        dimension: ScoreDimension
    ) -> float:
        """Calculate final score for a dimension"""
        # Apply dimension-specific adjustments
        base_score = analysis.get("score", 5.0)
        
        # Bonus for evidence (specific examples, technical terms)
        evidence_bonus = 0.0
        if len(analysis.get("concepts", [])) >= 3:
            evidence_bonus += 0.5
        if len(analysis.get("keywords", [])) >= 5:
            evidence_bonus += 0.5
        
        return min(10.0, base_score + evidence_bonus)

    def calculate_weighted_score(
        self, 
        dimension_scores: List[DimensionScore]
    ) -> float:
        """Calculate weighted average of dimension scores"""
        
        total_weighted = 0.0
        total_weight = 0.0
        
        for dim_score in dimension_scores:
            weight = self.rubric.weights.get(dim_score.dimension, 0.0)
            if weight > 0:
                total_weighted += dim_score.score * weight
                total_weight += weight
        
        if total_weight == 0:
            return 0.0
        
        return total_weighted / total_weight

    def generate_recommendation(
        self,
        interview_score: InterviewScore,
        key_strengths: List[str],
        areas_to_investigate: List[str]
    ) -> Recommendation:
        """Generate hiring recommendation with reasoning"""
        
        decision = self.rubric.get_decision(interview_score.weighted_score)
        
        # Generate reasoning
        reasoning = self._generate_reasoning(interview_score, decision)
        
        # Identify risk factors
        risk_factors = self._identify_risks(interview_score)
        
        return Recommendation(
            decision=decision,
            confidence=interview_score.dimensions[0].confidence if interview_score.dimensions else 0.8,
            reasoning=reasoning,
            areas_to_investigate=areas_to_investigate,
            risk_factors=risk_factors
        )

    def _generate_reasoning(
        self, 
        score: InterviewScore, 
        decision: str
    ) -> str:
        """Generate human-readable reasoning for recommendation"""
        
        decision_text = {
            "STRONG_HIRE": "Strong Hire",
            "HIRE": "Hire",
            "HOLD": "Hold",
            "REJECT": "Reject"
        }
        
        top_dimensions = sorted(
            score.dimensions, 
            key=lambda d: d.score, 
            reverse=True
        )[:2]
        
        dimension_names = {
            ScoreDimension.TECHNICAL: "technical skills",
            ScoreDimension.COMMUNICATION: "communication",
            ScoreDimension.PROBLEM_SOLVING: "problem-solving",
            ScoreDimension.LEADERSHIP: "leadership",
            ScoreDimension.CONFIDENCE: "confidence",
            ScoreDimension.DOMAIN_KNOWLEDGE: "domain knowledge"
        }
        
        top_str = " and ".join([dimension_names.get(d.dimension, str(d.dimension)) for d in top_dimensions])
        
        return f"{decision_text.get(decision, decision)} recommendation based on strong {top_str}. Overall weighted score of {score.weighted_score:.1f}/10."

    def _identify_risks(self, score: InterviewScore) -> List[str]:
        """Identify risk factors from scores"""
        
        risks = []
        
        for dim in score.dimensions:
            if dim.score < 5.0:
                risks.append(f"Low {dim.dimension.value} score ({dim.score:.1f})")
        
        # Check for low confidence
        low_confidence = [d for d in score.dimensions if d.confidence < 0.7]
        if low_confidence:
            risks.append("Some evaluations have low confidence - manual review recommended")
        
        return risks


class EvidenceCollector:
    """
    Collects and formats evidence for scoring transparency.
    """

    def __init__(self):
        self.evidence_store: List[Dict[str, Any]] = []

    def collect(
        self,
        dimension: ScoreDimension,
        score: float,
        transcript_segment: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Collect evidence for a scoring event"""
        
        evidence = {
            "dimension": dimension.value,
            "score": score,
            "timestamp": context.get("timestamp"),
            "question_id": context.get("question_id"),
            "transcript": transcript_segment.get("text", ""),
            "speaker": transcript_segment.get("speaker", "unknown"),
            "timing": {
                "start": transcript_segment.get("start_time"),
                "end": transcript_segment.get("end_time")
            },
            "analysis": {
                "keywords_matched": self._extract_keywords(transcript_segment.get("text", "")),
                "concepts_detected": self._detect_concepts(transcript_segment.get("text", "")),
                "sentiment": self._analyze_sentiment(transcript_segment.get("text", ""))
            }
        }
        
        self.evidence_store.append(evidence)
        return evidence

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract relevant keywords from text"""
        # Simplified keyword extraction
        technical_terms = [
            "api", "database", "cache", "queue", "microservice", "architecture",
            "algorithm", "optimization", "scalability", "deployment", "testing",
            "refactoring", "design pattern", " SOLID", "agile", "scrum"
        ]
        
        return [term for term in technical_terms if term.lower() in text.lower()]

    def _detect_concepts(self, text: str) -> List[str]:
        """Detect relevant concepts in text"""
        concepts = []
        
        concept_indicators = {
            "system_design": ["design", "architecture", "scale", "component", "interface"],
            "problem_solving": ["approach", "solve", "fix", "resolve", "debug"],
            "leadership": ["led", "managed", "mentored", "guided", "directed"],
            "communication": ["explained", "described", "presented", "shared", "discussed"]
        }
        
        text_lower = text.lower()
        for concept, indicators in concept_indicators.items():
            if any(ind in text_lower for ind in indicators):
                concepts.append(concept)
        
        return concepts

    def _analyze_sentiment(self, text: str) -> str:
        """Analyze sentiment of response"""
        positive = ["great", "excellent", "love", "enjoy", "passionate", "excited"]
        negative = ["struggle", "difficult", "challenge", "problem", "issue"]
        
        text_lower = text.lower()
        
        pos_count = sum(1 for p in positive if p in text_lower)
        neg_count = sum(1 for n in negative if n in text_lower)
        
        if pos_count > neg_count:
            return "positive"
        elif neg_count > pos_count:
            return "cautious"
        return "neutral"

    def get_evidence_report(self) -> Dict[str, Any]:
        """Generate comprehensive evidence report"""
        return {
            "total_pieces": len(self.evidence_store),
            "by_dimension": self._group_by_dimension(),
            "timeline": self.evidence_store
        }

    def _group_by_dimension(self) -> Dict[str, List[Dict]]:
        """Group evidence by dimension"""
        grouped = {}
        for evidence in self.evidence_store:
            dim = evidence["dimension"]
            if dim not in grouped:
                grouped[dim] = []
            grouped[dim].append(evidence)
        return grouped
