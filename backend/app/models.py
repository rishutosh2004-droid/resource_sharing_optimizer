import enum
import json
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime,
    ForeignKey, Text, Enum as SAEnum, func
)
from sqlalchemy.orm import relationship
from app.database import Base


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    DEPT_ADMIN = "DEPT_ADMIN"
    MEMBER = "MEMBER"


class ResourceStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    MAINTENANCE = "MAINTENANCE"
    RETIRED = "RETIRED"


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="department")
    resources = relationship("Resource", back_populates="department")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.MEMBER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    department = relationship("Department", back_populates="users")
    bookings = relationship("Booking", back_populates="user", foreign_keys="[Booking.user_id]")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    cost_per_hour = Column(Float, default=0.0)
    total_quantity = Column(Integer, default=1, nullable=False)
    is_cross_shareable = Column(Boolean, default=False)
    status = Column(SAEnum(ResourceStatus), default=ResourceStatus.ACTIVE, nullable=False)
    specs_json = Column(Text, default="{}")
    description = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    department = relationship("Department", back_populates="resources")
    bookings = relationship("Booking", back_populates="resource")

    @property
    def specs(self) -> dict:
        try:
            return json.loads(self.specs_json or "{}")
        except Exception:
            return {}


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    purpose = Column(Text, nullable=False)
    status = Column(SAEnum(BookingStatus), default=BookingStatus.PENDING, nullable=False)
    notes = Column(Text, default="")
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    resource = relationship("Resource", back_populates="bookings")
    user = relationship("User", back_populates="bookings", foreign_keys=[user_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
