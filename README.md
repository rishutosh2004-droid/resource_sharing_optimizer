# Resource Sharing Optimizer (RSO Platform)

A **production-ready** full-stack platform for institutional resource management, cross-department sharing, and AI-driven utilization optimization.

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0 (async) |
| **Auth** | JWT (python-jose), bcrypt (passlib) |
| **Database** | PostgreSQL 15 (asyncpg) / SQLite fallback (aiosqlite) |
| **Cache/Lock** | Redis 7 (redis-py async, distributed locking) |
| **Analytics** | Pandas 2.x (utilization engine, optimization recommendations) |
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, Recharts, Lucide React, date-fns |
| **Infra** | Docker Compose |

---

## 🚀 Quick Start

### Option 1: Docker (Recommended — Single Command)

```bash
# Clone / navigate to project root
cd "SE project"

# Start everything (PostgreSQL + Redis + Backend + Frontend)
docker-compose up --build

# Access:
# Frontend:  http://localhost:5173
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

> The backend container automatically runs `database_init.py` then `seed.py` on startup.

### Option 2: Local Development (No Docker)

#### Prerequisites
- Python 3.11+
- Node.js 20+
- Redis (local: `redis-server` or WSL)
- PostgreSQL 15+ (optional — SQLite fallback works out of the box)

#### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate      # Windows
# source venv/bin/activate   # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Set environment variables (or create .env file)
# Uses SQLite by default — no PostgreSQL needed for local dev!
# DATABASE_URL=sqlite+aiosqlite:///./rso.db
# REDIS_URL=redis://localhost:6379/0
# SECRET_KEY=super-secret-jwt-key-change-in-production-32chars

# Initialize database tables
python -m app.database_init

# Seed with demo data
python -m app.seed

# Start backend
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Access at http://localhost:5173
```

---

## 🔐 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@institution.edu` | `admin123` |
| CS Dept Admin | `cs.admin@institution.edu` | `admin123` |
| Bio Dept Admin | `bio.admin@institution.edu` | `admin123` |
| CS Member | `john.doe@institution.edu` | `member123` |
| Bio Member | `jane.smith@institution.edu` | `member123` |
| Physics Member | `mike.wang@institution.edu` | `member123` |

> All demo accounts are pre-loaded by `seed.py`. The login page also has quick-fill buttons.

---

## 📁 Project Structure

```
SE project/
├── docker-compose.yml
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py           # FastAPI app, CORS, router registration
│       ├── config.py         # pydantic-settings config
│       ├── database.py       # Async SQLAlchemy engine + session
│       ├── database_init.py  # Table creation script
│       ├── models.py         # ORM models (Department, User, Resource, Booking)
│       ├── schemas.py        # Pydantic v2 request/response schemas
│       ├── auth.py           # JWT, bcrypt, RBAC dependency factories
│       ├── redis_client.py   # Async Redis singleton
│       ├── analytics.py      # 🐼 Pandas utilization engine
│       ├── seed.py           # Demo data seeder
│       └── routes/
│           ├── auth.py       # /api/v1/auth/*
│           ├── departments.py
│           ├── resources.py
│           ├── bookings.py   # Redis distributed lock here
│           ├── analytics.py
│           └── users.py
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx           # Router + layout
        ├── index.css         # Tailwind + custom component classes
        ├── context/
        │   └── AuthContext.jsx
        ├── services/
        │   └── api.js        # Axios service layer
        ├── components/
        │   ├── Navbar.jsx    # Sidebar with role-based nav
        │   ├── Modal.jsx
        │   ├── ProtectedRoute.jsx
        │   └── ui.jsx        # StatusBadge, LoadingPage, EmptyState, etc.
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── DashboardPage.jsx   # KPI cards
            ├── ResourcesPage.jsx   # Catalog + booking modal
            ├── BookingsPage.jsx    # My bookings table
            ├── ApprovalsPage.jsx   # Admin approval workflow
            ├── AnalyticsPage.jsx   # Recharts + optimization suggestions
            └── UsersPage.jsx       # User management (SUPER_ADMIN)
```

---

## 🏗 Core Features

### 1. Authentication & RBAC
- JWT-based login with Bearer token
- Three roles: `SUPER_ADMIN`, `DEPT_ADMIN`, `MEMBER`
- Role-based guards on both FastAPI endpoints and React routes

### 2. Resource Management
- CRUD for resources with category, department, cost, and shareability flags
- Status lifecycle: `ACTIVE → MAINTENANCE → RETIRED`
- Filterable catalog by category, department, and shareability

### 3. Booking Engine with Redis Distributed Lock

```python
# In routes/bookings.py — prevents race conditions
async with redis.lock(f"resource:{id}:lock", timeout=10, blocking_timeout=5):
    has_conflict = await check_time_overlap(...)  # DB check inside lock
    if has_conflict:
        raise HTTPException(409, "Time slot conflicts")
    booking = Booking(...)
    db.add(booking)
```

Cross-department bookings are auto-set to `PENDING` status for admin approval.

### 4. Pandas Analytics Engine

```python
# In analytics.py
utilization_pct = (total_booked_hours / operational_hours) * 100
is_underutilized = utilization_pct < 30.0  # threshold

# Generates natural language suggestions like:
# "Spectrophotometer in Biotechnology is underutilized (12.4% usage).
#  Recommend sharing with Computer Science and Physics."
```

### 5. Seed Data
- 3 departments, 6 users, 8 resources, 50+ bookings
- Realistic utilization patterns: GPU Cluster (~75%), Mass Spec (~60%), Spectrophotometer (~12%)
- Pre-loaded cross-department PENDING requests for approvals demo

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | OAuth2 login → JWT |
| `POST` | `/api/v1/auth/register` | Register user |
| `GET` | `/api/v1/auth/me` | Current user |
| `GET` | `/api/v1/departments/` | List departments |
| `GET` | `/api/v1/resources/` | List resources (filterable) |
| `POST` | `/api/v1/resources/` | Create resource (Admin) |
| `GET` | `/api/v1/bookings/` | List bookings |
| `POST` | `/api/v1/bookings/` | Create booking (Redis-locked) |
| `PATCH` | `/api/v1/bookings/{id}/status` | Approve/Reject/Cancel |
| `GET` | `/api/v1/bookings/pending-approvals` | Admin pending list |
| `GET` | `/api/v1/analytics/utilization?days=30` | 🐼 Pandas utilization report |
| `GET` | `/api/v1/analytics/dashboard` | KPI summary |
| `GET` | `/api/v1/users/` | User list (SUPER_ADMIN) |

Full interactive docs at: **http://localhost:8000/docs**

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./rso.db` | DB connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection |
| `SECRET_KEY` | `super-secret-...` | JWT signing key |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token TTL |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed origins |

For PostgreSQL, set:
```
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
```
