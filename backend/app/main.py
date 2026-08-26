from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.redis_client import close_redis
from app.routes import auth, departments, resources, bookings, analytics, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    await close_redis()


app = FastAPI(
    title="Resource Sharing Optimizer API",
    description="Institutional resource management and cross-department sharing platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(departments.router, prefix=API_PREFIX)
app.include_router(resources.router, prefix=API_PREFIX)
app.include_router(bookings.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Resource Sharing Optimizer"}
