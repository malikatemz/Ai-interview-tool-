from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid
import json


class ContextType(str, Enum):
    QUESTION_GENERATION = "question_generation"
    EVALUATION = "evaluation"
    FOLLOW_UP = "follow_up"
    RECOMMENDATION = "recommendation"


@dataclass
class KnowledgeChunk:
    """A chunk of knowledge from the knowledge base"""
    id: str
    content: str
    source_type: str  # job_description, company_doc, hiring_guide, etc.
    source_id: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    embedding: Optional[List[float]] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class CandidateContext:
    """Context about a candidate"""
    candidate_id: str
    name: str
    email: str
    resume_skills: List[str]
    experience_years: int
    seniority_level: str
    previous_interviews: List[Dict[str, Any]] = field(default_factory=list)
    applied_roles: List[str] = field(default_factory=list)


@dataclass
class InterviewMemory:
    """Session memory for an interview"""
    interview_id: str
    candidate_id: str
    session_context: Dict[str, Any] = field(default_factory=dict)
    question_history: List[Dict[str, Any]] = field(default_factory=list)
    current_topic: Optional[str] = None
    answered_topics: List[str] = field(default_factory=list)
    pending_questions: List[str] = field(default_factory=list)
    context_window: List[Dict[str, Any]] = field(default_factory=list)
    entity_memory: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class RAGResult:
    """Result from a RAG query"""
    chunks: List[KnowledgeChunk]
    relevance_scores: List[float]
    citations: List[Dict[str, str]]
    context: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Recommendation:
    """Hiring recommendation"""
    decision: str  # STRONG_HIRE, HIRE, HOLD, REJECT
    confidence: float
    reasoning: str
    key_strengths: List[str]
    areas_to_investigate: List[str]
    comparison_to_role: Dict[str, float]
    risk_factors: List[str]


class VectorStore:
    """
    Simple in-memory vector store for embeddings.
    In production, use Pinecone, Weaviate, or pgvector.
    """
    
    def __init__(self):
        self.chunks: Dict[str, KnowledgeChunk] = {}
        self.embeddings: Dict[str, List[float]] = {}
        self._initialize_sample_knowledge()
    
    def _initialize_sample_knowledge(self):
        """Initialize with sample company knowledge"""
        sample_chunks = [
            KnowledgeChunk(
                id=str(uuid.uuid4()),
                content="Our engineering culture emphasizes pragmatism over perfection. We believe in shipping value quickly and iterating.",
                source_type="company_culture",
                source_id="culture-1",
                metadata={"category": "values"}
            ),
            KnowledgeChunk(
                id=str(uuid.uuid4()),
                content="Technical excellence is key - we expect engineers to write clean, maintainable code with comprehensive tests.",
                source_type="company_culture",
                source_id="culture-2",
                metadata={"category": "technical"}
            ),
            KnowledgeChunk(
                id=str(uuid.uuid4()),
                content="Collaboration across teams is essential. Engineers regularly work with product, design, and data science.",
                source_type="company_culture",
                source_id="culture-3",
                metadata={"category": "collaboration"}
            ),
            KnowledgeChunk(
                id=str(uuid.uuid4()),
                content="We value clear communication - engineers present designs, write documentation, and participate in code reviews.",
                source_type="company_culture",
                source_id="culture-4",
                metadata={"category": "communication"}
            ),
            KnowledgeChunk(
                id=str(uuid.uuid4()),
                content="System design discussions are common - expect to talk through trade-offs, scaling considerations, and failure modes.",
                source_type="interview_guide",
                source_id="guide-1",
                metadata={"category": "technical", "role": "senior"}
            ),
            KnowledgeChunk(
                id=str(uuid.uuid4()),
                content="Behavioral questions focus on collaboration, conflict resolution, and examples of working through ambiguity.",
                source_type="interview_guide",
                source_id="guide-2",
                metadata={"category": "behavioral"}
            ),
        ]
        
        for chunk in sample_chunks:
            self.add_chunk(chunk)
    
    def add_chunk(self, chunk: KnowledgeChunk):
        """Add a chunk to the store"""
        self.chunks[chunk.id] = chunk
    
    def search(
        self, 
        query_embedding: List[float], 
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[KnowledgeChunk, float]]:
        """Search for similar chunks using cosine similarity"""
        results = []
        
        for chunk_id, chunk in self.chunks.items():
            if filter_metadata:
                # Apply metadata filters
                skip = False
                for key, value in filter_metadata.items():
                    if chunk.metadata.get(key) != value:
                        skip = True
                        break
                if skip:
                    continue
            
            if chunk.embedding is None:
                continue
            
            # Calculate cosine similarity
            similarity = self._cosine_similarity(query_embedding, chunk.embedding)
            results.append((chunk, similarity))
        
        # Sort by similarity and return top_k
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]
    
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if len(a) != len(b):
            return 0.0
        
        dot_product = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(x * x for x in b) ** 0.5
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return dot_product / (norm_a * norm_b)
    
    def _generate_simple_embedding(self, text: str) -> List[float]:
        """Generate a simple embedding using word frequencies (placeholder)"""
        # This is a placeholder - in production use OpenAI embeddings or similar
        words = text.lower().split()
        embedding = [0.0] * 100  # 100-dim embedding
        
        for i, word in enumerate(words[:100]):
            embedding[i % 100] += hash(word) % 100 / 100.0
        
        # Normalize
        norm = sum(x * x for x in embedding) ** 0.5
        if norm > 0:
            embedding = [x / norm for x in embedding]
        
        return embedding


class RAGService:
    """
    Retrieval-Augmented Generation service for knowledge retrieval.
    """
    
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
    
    def query(
        self,
        query_text: str,
        context_type: ContextType,
        candidate_context: Optional[CandidateContext] = None,
        filters: Optional[Dict[str, Any]] = None,
        top_k: int = 5
    ) -> RAGResult:
        """
        Query the knowledge base and return relevant chunks.
        """
        
        # Generate query embedding
        query_embedding = self.vector_store._generate_simple_embedding(query_text)
        
        # Determine metadata filters based on context type
        metadata_filters = filters or {}
        
        if context_type == ContextType.QUESTION_GENERATION:
            metadata_filters["category"] = "technical"
        elif context_type == ContextType.EVALUATION:
            metadata_filters["category"] = "technical"
        elif context_type == ContextType.FOLLOW_UP:
            metadata_filters["category"] = "behavioral"
        
        # Search vector store
        results = self.vector_store.search(
            query_embedding,
            top_k=top_k,
            filter_metadata=metadata_filters if metadata_filters else None
        )
        
        chunks = [chunk for chunk, _ in results]
        relevance_scores = [score for _, score in results]
        
        # Generate citations
        citations = self._generate_citations(chunks)
        
        return RAGResult(
            chunks=chunks,
            relevance_scores=relevance_scores,
            citations=citations,
            context={
                "query": query_text,
                "context_type": context_type.value,
                "results_count": len(chunks)
            }
        )
    
    def _generate_citations(self, chunks: List[KnowledgeChunk]) -> List[Dict[str, str]]:
        """Generate citations for chunks"""
        citations = []
        for chunk in chunks:
            citations.append({
                "source_id": chunk.source_id,
                "source_type": chunk.source_type,
                "content_preview": chunk.content[:100] + "..." if len(chunk.content) > 100 else chunk.content
            })
        return citations
    
    def add_knowledge(
        self,
        content: str,
        source_type: str,
        source_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> KnowledgeChunk:
        """Add new knowledge to the store"""
        chunk = KnowledgeChunk(
            id=str(uuid.uuid4()),
            content=content,
            source_type=source_type,
            source_id=source_id,
            metadata=metadata or {},
            embedding=self.vector_store._generate_simple_embedding(content)
        )
        
        self.vector_store.add_chunk(chunk)
        return chunk


class MemoryService:
    """
    Memory service for storing and retrieving interview context.
    """
    
    def __init__(self):
        self.memories: Dict[str, InterviewMemory] = {}
    
    def create_memory(self, interview_id: str, candidate_id: str) -> InterviewMemory:
        """Create a new interview memory"""
        memory = InterviewMemory(
            interview_id=interview_id,
            candidate_id=candidate_id,
            session_context={
                "start_time": datetime.utcnow().isoformat(),
                "topics_discussed": [],
                "questions_asked": 0
            }
        )
        self.memories[interview_id] = memory
        return memory
    
    def get_memory(self, interview_id: str) -> Optional[InterviewMemory]:
        """Retrieve interview memory"""
        return self.memories.get(interview_id)
    
    def update_memory(
        self,
        interview_id: str,
        question_id: Optional[str] = None,
        topic: Optional[str] = None,
        response: Optional[str] = None,
        context_update: Optional[Dict[str, Any]] = None
    ) -> InterviewMemory:
        """Update interview memory with new information"""
        
        memory = self.memories.get(interview_id)
        if not memory:
            raise ValueError(f"No memory found for interview {interview_id}")
        
        if question_id:
            memory.question_history.append({
                "question_id": question_id,
                "topic": topic,
                "timestamp": datetime.utcnow().isoformat()
            })
            memory.session_context["questions_asked"] = len(memory.question_history)
        
        if topic:
            memory.current_topic = topic
            if topic not in memory.answered_topics:
                memory.answered_topics.append(topic)
            memory.session_context["topics_discussed"] = memory.answered_topics
        
        if response:
            # Add to context window
            memory.context_window.append({
                "role": "assistant",  # The AI's question
                "content": response,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Keep context window limited to last 10 items
            if len(memory.context_window) > 10:
                memory.context_window = memory.context_window[-10:]
        
        if context_update:
            memory.session_context.update(context_update)
        
        memory.updated_at = datetime.utcnow()
        
        return memory
    
    def get_context_window(self, interview_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent context window for conversation"""
        memory = self.memories.get(interview_id)
        if not memory:
            return []
        
        return memory.context_window[-limit:]
    
    def extract_entities(self, interview_id: str) -> Dict[str, Any]:
        """Extract and return entity information from memory"""
        memory = self.memories.get(interview_id)
        if not memory:
            return {}
        
        return memory.entity_memory
    
    def store_entity(
        self, 
        interview_id: str, 
        entity_type: str, 
        entity_value: Any,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Store an entity in memory"""
        memory = self.memories.get(interview_id)
        if not memory:
            raise ValueError(f"No memory found for interview {interview_id}")
        
        if entity_type not in memory.entity_memory:
            memory.entity_memory[entity_type] = []
        
        memory.entity_memory[entity_type].append({
            "value": entity_value,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat()
        })


class RecommendationEngine:
    """
    Generates hiring recommendations based on interview scores and context.
    """
    
    THRESHOLDS = {
        "strong_hire": 8.5,
        "hire": 7.0,
        "hold": 5.5,
        "reject": 0.0
    }
    
    def __init__(self, rag_service: RAGService, memory_service: MemoryService):
        self.rag_service = rag_service
        self.memory_service = memory_service
    
    def generate_recommendation(
        self,
        interview_id: str,
        overall_score: float,
        dimension_scores: Dict[str, float],
        candidate_context: CandidateContext,
        transcript_summary: str
    ) -> Recommendation:
        """Generate a hiring recommendation"""
        
        # Determine base decision
        decision = self._get_decision(overall_score)
        
        # Generate key strengths
        key_strengths = self._extract_strengths(dimension_scores, candidate_context)
        
        # Identify areas to investigate
        areas_to_investigate = self._identify_investigation_areas(
            dimension_scores, 
            candidate_context,
            transcript_summary
        )
        
        # Compare to role requirements
        comparison_to_role = self._compare_to_role(
            dimension_scores, 
            candidate_context
        )
        
        # Identify risk factors
        risk_factors = self._identify_risks(
            dimension_scores,
            overall_score,
            transcript_summary
        )
        
        # Calculate confidence
        confidence = self._calculate_confidence(
            dimension_scores,
            overall_score
        )
        
        # Generate reasoning
        reasoning = self._generate_reasoning(
            decision,
            overall_score,
            key_strengths,
            dimension_scores
        )
        
        return Recommendation(
            decision=decision,
            confidence=confidence,
            reasoning=reasoning,
            key_strengths=key_strengths,
            areas_to_investigate=areas_to_investigate,
            comparison_to_role=comparison_to_role,
            risk_factors=risk_factors
        )
    
    def _get_decision(self, score: float) -> str:
        """Determine decision based on score"""
        if score >= self.THRESHOLDS["strong_hire"]:
            return "STRONG_HIRE"
        elif score >= self.THRESHOLDS["hire"]:
            return "HIRE"
        elif score >= self.THRESHOLDS["hold"]:
            return "HOLD"
        else:
            return "REJECT"
    
    def _extract_strengths(
        self, 
        dimension_scores: Dict[str, float],
        candidate_context: CandidateContext
    ) -> List[str]:
        """Extract key strengths from scores"""
        strengths = []
        
        # Find dimensions with high scores
        for dimension, score in sorted(dimension_scores.items(), key=lambda x: x[1], reverse=True):
            if score >= 8.0:
                strengths.append(f"Strong {dimension.replace('_', ' ')} (score: {score:.1f})")
        
        # Add resume-based strengths
        if candidate_context.resume_skills:
            top_skills = candidate_context.resume_skills[:3]
            strengths.append(f"Relevant skills: {', '.join(top_skills)}")
        
        return strengths[:5]  # Limit to top 5
    
    def _identify_investigation_areas(
        self,
        dimension_scores: Dict[str, float],
        candidate_context: CandidateContext,
        transcript_summary: str
    ) -> List[str]:
        """Identify areas that need further investigation"""
        areas = []
        
        # Find weak dimensions
        for dimension, score in dimension_scores.items():
            if score < 6.0:
                areas.append(f"Follow up on {dimension.replace('_', ' ')} (score: {score:.1f})")
        
        # Use RAG to find role-specific gaps
        rag_result = self.rag_service.query(
            f"What competencies are important for {candidate_context.seniority_level} level?",
            ContextType.RECOMMENDATION,
            candidate_context
        )
        
        if rag_result.chunks:
            areas.append(f"Verify alignment with company values and culture")
        
        return areas[:5]  # Limit to top 5
    
    def _compare_to_role(
        self,
        dimension_scores: Dict[str, float],
        candidate_context: CandidateContext
    ) -> Dict[str, float]:
        """Compare candidate to role requirements"""
        # Map dimensions to role requirements
        role_mapping = {
            "technical": 0.8 if candidate_context.seniority_level in ["senior", "lead", "principal"] else 0.6,
            "communication": 0.6,
            "problem_solving": 0.7,
            "leadership": 0.5 if candidate_context.seniority_level in ["senior", "lead"] else 0.3,
        }
        
        comparison = {}
        for dimension, weight in role_mapping.items():
            score = dimension_scores.get(dimension, 5.0)
            required = weight * 10
            comparison[dimension] = min(1.0, score / required) if required > 0 else 0.0
        
        return comparison
    
    def _identify_risks(
        self,
        dimension_scores: Dict[str, float],
        overall_score: float,
        transcript_summary: str
    ) -> List[str]:
        """Identify risk factors"""
        risks = []
        
        # Low scores indicate risk
        for dimension, score in dimension_scores.items():
            if score < 5.0:
                risks.append(f"Weak {dimension.replace('_', ' ')} may indicate fit issues")
        
        # Check for inconsistent performance
        if dimension_scores:
            std_dev = self._calculate_std_dev(list(dimension_scores.values()))
            if std_dev > 2.0:
                risks.append("Inconsistent performance across dimensions")
        
        # Low overall score
        if overall_score < 6.0:
            risks.append("Overall score below recommended threshold")
        
        return risks
    
    def _calculate_std_dev(self, values: List[float]) -> float:
        """Calculate standard deviation"""
        if not values:
            return 0.0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance ** 0.5
    
    def _calculate_confidence(
        self,
        dimension_scores: Dict[str, float],
        overall_score: float
    ) -> float:
        """Calculate confidence in the recommendation"""
        # Higher confidence when:
        # 1. More dimensions are scored
        # 2. Less variance in scores
        # 3. Score is clear (very high or very low)
        
        dimension_count = len(dimension_scores)
        if dimension_count == 0:
            return 0.5
        
        std_dev = self._calculate_std_dev(list(dimension_scores.values()))
        
        # Base confidence on dimension count
        base_confidence = min(0.7, dimension_count * 0.1 + 0.3)
        
        # Reduce confidence for high variance
        variance_penalty = min(0.2, std_dev * 0.05)
        
        # Boost confidence for clear decisions
        clarity_bonus = 0.0
        if overall_score >= 8.5 or overall_score < 5.0:
            clarity_bonus = 0.1
        
        confidence = base_confidence - variance_penalty + clarity_bonus
        return max(0.5, min(0.95, confidence))
    
    def _generate_reasoning(
        self,
        decision: str,
        overall_score: float,
        key_strengths: List[str],
        dimension_scores: Dict[str, float]
    ) -> str:
        """Generate human-readable reasoning"""
        
        decision_labels = {
            "STRONG_HIRE": "Strong Hire",
            "HIRE": "Hire",
            "HOLD": "Hold",
            "REJECT": "Reject"
        }
        
        top_dimensions = sorted(
            dimension_scores.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:2]
        
        dimension_names = {
            "technical": "technical skills",
            "communication": "communication",
            "problem_solving": "problem-solving",
            "leadership": "leadership",
            "confidence": "confidence",
            "domain_knowledge": "domain knowledge"
        }
        
        dims_str = " and ".join([
            f"{dimension_names.get(d, d)} ({s:.1f})" 
            for d, s in top_dimensions
        ])
        
        reasoning = f"{decision_labels.get(decision, decision)} recommendation with an overall score of {overall_score:.1f}/10. "
        reasoning += f"Candidate demonstrated particularly strong {dims_str}. "
        
        if key_strengths:
            reasoning += f"Key strengths include: {'; '.join(key_strengths[:3])}."
        
        return reasoning


class IntelligenceLayer:
    """
    Main intelligence layer combining RAG, Memory, and Recommendations.
    """
    
    def __init__(self):
        self.vector_store = VectorStore()
        self.rag_service = RAGService(self.vector_store)
        self.memory_service = MemoryService()
        self.recommendation_engine = RecommendationEngine(
            self.rag_service, 
            self.memory_service
        )
    
    def get_rag_service(self) -> RAGService:
        return self.rag_service
    
    def get_memory_service(self) -> MemoryService:
        return self.memory_service
    
    def get_recommendation_engine(self) -> RecommendationEngine:
        return self.recommendation_engine


# Singleton instance
_intelligence_layer: Optional[IntelligenceLayer] = None

def get_intelligence_layer() -> IntelligenceLayer:
    global _intelligence_layer
    if _intelligence_layer is None:
        _intelligence_layer = IntelligenceLayer()
    return _intelligence_layer
