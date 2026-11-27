"""
database_init.py - Creates all tables on startup.
Run as: python -m app.database_init
"""
import asyncio
from sqlalchemy import text
from app.database import engine, Base
import app.models  # noqa: F401 - ensure models are imported so Base knows about them


MIGRATION_NAME = "20261127_remove_super_admin_and_convert_prices_to_inr"
USD_TO_INR_RATE = 92.8944


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text(
            "CREATE TABLE IF NOT EXISTS app_migrations "
            "(name VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)"
        ))
        result = await conn.execute(
            text("SELECT 1 FROM app_migrations WHERE name = :name"),
            {"name": MIGRATION_NAME},
        )
        if result.scalar_one_or_none() is None:
            await conn.execute(
                text("UPDATE users SET role = 'MEMBER' WHERE role = 'SUPER_ADMIN'")
            )
            await conn.execute(
                text(
                    "UPDATE resources SET cost_per_hour = "
                    "ROUND(cost_per_hour * :rate, 2)"
                ),
                {"rate": USD_TO_INR_RATE},
            )
            await conn.execute(
                text("INSERT INTO app_migrations (name) VALUES (:name)"),
                {"name": MIGRATION_NAME},
            )
    print("[database_init] All tables created successfully.")


if __name__ == "__main__":
    asyncio.run(init_db())
