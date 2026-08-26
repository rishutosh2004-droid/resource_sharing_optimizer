"""
database_init.py - Creates all tables on startup.
Run as: python -m app.database_init
"""
import asyncio
from app.database import engine, Base
import app.models  # noqa: F401 - ensure models are imported so Base knows about them


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[database_init] All tables created successfully.")


if __name__ == "__main__":
    asyncio.run(init_db())
