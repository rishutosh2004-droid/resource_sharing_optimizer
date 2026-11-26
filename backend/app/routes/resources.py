from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Resource, User, ResourceStatus, Booking, BookingStatus
from app.schemas import ResourceCreate, ResourceUpdate, ResourceOut
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("/", response_model=List[ResourceOut])
async def list_resources(
    category: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    status: Optional[ResourceStatus] = Query(None),
    cross_shareable: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = select(Resource).options(selectinload(Resource.department))

    if category:
        query = query.where(Resource.category == category)
    if department_id is not None:
        query = query.where(Resource.department_id == department_id)
    if status is not None:
        query = query.where(Resource.status == status)
    if cross_shareable is not None:
        query = query.where(Resource.is_cross_shareable == cross_shareable)

    result = await db.execute(query.order_by(Resource.name))
    resources = result.scalars().all()

    # Query currently active bookings right now
    now = datetime.now(timezone.utc)
    active_b_res = await db.execute(
        select(Booking.resource_id, func.count(Booking.id))
        .where(
            Booking.status == BookingStatus.APPROVED,
            Booking.start_time <= now,
            Booking.end_time >= now,
        )
        .group_by(Booking.resource_id)
    )
    active_map = dict(active_b_res.all())

    output = []
    for r in resources:
        in_use = active_map.get(r.id, 0)
        total = getattr(r, "total_quantity", 1) or 1
        avail = max(0, total - in_use)
        r_out = ResourceOut(
            id=r.id,
            name=r.name,
            category=r.category,
            department_id=r.department_id,
            department=r.department,
            cost_per_hour=r.cost_per_hour,
            total_quantity=total,
            available_quantity=avail,
            in_use_quantity=in_use,
            is_cross_shareable=r.is_cross_shareable,
            status=r.status,
            specs_json=r.specs_json,
            description=r.description,
            created_at=r.created_at,
        )
        output.append(r_out)

    return output


@router.get("/{resource_id}", response_model=ResourceOut)
async def get_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Resource)
        .options(selectinload(Resource.department))
        .where(Resource.id == resource_id)
    )
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    now = datetime.now(timezone.utc)
    active_b_res = await db.execute(
        select(func.count(Booking.id))
        .where(
            Booking.resource_id == resource_id,
            Booking.status == BookingStatus.APPROVED,
            Booking.start_time <= now,
            Booking.end_time >= now,
        )
    )
    in_use = active_b_res.scalar() or 0
    total = getattr(resource, "total_quantity", 1) or 1
    avail = max(0, total - in_use)

    return ResourceOut(
        id=resource.id,
        name=resource.name,
        category=resource.category,
        department_id=resource.department_id,
        department=resource.department,
        cost_per_hour=resource.cost_per_hour,
        total_quantity=total,
        available_quantity=avail,
        in_use_quantity=in_use,
        is_cross_shareable=resource.is_cross_shareable,
        status=resource.status,
        specs_json=resource.specs_json,
        description=resource.description,
        created_at=resource.created_at,
    )


@router.post("/", response_model=ResourceOut, status_code=201)
async def create_resource(
    res_in: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    resource = Resource(**res_in.model_dump())
    db.add(resource)
    await db.flush()
    result = await db.execute(
        select(Resource)
        .options(selectinload(Resource.department))
        .where(Resource.id == resource.id)
    )
    return result.scalar_one()


@router.patch("/{resource_id}", response_model=ResourceOut)
async def update_resource(
    resource_id: int,
    res_update: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(Resource)
        .options(selectinload(Resource.department))
        .where(Resource.id == resource_id)
    )
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    update_data = res_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(resource, field, value)

    await db.flush()
    await db.refresh(resource)
    result = await db.execute(
        select(Resource)
        .options(selectinload(Resource.department))
        .where(Resource.id == resource_id)
    )
    return result.scalar_one()


@router.delete("/{resource_id}", status_code=204)
async def delete_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    await db.delete(resource)
