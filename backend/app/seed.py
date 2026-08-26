"""
seed.py - Populates the database with realistic demo data.
Run as: python -m app.seed
"""
import asyncio
import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine, Base, AsyncSessionLocal
from app.models import (
    Department, User, Resource, Booking,
    UserRole, ResourceStatus, BookingStatus,
)
from app.auth import get_password_hash

import app.models  # noqa ensure all models registered


NOW = datetime.now(timezone.utc)


async def clear_db(session: AsyncSession):
    await session.execute(delete(Booking))
    await session.execute(delete(Resource))
    await session.execute(delete(User))
    await session.execute(delete(Department))
    await session.commit()
    print("[seed] Cleared existing data.")


async def seed():
    # ── Create Tables ─────────────────────────────────────────────────────────
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await clear_db(session)

        # ── 1. Departments ────────────────────────────────────────────────────
        cs_dept = Department(name="Computer Science", code="CS")
        bio_dept = Department(name="Biotechnology", code="BIO")
        phy_dept = Department(name="Physics", code="PHY")
        session.add_all([cs_dept, bio_dept, phy_dept])
        await session.flush()
        print(f"[seed] Created departments: CS={cs_dept.id}, BIO={bio_dept.id}, PHY={phy_dept.id}")

        # ── 2. Users ──────────────────────────────────────────────────────────
        super_admin = User(
            email="admin@institution.edu",
            hashed_password=get_password_hash("admin123"),
            full_name="System Administrator",
            role=UserRole.SUPER_ADMIN,
            department_id=None,
        )
        cs_admin = User(
            email="cs.admin@institution.edu",
            hashed_password=get_password_hash("admin123"),
            full_name="Dr. Alice Chen",
            role=UserRole.DEPT_ADMIN,
            department_id=cs_dept.id,
        )
        bio_admin = User(
            email="bio.admin@institution.edu",
            hashed_password=get_password_hash("admin123"),
            full_name="Dr. Robert Kim",
            role=UserRole.DEPT_ADMIN,
            department_id=bio_dept.id,
        )
        cs_member1 = User(
            email="john.doe@institution.edu",
            hashed_password=get_password_hash("member123"),
            full_name="John Doe",
            role=UserRole.MEMBER,
            department_id=cs_dept.id,
        )
        bio_member1 = User(
            email="jane.smith@institution.edu",
            hashed_password=get_password_hash("member123"),
            full_name="Jane Smith",
            role=UserRole.MEMBER,
            department_id=bio_dept.id,
        )
        phy_member1 = User(
            email="mike.wang@institution.edu",
            hashed_password=get_password_hash("member123"),
            full_name="Mike Wang",
            role=UserRole.MEMBER,
            department_id=phy_dept.id,
        )
        session.add_all([super_admin, cs_admin, bio_admin, cs_member1, bio_member1, phy_member1])
        await session.flush()
        print("[seed] Created 6 users.")

        # ── 3. Resources ──────────────────────────────────────────────────────
        gpu_cluster = Resource(
            department_id=cs_dept.id,
            name="GPU Cluster A100",
            category="Computing",
            cost_per_hour=150.0,
            is_cross_shareable=True,
            status=ResourceStatus.ACTIVE,
            description="High-performance NVIDIA A100 GPU cluster with 8 GPUs, 640GB VRAM",
            specs_json=json.dumps({"GPUs": "8x NVIDIA A100", "RAM": "1TB", "Storage": "50TB NVMe"}),
        )
        vr_lab = Resource(
            department_id=cs_dept.id,
            name="VR Research Lab",
            category="Research Lab",
            cost_per_hour=50.0,
            is_cross_shareable=True,
            status=ResourceStatus.ACTIVE,
            description="Full VR lab with 10 HTC Vive Pro headsets and motion capture",
            specs_json=json.dumps({"Headsets": "10x HTC Vive Pro", "Area": "200 sqft", "Tracking": "Full-body"}),
        )
        hpc_cluster = Resource(
            department_id=cs_dept.id,
            name="HPC Linux Cluster",
            category="Computing",
            cost_per_hour=80.0,
            is_cross_shareable=False,
            status=ResourceStatus.ACTIVE,
            description="High-performance computing cluster for simulations",
            specs_json=json.dumps({"Cores": 512, "RAM": "4TB", "Interconnect": "InfiniBand"}),
        )
        mass_spec = Resource(
            department_id=bio_dept.id,
            name="Mass Spectrometer",
            category="Analytical Instrument",
            cost_per_hour=200.0,
            is_cross_shareable=True,
            status=ResourceStatus.ACTIVE,
            description="Thermo Fisher Orbitrap mass spectrometer for proteomics",
            specs_json=json.dumps({"Resolution": "500,000 FWHM", "Scan Rate": "20 Hz", "Mode": "Orbitrap"}),
        )
        spectrophotometer = Resource(
            department_id=bio_dept.id,
            name="Spectrophotometer Suite",
            category="Analytical Instrument",
            cost_per_hour=35.0,
            is_cross_shareable=True,
            status=ResourceStatus.ACTIVE,
            description="UV-Vis-NIR spectrophotometer array",
            specs_json=json.dumps({"Range": "190-3300nm", "Units": 4, "Accuracy": "±0.3nm"}),
        )
        pcr_system = Resource(
            department_id=bio_dept.id,
            name="Real-Time PCR System",
            category="Molecular Biology",
            cost_per_hour=60.0,
            is_cross_shareable=False,
            status=ResourceStatus.ACTIVE,
            description="Applied Biosystems QuantStudio 12K Flex",
            specs_json=json.dumps({"Wells": "12,288 reactions/run", "Multiplex": "6-color"}),
        )
        laser_lab = Resource(
            department_id=phy_dept.id,
            name="High-Power Laser Lab",
            category="Research Lab",
            cost_per_hour=120.0,
            is_cross_shareable=True,
            status=ResourceStatus.ACTIVE,
            description="Ultrafast laser systems for optics experiments",
            specs_json=json.dumps({"Power": "10W CW", "Wavelengths": "355/532/1064nm", "Pulse": "100fs"}),
        )
        clean_room = Resource(
            department_id=phy_dept.id,
            name="Class 100 Clean Room",
            category="Fabrication",
            cost_per_hour=90.0,
            is_cross_shareable=True,
            status=ResourceStatus.MAINTENANCE,
            description="ISO Class 5 clean room for nanofabrication",
            specs_json=json.dumps({"Class": "ISO 5 (Class 100)", "Area": "500 sqft", "Tools": "Lithography, Deposition"}),
        )

        session.add_all([
            gpu_cluster, vr_lab, hpc_cluster,
            mass_spec, spectrophotometer, pcr_system,
            laser_lab, clean_room,
        ])
        await session.flush()
        print("[seed] Created 8 resources.")

        # ── 4. Bookings (past + upcoming for rich analytics) ──────────────────
        bookings_data = []

        # GPU Cluster - heavily used (simulate ~75% utilization over 30 days)
        for i in range(18):
            day_offset = -(i * 1 + 2)
            start = NOW + timedelta(days=day_offset, hours=9)
            end = start + timedelta(hours=6)
            bookings_data.append(Booking(
                resource_id=gpu_cluster.id,
                user_id=cs_member1.id,
                start_time=start, end_time=end,
                purpose=f"Deep learning model training - Experiment {i+1}",
                status=BookingStatus.COMPLETED if day_offset < -1 else BookingStatus.APPROVED,
                notes="ML pipeline training",
            ))

        # GPU Cluster cross-dept (bio using it)
        for i in range(3):
            day_offset = -(i * 5 + 1)
            start = NOW + timedelta(days=day_offset, hours=14)
            end = start + timedelta(hours=4)
            bookings_data.append(Booking(
                resource_id=gpu_cluster.id,
                user_id=bio_member1.id,
                start_time=start, end_time=end,
                purpose="Protein structure prediction using AlphaFold2",
                status=BookingStatus.APPROVED,
                notes="Cross-dept request approved",
            ))

        # VR Lab - moderately used (~45%)
        for i in range(8):
            day_offset = -(i * 3 + 1)
            start = NOW + timedelta(days=day_offset, hours=10)
            end = start + timedelta(hours=3)
            bookings_data.append(Booking(
                resource_id=vr_lab.id,
                user_id=cs_member1.id,
                start_time=start, end_time=end,
                purpose=f"VR interaction study - Session {i+1}",
                status=BookingStatus.COMPLETED if day_offset < -2 else BookingStatus.APPROVED,
            ))

        # Mass Spectrometer - well used (~60%)
        for i in range(12):
            day_offset = -(i * 2 + 1)
            start = NOW + timedelta(days=day_offset, hours=8)
            end = start + timedelta(hours=4)
            bookings_data.append(Booking(
                resource_id=mass_spec.id,
                user_id=bio_member1.id,
                start_time=start, end_time=end,
                purpose=f"Proteomics analysis batch {i+1}",
                status=BookingStatus.COMPLETED if day_offset < -2 else BookingStatus.APPROVED,
            ))

        # Spectrophotometer - UNDERUTILIZED (~12%)
        for i in range(2):
            day_offset = -(i * 10 + 5)
            start = NOW + timedelta(days=day_offset, hours=11)
            end = start + timedelta(hours=1)
            bookings_data.append(Booking(
                resource_id=spectrophotometer.id,
                user_id=bio_member1.id,
                start_time=start, end_time=end,
                purpose="Optical density measurement",
                status=BookingStatus.COMPLETED,
            ))

        # Laser Lab - UNDERUTILIZED (~18%)
        for i in range(3):
            day_offset = -(i * 8 + 3)
            start = NOW + timedelta(days=day_offset, hours=9)
            end = start + timedelta(hours=2)
            bookings_data.append(Booking(
                resource_id=laser_lab.id,
                user_id=phy_member1.id,
                start_time=start, end_time=end,
                purpose=f"Laser spectroscopy experiment {i+1}",
                status=BookingStatus.COMPLETED if day_offset < -2 else BookingStatus.APPROVED,
            ))

        # HPC - moderate (~40%)
        for i in range(8):
            day_offset = -(i * 3 + 2)
            start = NOW + timedelta(days=day_offset, hours=7)
            end = start + timedelta(hours=5)
            bookings_data.append(Booking(
                resource_id=hpc_cluster.id,
                user_id=cs_member1.id,
                start_time=start, end_time=end,
                purpose=f"Molecular dynamics simulation run {i+1}",
                status=BookingStatus.COMPLETED if day_offset < -2 else BookingStatus.APPROVED,
            ))

        # PCR System - moderate (~35%)
        for i in range(6):
            day_offset = -(i * 4 + 1)
            start = NOW + timedelta(days=day_offset, hours=10)
            end = start + timedelta(hours=3)
            bookings_data.append(Booking(
                resource_id=pcr_system.id,
                user_id=bio_member1.id,
                start_time=start, end_time=end,
                purpose=f"Gene expression analysis panel {i+1}",
                status=BookingStatus.COMPLETED if day_offset < -3 else BookingStatus.APPROVED,
            ))

        # Upcoming bookings (PENDING - for approvals workflow demo)
        upcoming_cross_dept = [
            Booking(
                resource_id=mass_spec.id,
                user_id=cs_member1.id,
                start_time=NOW + timedelta(days=2, hours=9),
                end_time=NOW + timedelta(days=2, hours=13),
                purpose="Nanomaterial characterization for CS research",
                status=BookingStatus.PENDING,
                notes="Cross-department request from CS to BIO",
            ),
            Booking(
                resource_id=gpu_cluster.id,
                user_id=phy_member1.id,
                start_time=NOW + timedelta(days=3, hours=14),
                end_time=NOW + timedelta(days=3, hours=18),
                purpose="Quantum simulation using ML models",
                status=BookingStatus.PENDING,
                notes="PHY cross-dept booking for GPU cluster",
            ),
            Booking(
                resource_id=laser_lab.id,
                user_id=bio_member1.id,
                start_time=NOW + timedelta(days=4, hours=10),
                end_time=NOW + timedelta(days=4, hours=14),
                purpose="Raman spectroscopy for protein analysis",
                status=BookingStatus.PENDING,
                notes="BIO department requesting PHY laser lab",
            ),
            Booking(
                resource_id=vr_lab.id,
                user_id=phy_member1.id,
                start_time=NOW + timedelta(days=5, hours=9),
                end_time=NOW + timedelta(days=5, hours=12),
                purpose="3D visualization of quantum field simulations",
                status=BookingStatus.APPROVED,
                notes="Approved for cross-dept VR usage",
            ),
        ]

        bookings_data.extend(upcoming_cross_dept)
        session.add_all(bookings_data)
        await session.flush()
        await session.commit()
        print(f"[seed] Created {len(bookings_data)} bookings.")
        print("[seed] ✅ Database seeded successfully!")
        print("\n📋 Login Credentials:")
        print("  Super Admin : admin@institution.edu         / admin123")
        print("  CS Admin    : cs.admin@institution.edu      / admin123")
        print("  Bio Admin   : bio.admin@institution.edu     / admin123")
        print("  CS Member   : john.doe@institution.edu      / member123")
        print("  Bio Member  : jane.smith@institution.edu    / member123")
        print("  Phy Member  : mike.wang@institution.edu     / member123")


if __name__ == "__main__":
    asyncio.run(seed())
