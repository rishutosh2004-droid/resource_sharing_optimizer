from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import Department, User
from app.schemas import DepartmentCreate, DepartmentOut
from app.auth import get_current_user, require_super_admin

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("/", response_model=List[DepartmentOut])
async def list_departments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).order_by(Department.name))
    return result.scalars().all()


@router.get("/{dept_id}", response_model=DepartmentOut)
async def get_department(dept_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.post("/", response_model=DepartmentOut, status_code=201)
async def create_department(
    dept_in: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    existing = await db.execute(select(Department).where(Department.code == dept_in.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Department code already exists")
    dept = Department(**dept_in.model_dump())
    db.add(dept)
    await db.flush()
    await db.refresh(dept)
    return dept


@router.delete("/{dept_id}", status_code=204)
async def delete_department(
    dept_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    await db.delete(dept)
