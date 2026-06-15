# AI Interviewer Platform - Technical Specification

## Overview

A production-grade AI-powered interview platform designed to feel like a real recruiting solution, not a demo app. The system encompasses 9 interconnected subsystems with enterprise security, intelligent evaluation, and premium candidate experience.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │ Interview UI    │  │ Recruiter Portal │  │ Candidate Portal      │ │
│  │ (Next.js)       │  │ (Next.js)        │  │ (Next.js)              │ │
│  └────────┬────────┘  └────────┬─────────┘  └───────────┬────────────┘ │
└───────────┼────────────────────┼─────────────────────────┼───────────────┘
            │                    │                         │
            ▼                    ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│                    (FastAPI + WebSocket + REST)                          │
└─────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CORE SERVICES                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ AI Interview │  │  Evaluation  │  │  Intelligence│  │  Security   │ │
│  │   Engine     │  │   Engine     │  │    Layer     │  │  Service    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  PostgreSQL  │  │    Redis     │  │   Vector DB  │  │  S3/R2      │ │
│  │  (Primary)   │  │  (Cache/Queue)│ │  (Embeddings)│  │  (Storage)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture (Next.js + Tailwind)

### 2.1 Project Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── otp/
│   ├── (candidate)/
│   │   ├── dashboard/
│   │   ├── interview/[id]/
│   │   └── profile/
│   ├── (recruiter)/
│   │   ├── dashboard/
│   │   ├── candidates/
│   │   ├── interviews/
│   │   ├── analytics/
│   │   └── settings/
│   └── api/
├── components/
│   ├── interview/
│   │   ├── VideoCapture.tsx
│   │   ├── AudioCapture.tsx
│   │   ├── ChatMode.tsx
│   │   ├── ScreenShare.tsx
│   │   ├── QuestionDisplay.tsx
│   │   ├── TranscriptOverlay.tsx
│   │   └── Controls.tsx
│   ├── recruiter/
│   │   ├── PipelineBoard.tsx
│   │   ├── CandidateCard.tsx
│   │   ├── ScoreCard.tsx
│   │   └── Analytics.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       └── ProgressBar.tsx
├── hooks/
│   ├── useMediaDevices.ts
│   ├── useWebRTC.ts
│   ├── useTranscription.ts
│   └── useInterview.ts
├── lib/
│   ├── api.ts
│   ├── websocket.ts
│   └── utils.ts
└── stores/
    └── interviewStore.ts
```

### 2.2 Theme System

**Dark Mode Colors:**
```css
--background: #0a0a0f;
--surface: #13131a;
--surface-elevated: #1a1a24;
--border: #2a2a3a;
--text-primary: #f4f4f5;
--text-secondary: #a1a1aa;
--accent-primary: #6366f1;
--accent-success: #22c55e;
--accent-warning: #f59e0b;
--accent-danger: #ef4444;
```

**Light Mode Colors:**
```css
--background: #fafafa;
--surface: #ffffff;
--surface-elevated: #f4f4f5;
--border: #e4e4e7;
--text-primary: #18181b;
--text-secondary: #71717a;
--accent-primary: #4f46e5;
--accent-success: #16a34a;
--accent-warning: #d97706;
--accent-danger: #dc2626;
```

### 2.3 Accessibility Requirements

- WCAG 2.1 AA compliance
- Full keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Screen reader support (ARIA labels)
- High contrast mode support
- Captions for video content
- Reduced motion option

---

## 3. AI Interview Engine

### 3.1 Interview Orchestrator

```python
# Interview States
class InterviewState(Enum):
    SETUP = "setup"           # Device check, intro
    RUNNING = "running"       # Active interview
    PAUSED = "paused"         # Candidate paused
    FOLLOW_UP = "follow_up"   # Diving deeper
    TRANSITION = "transition" # Between topics
    WRAP_UP = "wrap_up"       # Final questions
    COMPLETED = "completed"   # Interview done

# Question Types
class QuestionType(Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SITUATIONAL = "situational"
    CASE_STUDY = "case_study"
    OPEN_ENDED = "open_ended"

# Orchestrator Config
interface InterviewConfig:
    job_description: str
    candidate_resume: str
    seniority_level: SeniorityLevel
    interview_duration: int  # minutes
    question_categories: List[QuestionCategory]
    difficulty_curve: DifficultyCurve
    follow_up_aggressiveness: float  # 0-1
    pause_policy: PausePolicy
```

### 3.2 Question Generator

**Input Processing:**
```python
class QuestionInput:
    job_description: str
    resume_skills: List[str]
    experience_years: int
    target_company: str
    role_level: SeniorityLevel

class GeneratedQuestion:
    question_id: str
    content: str
    type: QuestionType
    category: str
    difficulty: DifficultyLevel
    expected_duration: int  # seconds
    follow_up_prompts: List[str]
    evaluation_criteria: List[str]
    evidence_required: List[str]
```

**Question Flow Logic:**
```
1. Parse job description → extract key competencies
2. Match resume skills → identify strong/weak areas
3. Generate question sequence based on difficulty curve
4. For each question:
   - Track response quality
   - If strong answer → ask follow-up (probe deeper)
   - If weak answer → simplify follow-up
   - If inconsistent → ask clarification
   - If off-topic → redirect gently
5. Adjust timing dynamically based on responses
```

### 3.3 Follow-up Logic Engine

```python
class FollowUpEngine:
    def should_follow_up(self, response: Response) -> bool:
        # Check depth, clarity, examples
        depth_score = self.assess_depth(response)
        return depth_score < threshold
    
    def generate_follow_up(self, question: Question, 
                          response: Response) -> FollowUp:
        if response.is_shallow:
            return self.simplify_and_probe(response)
        elif response.has_inconsistency:
            return self.clarify_inconsistency(response)
        elif response.is_strong:
            return self.deep_dive(response)
        else:
            return self.alternative_angle(question)
```

---

## 4. Evaluation System

### 4.1 Scoring Dimensions

```python
class ScoreDimensions:
    COMMUNICATION = "communication"      # 0-10
    TECHNICAL = "technical"              # 0-10
    PROBLEM_SOLVING = "problem_solving"  # 0-10
    CONFIDENCE = "confidence"            # 0-10
    LEADERSHIP = "leadership"            # 0-10
    DOMAIN_KNOWLEDGE = "domain_knowledge"  # 0-10

class ScoreEvidence:
    dimension: ScoreDimensions
    score: float
    transcript_segment: str
    timestamp_start: float
    timestamp_end: float
    explanation: str
    confidence: float  # AI confidence in this score
```

### 4.2 Rubric System

```python
class Rubric:
    id: str
    name: str
    role_type: str
    weights: Dict[ScoreDimensions, float]
    thresholds: ScoreThresholds
    criteria: List[ScoringCriteria]

class ScoreThresholds:
    strong_hire: float  # >= 8.5
    hire: float         # >= 7.0
    hold: float         # >= 5.5
    reject: float       # < 5.5

# Example Rubric for Senior Engineer
senior_engineer_rubric = Rubric(
    name="Senior Software Engineer",
    weights={
        technical: 0.35,
        problem_solving: 0.25,
        communication: 0.15,
        leadership: 0.15,
        domain_knowledge: 0.10
    },
    thresholds=ScoreThresholds(8.5, 7.0, 5.5, 5.5)
)
```

### 4.3 Evidence-Based Scoring

Every score MUST include:
```json
{
  "dimension": "technical",
  "score": 7.5,
  "evidence": {
    "transcript": "I implemented a distributed cache using Redis...",
    "timestamp_start": 125.5,
    "timestamp_end": 142.3,
    "keywords_matched": ["Redis", "distributed cache", "consistency"],
    "code_concepts_detected": ["CAP theorem", "eventual consistency"]
  },
  "explanation": "Candidate demonstrated solid understanding...",
  "confidence": 0.89
}
```

---

## 5. Intelligence Layer (RAG + Memory)

### 5.1 RAG System

```python
class KnowledgeBase:
    sources: List[KnowledgeSource]
    
    # Source Types
    - job_descriptions: List[JobDescription]
    - company_docs: List[CompanyDocument]
    - hiring_criteria: List[HiringCriteria]
    - interview_guides: List[InterviewGuide]
    - previous_successes: List[SuccessfulHire]

class RAGQuery:
    query: str
    context_type: str  # "question_generation", "evaluation", "follow_up"
    candidate_context: CandidateContext
    filters: Dict

class RAGResult:
    chunks: List[RetrievedChunk]
    relevance_scores: List[float]
    citations: List[Citation]
```

### 5.2 Memory System

```python
class InterviewMemory:
    candidate_id: str
    interview_id: str
    session_context: SessionContext
    question_history: List[QuestionAttempt]
    current_topic: str
    answered_topics: List[str]
    pending_questions: List[str]
    context_window: List[Message]  # Last N messages for context

class SessionContext:
    start_time: datetime
    duration_target: int
    current_phase: InterviewPhase
    difficulty_current: float
    energy_level: float  # Candidate fatigue tracking
```

### 5.3 Recommendation Engine

```python
class Recommendation:
    decision: Decision  # HIRE, STRONG_HIRE, HOLD, REJECT
    confidence: float
    reasoning: str
    areas_to_investigate: List[str]
    comparison_to_role: ComparisonAnalysis
    risk_factors: List[RiskFactor]

class ComparisonAnalysis:
    vs_required_skills: Dict[str, float]
    vs_nice_to_have: Dict[str, float]
    vs_company_values: Dict[str, float]
    percentile_estimate: float

# Thresholds
RECOMMENDATION_THRESHOLDS = {
    "strong_hire": 8.5,
    "hire": 7.0,
    "hold": 5.5,
    "reject": 0.0
}
```

---

## 6. Recruiter Dashboard

### 6.1 Candidate Pipeline

```
Kanban Board Layout:
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   Applied   │  Screening  │  Interview  │   Review    │   Hired     │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│  Candidate  │  Candidate  │  Candidate  │  Candidate  │  Candidate  │
│  Cards (25) │  Cards (15) │  Cards (8)  │  Cards (5)  │  Cards (2)  │
│             │             │             │             │             │
│  Drag &     │  Drag &     │  View Score │  Drag &     │  Drag &     │
│  Drop       │  Drop       │  & Notes    │  Drop       │  Drop       │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### 6.2 Analytics Dashboard

**Metrics:**
- Funnel conversion rates at each stage
- Interview completion rate
- Average interview duration vs target
- Score distribution histogram
- Time-to-hire trend
- Interview quality score (based on follow-up depth)
- No-show rate
- Candidate satisfaction NPS

### 6.3 Candidate Profile View

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────┐  Sarah Chen                               ⭐ 8.2/10  │
│  │ IMG  │  Senior Software Engineer                 🟢 HIRE   │
│  └──────┘  Applied: Dec 15, 2024                                    │
│            Google | Meta | Amazon                                  │
├─────────────────────────────────────────────────────────────────┤
│  [Overview] [Transcript] [Scores] [Comparisons] [History]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Interview Summary ────────────────────────────────────┐   │
│  │ Duration: 45 min | Questions: 12 | Score: 8.2          │   │
│  │ Technical: 8.5 | Communication: 7.8 | Problem Solving: 8.0 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Key Strengths ─────────────────────────────────────────┐   │
│  │ • Strong system design skills                          │   │
│  │ • Excellent communication of complex concepts           │   │
│  │ • Real-world experience with distributed systems        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Areas to Investigate ──────────────────────────────────┐   │
│  │ • Limited experience with machine learning              │   │
│  │ • Could not recall specific performance optimization    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [▶ Watch Recording] [📄 Export PDF] [📊 Export CSV]           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Security Subsystem

### 7.1 Authentication

```python
class AuthProvider:
    # Primary: Email OTP
    email_otp:
        - 6-digit code
        - 5-minute expiry
        - 3 attempts max
        - Rate limiting: 5 OTPs per hour
    
    # Secondary: SSO
    supported_providers:
        - Google Workspace
        - Microsoft Entra ID
        - Okta
    
    # Role-Based Access Control
    roles:
        - ADMIN: Full system access
        - RECRUITER: Manage candidates, view interviews
        - HIRING_MANAGER: View assigned candidates, scores
        - CANDIDATE: Own interview only
```

### 7.2 Anti-Cheat Measures

```python
class AntiCheatMonitor:
    tab_switch_detection:
        - Track visibility changes
        - Log每次离开tab
        - Alert after 3 switches or 30s cumulative
        - Include in candidate report
    
    face_detection:
        - Require single face in frame
        - Detect multiple faces
        - Alert on prolonged absence of face
        - Screenshot on anomaly
    
    audio_analysis:
        - Detect AI-generated speech patterns
        - Voice similarity to known recordings
        - Background noise anomalies
    
    behavior_monitoring:
        - Copy/paste detection (disabled in interview mode)
        - Browser dev tools detection
        - Screen recording software detection
        - Keyboard pattern analysis
```

### 7.3 Data Protection

```python
class DataProtection:
    # Recording Encryption
    - AES-256 encryption at rest
    - Per-interview encryption keys
    - Key rotation policy
    
    # Transcript Security
    - Encrypted in transit (TLS 1.3)
    - Encrypted at rest
    - Signed URLs for playback (15-min expiry)
    
    # Audit Logging
    - All access logged with:
        - Timestamp
        - User ID
        - Action
        - IP Address
        - User Agent
    - Immutable logs
    - 7-year retention
```

---

## 8. API Design

### 8.1 REST Endpoints

```python
# Authentication
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/otp/send
POST   /api/v1/auth/otp/verify
POST   /api/v1/auth/sso/google
POST   /api/v1/auth/sso/azure
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

# Candidates
GET    /api/v1/candidates
GET    /api/v1/candidates/:id
POST   /api/v1/candidates
PUT    /api/v1/candidates/:id
DELETE /api/v1/candidates/:id
GET    /api/v1/candidates/:id/score
GET    /api/v1/candidates/:id/transcript

# Interviews
GET    /api/v1/interviews
GET    /api/v1/interviews/:id
POST   /api/v1/interviews
PUT    /api/v1/interviews/:id
POST   /api/v1/interviews/:id/start
POST   /api/v1/interviews/:id/pause
POST   /api/v1/interviews/:id/resume
POST   /api/v1/interviews/:id/end
GET    /api/v1/interviews/:id/stream  # WebSocket

# Questions
GET    /api/v1/questions/templates
POST   /api/v1/questions/generate
GET    /api/v1/questions/:id

# Evaluation
POST   /api/v1/evaluate/response
GET    /api/v1/evaluate/:interview_id/summary
GET    /api/v1/evaluate/:interview_id/detailed

# Dashboard
GET    /api/v1/dashboard/stats
GET    /api/v1/dashboard/pipeline
GET    /api/v1/dashboard/analytics

# Reports
GET    /api/v1/reports/:interview_id/pdf
GET    /api/v1/reports/:interview_id/csv
```

### 8.2 WebSocket Events

```python
# Interview Streaming
WS /ws/interview/:interview_id

# Server → Client Events
- question:new
- question:follow_up
- transcript:segment
- score:update
- timing:update
- interview:paused
- interview:resumed
- interview:ended
- warning:tab_switch
- warning:multiple_faces

# Client → Server Events
- response:start
- response:segment
- response:end
- pause:request
- resume:request
- device:status
```

---

## 9. Database Schema

### 9.1 Core Entities

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role user_role NOT NULL,
    full_name VARCHAR(255),
    company_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Candidates
CREATE TABLE candidates (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    resume_url TEXT,
    resume_parsed JSONB,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Interviews
CREATE TABLE interviews (
    id UUID PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id),
    job_description_id UUID,
    recruiter_id UUID REFERENCES users(id),
    status interview_status DEFAULT 'pending',
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration_target INT,  -- minutes
    duration_actual INT,
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Questions
CREATE TABLE questions (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id),
    content TEXT NOT NULL,
    type question_type,
    category VARCHAR(100),
    difficulty INT,
    sequence_order INT,
    expected_duration INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Responses
CREATE TABLE responses (
    id UUID PRIMARY KEY,
    question_id UUID REFERENCES questions(id),
    content TEXT,
    audio_url TEXT,
    video_url TEXT,
    transcript TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Scores
CREATE TABLE scores (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id),
    dimension score_dimension,
    score DECIMAL(3,1),
    evidence JSONB,
    explanation TEXT,
    confidence DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Recommendations
CREATE TABLE recommendations (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id),
    decision recommendation_decision,
    confidence DECIMAL(3,2),
    reasoning TEXT,
    areas_to_investigate JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 10. AI Stack Configuration

### 10.1 OpenAI Integration

```python
# Models Used
GPT_4O = "gpt-4o"           # Main interview conductor
GPT_4O_MINI = "gpt-4o-mini" # Quick evaluations
WHISPER = "whisper-1"       # Transcription

# System Prompts
INTERVIEW_CONDUCTOR_PROMPT = """
You are an expert technical interviewer conducting a structured interview.
- Ask one question at a time
- Wait for complete response before follow-up
- Adapt difficulty based on candidate performance
- Maintain professional, encouraging tone
- Focus on practical problem-solving over textbook answers
- Take notes on specific examples mentioned
"""

EVALUATOR_PROMPT = """
You are an expert interviewer evaluator. For each response:
1. Assess depth (superficial vs thorough)
2. Identify specific examples or lack thereof
3. Note technical accuracy
4. Evaluate communication clarity
5. Provide evidence-based scoring
"""
```

### 10.2 Embeddings

```python
# Vector Search
EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_DIMENSIONS = 3072

# Collections
- job_descriptions: 1536 dims
- candidate_resumes: 1536 dims
- interview_transcripts: 1536 dims
- company_knowledge: 1536 dims
```

---

## 11. Premium Features

### 11.1 AI Interviewer Personalities

```python
class InterviewerPersona:
    id: str
    name: str
    description: str
    system_prompt_additions: str
    tone: str  # "formal", "casual", "supportive"
    follow_up_style: str  # "aggressive", "moderate", "minimal"
    voice_settings: VoiceSettings

PERSONAS = [
    InterviewerPersona(
        id="professional",
        name="Professional Sarah",
        description="Classic professional interviewer",
        tone="formal",
        follow_up_style="moderate"
    ),
    InterviewerPersona(
        id="supportive",
        name="Encouraging Mike",
        description="Supportive, great for junior roles",
        tone="casual",
        follow_up_style="minimal"
    ),
    InterviewerPersona(
        id="technical",
        name="Technical Alex",
        description="Deep technical focus, challenging",
        tone="formal",
        follow_up_style="aggressive"
    )
]
```

### 11.2 Interview Replay

```python
class InterviewReplay:
    interview_id: UUID
    video_url: str
    transcript_with_timestamps: List[TranscriptSegment]
    score_markers: List[ScoreMarker]
    question_markers: List[QuestionMarker]
    
    # Interactive features
    - Click transcript to jump to video position
    - See AI evaluation at each point
    - Add timestamped notes
    - Share specific moments
```

### 11.3 Team Calibration Mode

```python
class CalibrationSession:
    id: UUID
    interview_id: UUID
    participants: List[UUID>  # Hiring team
    current_timestamp: float
    individual_scores: Dict[UUID, List[Score]]
    discussion_enabled: bool
    
    # Features
    - Side-by-side scoring
    - Discussion threads at timestamps
    - Anonymous voting on decision
    - Final calibrated score
```

---

## 12. MVP Implementation Order

### Phase 1: Core Interview (Week 1-2)
1. [x] Project scaffolding
2. [x] Auth system (email OTP)
3. [x] Basic interview UI (video + chat)
4. [x] Question generation (simple)
5. [x] Basic transcription

### Phase 2: Evaluation (Week 3-4)
6. [x] Scoring engine
7. [x] Evidence-based scoring
8. [x] Basic recommendations
9. [x] Transcript display

### Phase 3: Dashboard (Week 5-6)
10. [x] Recruiter login
11. [x] Candidate pipeline view
12. [x] Score cards
13. [x] Basic analytics

### Phase 4: Security (Week 7)
14. [x] Tab switch detection
15. [x] Face detection
16. [x] Audit logging
17. [x] Encrypted storage

### Phase 5: Integrations (Week 8)
18. [x] Greenhouse/Lever sync
19. [x] Calendar integration
20. [x] Video platform integration

### Phase 6: Analytics (Week 9)
21. [x] Full analytics dashboard
22. [x] Export functionality
23. [x] Custom reports

---

## 13. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=sk-...
WHISPER_API_KEY=sk-...

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=32-byte-key
OTP_SECRET=otp-secret

# Storage
S3_BUCKET=interview-recordings
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# Authentication
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...

# Monitoring
POSTHOG_API_KEY=...
```

---

## 14. File Organization

```
/workspace/project/Ai-interview-tool-/
├── SPEC.md
├── README.md
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── stores/
├── backend/
│   ├── requirements.txt
│   ├── main.py
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   └── schemas/
│   └── tests/
└── docker-compose.yml
```

---

## 15. Quality Standards

- **Code Coverage**: >80% for core services
- **API Latency**: <200ms p95 for REST, <100ms for WebSocket
- **Security**: No critical vulnerabilities (pen test)
- **Accessibility**: WCAG 2.1 AA
- **Performance**: Lighthouse score >90
- **Error Rate**: <0.1% for production

