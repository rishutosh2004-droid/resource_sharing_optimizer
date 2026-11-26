from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Booking, Resource, User, BookingStatus, UserRole
from app.schemas import BookingCreate, BookingUpdate, BookingOut
from app.auth import get_current_user, require_admin
from app.redis_client import get_redis

router = APIRouter(prefix="/bookings", tags=["bookings"])


async def check_time_overlap(
    db: AsyncSession,
    resource_id: int,
    start_time,
    end_time,
    exclude_booking_id: Optional[int] = None,
    total_quantity: int = 1,
) -> bool:
    """Returns True if overlapping active bookings reach or exceed total_quantity."""
    query = select(func.count(Booking.id)).where(
        Booking.resource_id == resource_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED]),
        or_(
            and_(Booking.start_time < end_time, Booking.end_time > start_time),
        ),
    )
    if exclude_booking_id:
        query = query.where(Booking.id != exclude_booking_id)

    result = await db.execute(query)
    count = result.scalar() or 0
    return count >= max(1, total_quantity)


@router.get("/", response_model=List[BookingOut])
async def list_bookings(
    status: Optional[BookingStatus] = Query(None),
    resource_id: Optional[int] = Query(None),
    my_only: bool = Query(False),
    pending_approval: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Booking).options(
        selectinload(Booking.resource).selectinload(Resource.department),
        selectinload(Booking.user).selectinload(User.department),
    )

    if my_only or current_user.role == UserRole.MEMBER:
        query = query.where(Booking.user_id == current_user.id)
    elif pending_approval and current_user.role in (UserRole.DEPT_ADMIN, UserRole.SUPER_ADMIN):
        query = query.where(Booking.status == BookingStatus.PENDING)

    if status:
        query = query.where(Booking.status == status)
    if resource_id:
        query = query.where(Booking.resource_id == resource_id)

    result = await db.execute(query.order_by(Booking.created_at.desc()))
    return result.scalars().all()


@router.get("/pending-approvals", response_model=List[BookingOut])
async def get_pending_approvals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Get all PENDING bookings for admins to review."""
    query = (
        select(Booking)
        .options(
            selectinload(Booking.resource).selectinload(Resource.department),
            selectinload(Booking.user).selectinload(User.department),
        )
        .where(Booking.status == BookingStatus.PENDING)
        .order_by(Booking.created_at.asc())
    )

    # DEPT_ADMIN only sees bookings for resources in their department
    if current_user.role == UserRole.DEPT_ADMIN:
        query = query.join(Resource).where(
            Resource.department_id == current_user.department_id
        )

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Booking)
        .options(
            selectinload(Booking.resource).selectinload(Resource.department),
            selectinload(Booking.user).selectinload(User.department),
        )
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if (
        current_user.role == UserRole.MEMBER
        and booking.user_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Access denied")
    return booking


@router.post("/", response_model=BookingOut, status_code=201)
async def create_booking(
    booking_in: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify resource exists and is active
    res_result = await db.execute(
        select(Resource)
        .options(selectinload(Resource.department))
        .where(Resource.id == booking_in.resource_id)
    )
    resource = res_result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource.status.value != "ACTIVE":
        raise HTTPException(status_code=400, detail="Resource is not active")

    # Determine initial status
    same_dept = resource.department_id == current_user.department_id
    initial_status = (
        BookingStatus.APPROVED if same_dept else BookingStatus.PENDING
    )

    # ── Redis distributed lock to prevent race conditions ───────────────────
    redis = await get_redis()
    lock_key = f"resource:{booking_in.resource_id}:lock"

    async with redis.lock(lock_key, timeout=10, blocking_timeout=5):
        # Check overlap INSIDE the lock
        has_conflict = await check_time_overlap(
            db,
            booking_in.resource_id,
            booking_in.start_time,
            booking_in.end_time,
            total_quantity=getattr(resource, "total_quantity", 1) or 1,
        )
        if has_conflict:
            qty = getattr(resource, "total_quantity", 1) or 1
            raise HTTPException(
                status_code=409,
                detail=f"All {qty} unit(s) of this resource are booked for this time slot. Please choose another time.",
            )

        booking = Booking(
            resource_id=booking_in.resource_id,
            user_id=current_user.id,
            start_time=booking_in.start_time,
            end_time=booking_in.end_time,
            purpose=booking_in.purpose,
            notes=booking_in.notes,
            status=initial_status,
        )
        db.add(booking)
        await db.flush()
        booking_id = booking.id

    # Reload with relationships
    result = await db.execute(
        select(Booking)
        .options(
            selectinload(Booking.resource).selectinload(Resource.department),
            selectinload(Booking.user).selectinload(User.department),
        )
        .where(Booking.id == booking_id)
    )
    return result.scalar_one()


@router.patch("/{booking_id}/status", response_model=BookingOut)
async def update_booking_status(
    booking_id: int,
    update: BookingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Booking)
        .options(
            selectinload(Booking.resource).selectinload(Resource.department),
            selectinload(Booking.user).selectinload(User.department),
        )
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Permission checks
    is_own_booking = booking.user_id == current_user.id
    is_admin = current_user.role in (UserRole.DEPT_ADMIN, UserRole.SUPER_ADMIN)
    is_dept_admin_of_resource = (
        current_user.role == UserRole.DEPT_ADMIN
        and booking.resource.department_id == current_user.department_id
    )

    allowed_transitions = {
        BookingStatus.CANCELLED: is_own_booking or is_admin,
        BookingStatus.APPROVED: is_admin or is_dept_admin_of_resource,
        BookingStatus.REJECTED: is_admin or is_dept_admin_of_resource,
        BookingStatus.COMPLETED: is_admin,
    }

    if not allowed_transitions.get(update.status, False):
        raise HTTPException(status_code=403, detail="Not allowed to make this status change")

    booking.status = update.status
    if update.notes:
        booking.notes = update.notes
    if update.status in (BookingStatus.APPROVED, BookingStatus.REJECTED):
        booking.approved_by_id = current_user.id

    await db.flush()
    await db.refresh(booking)
    result = await db.execute(
        select(Booking)
        .options(
            selectinload(Booking.resource).selectinload(Resource.department),
            selectinload(Booking.user).selectinload(User.department),
        )
        .where(Booking.id == booking_id)
    )
    return result.scalar_one()


@router.delete("/{booking_id}", status_code=204)
async def cancel_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role == UserRole.MEMBER:
        raise HTTPException(status_code=403, detail="Access denied")
    booking.status = BookingStatus.CANCELLED
    await db.flush()
