"""
analytics.py - Pandas-powered utilization and optimization engine.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Booking, Resource, Department, BookingStatus


OPERATIONAL_HOURS_PER_DAY = 8.0
UNDERUTILIZATION_THRESHOLD = 30.0  # percent


async def fetch_analytics_data(
    db: AsyncSession,
    start_date: datetime,
    end_date: datetime,
) -> dict[str, Any]:
    """
    Fetch booking + resource data and compute utilization metrics via Pandas.
    Returns structured analytics including suggestions.
    """

    # ── 1. Load all resources with department ──────────────────────────────────
    res_result = await db.execute(
        select(Resource).options(selectinload(Resource.department))
    )
    resources = res_result.scalars().all()

    # ── 2. Load bookings in range (APPROVED or COMPLETED) ─────────────────────
    booking_result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.resource).selectinload(Resource.department))
        .where(
            Booking.status.in_([BookingStatus.APPROVED, BookingStatus.COMPLETED]),
            Booking.start_time >= start_date,
            Booking.end_time <= end_date,
        )
    )
    bookings = booking_result.scalars().all()

    # ── 3. Build DataFrames ────────────────────────────────────────────────────
    total_days = max((end_date - start_date).days, 1)
    total_operational_hours = total_days * OPERATIONAL_HOURS_PER_DAY

    resource_rows = []
    for r in resources:
        resource_rows.append(
            {
                "resource_id": r.id,
                "resource_name": r.name,
                "department": r.department.name if r.department else "Unknown",
                "department_code": r.department.code if r.department else "UNK",
                "category": r.category,
                "cost_per_hour": r.cost_per_hour,
                "is_cross_shareable": r.is_cross_shareable,
                "status": r.status.value,
            }
        )

    booking_rows = []
    for b in bookings:
        duration_hours = (b.end_time - b.start_time).total_seconds() / 3600
        booking_rows.append(
            {
                "booking_id": b.id,
                "resource_id": b.resource_id,
                "duration_hours": duration_hours,
            }
        )

    df_resources = pd.DataFrame(resource_rows) if resource_rows else pd.DataFrame(
        columns=["resource_id", "resource_name", "department", "department_code",
                 "category", "cost_per_hour", "is_cross_shareable", "status"]
    )

    df_bookings = pd.DataFrame(booking_rows) if booking_rows else pd.DataFrame(
        columns=["booking_id", "resource_id", "duration_hours"]
    )

    # ── 4. Aggregate booked hours per resource ─────────────────────────────────
    if not df_bookings.empty:
        booked_agg = (
            df_bookings.groupby("resource_id")["duration_hours"]
            .sum()
            .reset_index()
            .rename(columns={"duration_hours": "total_booked_hours"})
        )
    else:
        booked_agg = pd.DataFrame(columns=["resource_id", "total_booked_hours"])

    # ── 5. Merge and compute utilization ─────────────────────────────────────
    df = df_resources.merge(booked_agg, on="resource_id", how="left")
    df["total_booked_hours"] = df["total_booked_hours"].fillna(0.0)
    df["operational_hours"] = total_operational_hours
    df["utilization_pct"] = (
        (df["total_booked_hours"] / df["operational_hours"]) * 100
    ).round(2)
    df["is_underutilized"] = df["utilization_pct"] < UNDERUTILIZATION_THRESHOLD

    # ── 6. Department-level summary ───────────────────────────────────────────
    dept_summary = (
        df.groupby(["department", "department_code"])
        .agg(
            resource_count=("resource_id", "count"),
            avg_utilization=("utilization_pct", "mean"),
            total_booked_hours=("total_booked_hours", "sum"),
            underutilized_count=("is_underutilized", "sum"),
        )
        .reset_index()
        .round(2)
    )
    dept_summary_list = dept_summary.to_dict(orient="records")

    # ── 7. Build utilization records ──────────────────────────────────────────
    utilization_records = []
    for _, row in df.iterrows():
        utilization_records.append(
            {
                "resource_id": int(row["resource_id"]),
                "resource_name": row["resource_name"],
                "department": row["department"],
                "category": row["category"],
                "total_booked_hours": float(row["total_booked_hours"]),
                "operational_hours": float(row["operational_hours"]),
                "utilization_pct": float(row["utilization_pct"]),
                "is_underutilized": bool(row["is_underutilized"]),
            }
        )

    # ── 8. Build optimization suggestions ─────────────────────────────────────
    suggestions = []
    underutilized = df[df["is_underutilized"] & (df["status"] == "ACTIVE")].copy()
    all_depts = df["department"].unique().tolist()

    for _, row in underutilized.iterrows():
        from_dept = row["department"]
        other_depts = [d for d in all_depts if d != from_dept]
        pct = float(row["utilization_pct"])
        resource_name = row["resource_name"]

        if other_depts:
            rec_depts = other_depts[:2]
            dept_str = " and ".join(rec_depts)
            suggestion_text = (
                f"{resource_name} in {from_dept} is underutilized "
                f"({pct:.1f}% usage). Recommend sharing with {dept_str}."
            )
        else:
            suggestion_text = (
                f"{resource_name} in {from_dept} is underutilized "
                f"({pct:.1f}% usage). Consider scheduling maintenance or redeployment."
            )

        suggestions.append(
            {
                "resource_id": int(row["resource_id"]),
                "resource_name": resource_name,
                "from_department": from_dept,
                "utilization_pct": pct,
                "suggestion": suggestion_text,
                "recommended_departments": other_depts[:2],
            }
        )

    overall_utilization = float(df["utilization_pct"].mean()) if not df.empty else 0.0

    return {
        "period_start": start_date.isoformat(),
        "period_end": end_date.isoformat(),
        "total_resources": len(resources),
        "overall_utilization_pct": round(overall_utilization, 2),
        "utilization_records": utilization_records,
        "suggestions": suggestions,
        "department_summary": dept_summary_list,
    }


async def fetch_dashboard_kpis(db: AsyncSession) -> dict[str, Any]:
    """Quick KPI counts for the dashboard header."""
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    # Total resources
    res_result = await db.execute(select(Resource))
    all_resources = res_result.scalars().all()

    # Active bookings (approved, not yet completed)
    active_result = await db.execute(
        select(Booking).where(
            Booking.status == BookingStatus.APPROVED,
            Booking.end_time >= now,
        )
    )
    active_bookings = active_result.scalars().all()

    # Pending approvals
    pending_result = await db.execute(
        select(Booking).where(Booking.status == BookingStatus.PENDING)
    )
    pending = pending_result.scalars().all()

    # Departments
    dept_result = await db.execute(select(Department))
    depts = dept_result.scalars().all()

    # Utilization
    analytics = await fetch_analytics_data(db, thirty_days_ago, now)

    return {
        "total_resources": len(all_resources),
        "active_bookings": len(active_bookings),
        "overall_utilization_pct": analytics["overall_utilization_pct"],
        "underutilized_count": sum(
            1 for r in analytics["utilization_records"] if r["is_underutilized"]
        ),
        "pending_approvals": len(pending),
        "total_departments": len(depts),
    }
