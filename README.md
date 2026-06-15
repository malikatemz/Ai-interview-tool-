# AI Interview Platform

A production-grade, enterprise-ready AI-powered interview platform designed to feel like a real recruiting solution, not a demo app.

## 🌟 Features

### 1. Candidate Experience Layer
- **Video + Audio Capture**: High-quality WebRTC streaming with adaptive bitrate
- **Text Chat Mode**: Low bandwidth alternative with full functionality
- **Screen Sharing**: Optional feature for technical demonstrations
- **Resume Upload + Parsing**: AI-powered resume analysis
- **Progress Bar + Estimated Time**: Clear interview progress tracking
- **Dark/Light Mode**: Full theme support with system preference detection
- **Accessibility**: WCAG 2.1 AA compliant, keyboard navigation, captions

### 2. AI Interview Engine
- **Dynamic Question Flow**: Adapts based on candidate responses
- **Difficulty Adaptation**: Adjusts question complexity in real-time
- **Context Memory**: Maintains conversation context throughout interview
- **Follow-up Logic**: Intelligent probing based on response quality

### 3. Evaluation System
- **6-Dimension Scoring**: Communication, Technical, Problem Solving, Confidence, Leadership, Domain Knowledge
- **Evidence-Based Scoring**: Every score includes transcript excerpts and timestamps
- **Role-Specific Rubrics**: Weighted scoring based on job requirements
- **Transparent Recommendations**: Clear reasoning with confidence levels

### 4. Intelligence Layer (RAG + Memory)
- **Knowledge Retrieval**: Context-aware question generation
- **Interview Memory**: Persistent context across sessions
- **Recommendation Engine**: Hire/Strong Hire/Hold/Reject with detailed reasoning

### 5. Recruiter Dashboard
- **Pipeline View**: Kanban board with drag-and-drop
- **Analytics**: Funnel conversion, score distribution, time-to-hire
- **Export**: PDF reports and CSV data export

### 6. Security Subsystem
- **Email OTP + SSO**: Multi-factor authentication
- **Anti-Cheat**: Tab switch detection, face detection, AI speech detection
- **Data Protection**: AES-256 encryption, audit logs, signed URLs

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │ Interview UI    │  │ Recruiter Portal │  │ Candidate Portal      │ │
│  │ (Next.js)      │  │ (Next.js)        │  │ (Next.js)              │ │
│  └────────┬────────┘  └────────┬─────────┘  └───────────┬────────────┘ │
└───────────┼────────────────────┼─────────────────────────┼───────────────┘
            │                    │                         │
            ▼                    ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│                    (FastAPI + WebSocket + REST)                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom theme
- **State**: Zustand for interview state management
- **Real-time**: Socket.io client

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL + Redis
- **AI**: OpenAI GPT-4o, Whisper
- **Security**: JWT, pyOTP, bcrypt

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (for development)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/malikatemz/Ai-interview-tool-.git
cd Ai-interview-tool-

# Start with Docker Compose
docker-compose up

# Or run individually:

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Environment Variables

```bash
# Backend (.env)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/interview_db
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=32-byte-key

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

## 📁 Project Structure

```
Ai-interview-tool-/
├── SPEC.md                    # Technical specification
├── README.md                  # This file
├── docker-compose.yml         # Container orchestration
├── frontend/
│   ├── app/                  # Next.js App Router pages
│   │   ├── (candidate)/      # Candidate-facing routes
│   │   ├── (recruiter)/      # Recruiter-facing routes
│   │   └── api/              # API routes (if needed)
│   ├── components/
│   │   ├── interview/        # Interview-specific components
│   │   ├── recruiter/         # Dashboard components
│   │   └── ui/               # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and API clients
│   └── stores/               # Zustand state stores
└── backend/
    ├── app/
    │   ├── api/v1/           # API route handlers
    │   ├── models/           # SQLAlchemy models
    │   ├── schemas/           # Pydantic schemas
    │   ├── services/          # Business logic
    │   │   ├── interview_engine.py   # AI interview logic
    │   │   ├── evaluation.py          # Scoring engine
    │   │   ├── intelligence.py        # RAG + Memory
    │   │   └── security.py            # Auth + Anti-cheat
    │   └── main.py            # FastAPI application
    ├── tests/                # Test files
    └── requirements.txt      # Python dependencies
```

## 🔐 Security Features

### Authentication
- Email OTP with 6-digit codes (5-min expiry)
- SSO support (Google, Microsoft Entra, Okta)
- Role-based access control (Admin, Recruiter, Hiring Manager, Candidate)

### Anti-Cheat
- Tab switch detection with logging
- Multiple face detection in video
- AI-generated speech pattern detection
- Browser integrity checks
- Copy-paste monitoring (disabled during interview)

### Data Protection
- AES-256 encryption at rest
- TLS 1.3 in transit
- Signed URLs for recordings (15-min expiry)
- Immutable audit logs

## 📊 Evaluation Dimensions

| Dimension | Weight (Senior Engineer) | Description |
|-----------|-------------------------|-------------|
| Technical | 35% | Code quality, system design, best practices |
| Problem Solving | 25% | Approach, decomposition, trade-offs |
| Communication | 15% | Clarity, articulation, listening |
| Leadership | 15% | Influence, mentorship, vision |
| Domain Knowledge | 10% | Industry knowledge, trends |

## 🎯 Recommendation Thresholds

| Decision | Score Range | Confidence |
|----------|-------------|------------|
| Strong Hire | ≥ 8.5 | High |
| Hire | 7.0 - 8.5 | Medium-High |
| Hold | 5.5 - 7.0 | Medium |
| Reject | < 5.5 | Varies |

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/otp/send` - Send OTP
- `POST /api/v1/auth/otp/verify` - Verify OTP

### Candidates
- `GET /api/v1/candidates` - List candidates
- `POST /api/v1/candidates` - Create candidate
- `GET /api/v1/candidates/:id` - Get candidate
- `GET /api/v1/candidates/:id/score` - Get interview score

### Interviews
- `GET /api/v1/interviews` - List interviews
- `POST /api/v1/interviews` - Create interview
- `POST /api/v1/interviews/:id/start` - Start interview
- `POST /api/v1/interviews/:id/pause` - Pause interview
- `POST /api/v1/interviews/:id/end` - End interview

### WebSocket Events
- `question:new` - New question presented
- `transcript:segment` - New transcript segment
- `score:update` - Real-time score update
- `warning:tab_switch` - Tab switch detected

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v --cov=app

# Frontend tests
cd frontend
npm test
```

## 📈 Performance Targets

- API Latency: < 200ms p95 (REST), < 100ms (WebSocket)
- Interview Recording: 99.9% uptime
- Error Rate: < 0.1% production
- Accessibility: WCAG 2.1 AA compliance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ by the AI Interview Team
