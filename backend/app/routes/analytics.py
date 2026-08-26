from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import AnalyticsResponse, DashboardKPIs
from app.auth import get_current_user
from app.analytics import fetch_analytics_data, fetch_dashboard_kpis

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/utilization", response_model=AnalyticsResponse)
async def get_utilization(
    days: int = Query(30, ge=1, le=365, description="Number of past days to analyze"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)
    data = await fetch_analytics_data(db, start_date, now)
    return data


@router.get("/dashboard", response_model=DashboardKPIs)
async def get_dashboard_kpis(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await fetch_dashboard_kpis(db)
