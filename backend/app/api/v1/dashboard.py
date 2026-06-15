from fastapi import APIRouter, Query
from typing import Optional, Dict, List
from datetime import datetime, timedelta

from app.schemas.schemas import (
    DashboardStats, PipelineData, PipelineStage, 
    AnalyticsData, FunnelStep
)

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get dashboard statistics"""
    
    return DashboardStats(
        total_candidates=127,
        active_interviews=8,
        completed_today=12,
        average_score=7.2,
        pipeline_summary={
            "applied": 45,
            "screening": 28,
            "interview": 15,
            "review": 22,
            "hired": 17
        }
    )


@router.get("/pipeline", response_model=PipelineData)
async def get_pipeline_data():
    """Get candidate pipeline data"""
    
    stages = [
        PipelineStage(
            id="applied",
            name="Applied",
            count=45,
            candidates=[]
        ),
        PipelineStage(
            id="screening",
            name="Screening",
            count=28,
            candidates=[]
        ),
        PipelineStage(
            id="interview",
            name="Interview",
            count=15,
            candidates=[]
        ),
        PipelineStage(
            id="review",
            name="Review",
            count=22,
            candidates=[]
        ),
        PipelineStage(
            id="hired",
            name="Hired",
            count=17,
            candidates=[]
        ),
    ]
    
    return PipelineData(stages=stages)


@router.get("/analytics", response_model=AnalyticsData)
async def get_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    metric: Optional[str] = None
):
    """Get analytics data"""
    
    return AnalyticsData(
        funnel_conversion=[
            FunnelStep(stage="Applied", count=500, percentage=1.0),
            FunnelStep(stage="Screening", count=250, percentage=0.5),
            FunnelStep(stage="Interview", count=100, percentage=0.2),
            FunnelStep(stage="Offer", count=30, percentage=0.06),
            FunnelStep(stage="Hired", count=20, percentage=0.04),
        ],
        completion_rate=0.92,
        average_duration=42,  # minutes
        score_distribution={
            "9-10": 25,
            "8-9": 45,
            "7-8": 60,
            "6-7": 40,
            "5-6": 20,
            "<5": 10
        },
        time_to_hire=[18, 21, 15, 24, 19, 22, 16, 20, 25, 18],
        interview_quality=0.88
    )


@router.get("/funnel")
async def get_funnel_data():
    """Get recruitment funnel data"""
    
    return {
        "steps": [
            {"name": "Applications", "count": 500, "percentage": 100},
            {"name": "Resume Screening", "count": 300, "percentage": 60},
            {"name": "Phone Screen", "count": 150, "percentage": 30},
            {"name": "Technical Interview", "count": 80, "percentage": 16},
            {"name": "Final Interview", "count": 40, "percentage": 8},
            {"name": "Offers", "count": 25, "percentage": 5},
            {"name": "Hires", "count": 20, "percentage": 4},
        ],
        "conversion_rates": {
            "app_to_screen": 0.60,
            "screen_to_phone": 0.50,
            "phone_to_technical": 0.53,
            "technical_to_final": 0.50,
            "final_to_offer": 0.63,
            "offer_to_hire": 0.80
        }
    }


@router.get("/score-distribution")
async def get_score_distribution():
    """Get score distribution data"""
    
    return {
        "distribution": [
            {"range": "9-10", "count": 25, "percentage": 12.5},
            {"range": "8-9", "count": 45, "percentage": 22.5},
            {"range": "7-8", "count": 60, "percentage": 30.0},
            {"range": "6-7", "count": 40, "percentage": 20.0},
            {"range": "5-6", "count": 20, "percentage": 10.0},
            {"range": "4-5", "count": 8, "percentage": 4.0},
            {"range": "<4", "count": 2, "percentage": 1.0},
        ],
        "average_score": 7.2,
        "median_score": 7.4,
        "standard_deviation": 1.3
    }


@router.get("/time-metrics")
async def get_time_metrics():
    """Get time-based hiring metrics"""
    
    return {
        "average_time_to_hire": 19.5,  # days
        "average_time_to_screen": 2.3,
        "average_time_to_interview": 5.8,
        "average_interview_duration": 42,  # minutes
        "time_to_hire_trend": [
            {"month": "Jan", "days": 22},
            {"month": "Feb", "days": 21},
            {"month": "Mar", "days": 18},
            {"month": "Apr", "days": 19},
            {"month": "May", "days": 17},
            {"month": "Jun", "days": 18},
        ],
        "interviews_per_candidate": 2.3
    }


@router.get("/quality-metrics")
async def get_quality_metrics():
    """Get interview quality metrics"""
    
    return {
        "overall_quality_score": 0.88,
        "dimensions": {
            "follow_up_depth": 0.82,
            "question_relevance": 0.91,
            "candidate_engagement": 0.85,
            "transcript_completeness": 0.95
        },
        "no_show_rate": 0.05,
        "completion_rate": 0.92,
        "candidate_satisfaction_nps": 45
    }
