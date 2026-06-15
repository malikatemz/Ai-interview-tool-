# API v1 Routers
from fastapi import APIRouter

from . import auth, candidates, interviews, questions, evaluations, dashboard, reports

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(candidates.router)
api_router.include_router(interviews.router)
api_router.include_router(questions.router)
api_router.include_router(evaluations.router)
api_router.include_router(dashboard.router)
api_router.include_router(reports.router)
