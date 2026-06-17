from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import json

from app.api.v1 import auth, candidates, interviews, questions, evaluations, dashboard, reports, qa_loop
from app.services.interview_engine import InterviewOrchestrator, QuestionGenerator, FollowUpEngine, InterviewContext, InterviewState
from app.services.evaluation import ScoringEngine, Rubric, EvidenceCollector, ScoreDimension
from app.services.intelligence import get_intelligence_layer, ContextType


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting AI Interview Platform API...")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="AI Interview Platform",
    description="Enterprise-grade AI-powered interview platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["Candidates"])
app.include_router(interviews.router, prefix="/api/v1/interviews", tags=["Interviews"])
app.include_router(questions.router, prefix="/api/v1/questions", tags=["Questions"])
app.include_router(evaluations.router, prefix="/api/v1/evaluate", tags=["Evaluations"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(qa_loop.router, prefix="/api/v1", tags=["Q&A Loop"])


# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "AI Interview Platform API",
        "docs": "/docs",
        "version": "1.0.0"
    }


# WebSocket endpoint for real-time interview
class InterviewConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.interview_states: dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, interview_id: str):
        await websocket.accept()
        self.active_connections[interview_id] = websocket

    def disconnect(self, interview_id: str):
        if interview_id in self.active_connections:
            del self.active_connections[interview_id]
        if interview_id in self.interview_states:
            del self.interview_states[interview_id]

    async def send_json(self, interview_id: str, data: dict):
        if interview_id in self.active_connections:
            await self.active_connections[interview_id].send_json(data)

    def set_state(self, interview_id: str, state: dict):
        self.interview_states[interview_id] = state

    def get_state(self, interview_id: str) -> Optional[dict]:
        return self.interview_states.get(interview_id)


manager = InterviewConnectionManager()


@app.websocket("/ws/interview/{interview_id}")
async def websocket_interview(websocket: WebSocket, interview_id: str):
    await manager.connect(websocket, interview_id)
    
    # Initialize interview state
    manager.set_state(interview_id, {
        "status": "running",
        "current_question": None,
        "responses": [],
        "warnings": []
    })
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            event = data.get("event")
            payload = data.get("data", {})
            
            if event == "response:segment":
                # Handle response segment - real-time transcription
                await manager.send_json(interview_id, {
                    "event": "transcript:segment",
                    "data": {
                        "id": str(uuid.uuid4()),
                        "speaker": "candidate",
                        "text": payload.get("text", ""),
                        "start_time": payload.get("timestamp", 0),
                        "end_time": datetime.utcnow().timestamp()
                    }
                })
            
            elif event == "response:end":
                # Handle response completion
                await manager.send_json(interview_id, {
                    "event": "evaluation:complete",
                    "data": {
                        "question_id": manager.get_state(interview_id).get("current_question"),
                        "evaluation": {
                            "depth_score": 7.5,
                            "clarity_score": 8.0,
                            "overall_score": 7.8
                        }
                    }
                })
            
            elif event == "pause:request":
                manager.set_state(interview_id, {
                    **manager.get_state(interview_id),
                    "status": "paused"
                })
                await manager.send_json(interview_id, {
                    "event": "interview:paused",
                    "data": {"reason": payload.get("reason")}
                })
            
            elif event == "resume:request":
                manager.set_state(interview_id, {
                    **manager.get_state(interview_id),
                    "status": "running"
                })
                await manager.send_json(interview_id, {
                    "event": "interview:resumed",
                    "data": {}
                })
            
            elif event == "tab:switch":
                # Handle tab switch warning
                warnings = manager.get_state(interview_id).get("warnings", [])
                warnings.append({
                    "type": "tab_switch",
                    "timestamp": datetime.utcnow().timestamp()
                })
                manager.set_state(interview_id, {
                    **manager.get_state(interview_id),
                    "warnings": warnings
                })
                await manager.send_json(interview_id, {
                    "event": "warning:tab_switch",
                    "data": {"message": "Tab switch detected"}
                })
            
    except WebSocketDisconnect:
        manager.disconnect(interview_id)
    except Exception as e:
        await manager.send_json(interview_id, {
            "event": "error",
            "data": {"message": str(e)}
        })
        manager.disconnect(interview_id)


# Interview control endpoints
@app.post("/api/v1/interviews/{interview_id}/start")
async def start_interview(interview_id: str):
    """Start an interview session"""
    # This would verify auth and update database
    manager.set_state(interview_id, {
        **(manager.get_state(interview_id) or {}),
        "status": "running",
        "started_at": datetime.utcnow().isoformat()
    })
    
    # Send first question
    await manager.send_json(interview_id, {
        "event": "question:new",
        "data": {
            "question_id": str(uuid.uuid4()),
            "content": "Can you tell me about your experience with system design?",
            "type": "technical",
            "expected_duration": 180
        }
    })
    
    return {"status": "started", "interview_id": interview_id}


@app.post("/api/v1/interviews/{interview_id}/pause")
async def pause_interview(interview_id: str):
    """Pause an interview"""
    manager.set_state(interview_id, {
        **manager.get_state(interview_id),
        "status": "paused"
    })
    
    await manager.send_json(interview_id, {
        "event": "interview:paused",
        "data": {}
    })
    
    return {"status": "paused", "interview_id": interview_id}


@app.post("/api/v1/interviews/{interview_id}/resume")
async def resume_interview(interview_id: str):
    """Resume a paused interview"""
    manager.set_state(interview_id, {
        **manager.get_state(interview_id),
        "status": "running"
    })
    
    await manager.send_json(interview_id, {
        "event": "interview:resumed",
        "data": {}
    })
    
    return {"status": "resumed", "interview_id": interview_id}


@app.post("/api/v1/interviews/{interview_id}/end")
async def end_interview(interview_id: str):
    """End an interview"""
    manager.set_state(interview_id, {
        **manager.get_state(interview_id),
        "status": "completed",
        "ended_at": datetime.utcnow().isoformat()
    })
    
    await manager.send_json(interview_id, {
        "event": "interview:ended",
        "data": {
            "summary": {
                "total_questions": 10,
                "total_responses": 10,
                "warnings_count": len(manager.get_state(interview_id).get("warnings", []))
            }
        }
    })
    
    return {"status": "completed", "interview_id": interview_id}


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return {
        "error": {
            "status_code": exc.status_code,
            "message": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
