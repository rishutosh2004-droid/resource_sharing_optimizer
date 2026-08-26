from __future__ import annotations
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from app.models import UserRole, ResourceStatus, BookingStatus


# ─── Token ────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class TokenData(BaseModel):
    user_id: Optional[int] = None


# ─── Department ───────────────────────────────────────────────────────────────

class DepartmentCreate(BaseModel):
    name: str
    code: str


class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── User ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.MEMBER
    department_id: Optional[int] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    department_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    department_id: Optional[int] = None
    department: Optional[DepartmentOut] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Resource ─────────────────────────────────────────────────────────────────

class ResourceCreate(BaseModel):
    name: str
    category: str
    department_id: int
    cost_per_hour: float = 0.0
    is_cross_shareable: bool = False
    status: ResourceStatus = ResourceStatus.ACTIVE
    specs_json: str = "{}"
    description: str = ""


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    cost_per_hour: Optional[float] = None
    is_cross_shareable: Optional[bool] = None
    status: Optional[ResourceStatus] = None
    specs_json: Optional[str] = None
    description: Optional[str] = None


class ResourceOut(BaseModel):
    id: int
    name: str
    category: str
    department_id: int
    department: Optional[DepartmentOut] = None
    cost_per_hour: float
    is_cross_shareable: bool
    status: ResourceStatus
    specs_json: str
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Booking ──────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    resource_id: int
    start_time: datetime
    end_time: datetime
    purpose: str
    notes: str = ""

    @model_validator(mode="after")
    def check_times(self) -> "BookingCreate":
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class BookingUpdate(BaseModel):
    status: BookingStatus
    notes: Optional[str] = None


class BookingOut(BaseModel):
    id: int
    resource_id: int
    resource: Optional[ResourceOut] = None
    user_id: int
    user: Optional[UserOut] = None
    start_time: datetime
    end_time: datetime
    purpose: str
    status: BookingStatus
    notes: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Analytics ────────────────────────────────────────────────────────────────

class UtilizationRecord(BaseModel):
    resource_id: int
    resource_name: str
    department: str
    category: str
    total_booked_hours: float
    operational_hours: float
    utilization_pct: float
    is_underutilized: bool


class OptimizationSuggestion(BaseModel):
    resource_id: int
    resource_name: str
    from_department: str
    utilization_pct: float
    suggestion: str
    recommended_departments: list[str]


class AnalyticsResponse(BaseModel):
    period_start: str
    period_end: str
    total_resources: int
    overall_utilization_pct: float
    utilization_records: list[UtilizationRecord]
    suggestions: list[OptimizationSuggestion]
    department_summary: list[dict[str, Any]]


class DashboardKPIs(BaseModel):
    total_resources: int
    active_bookings: int
    overall_utilization_pct: float
    underutilized_count: int
    pending_approvals: int
    total_departments: int
