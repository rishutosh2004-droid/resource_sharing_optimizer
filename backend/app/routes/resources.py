from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Resource, User, ResourceStatus
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
    return result.scalars().all()


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
    return resource


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
