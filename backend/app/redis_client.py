"""
redis_client.py
Provides an async Redis client. Falls back gracefully when Redis is
unavailable (e.g. local dev without Redis installed), using a simple
in-process asyncio.Lock so the app still works — just without
true distributed locking across multiple processes.
"""
import asyncio
import logging
from contextlib import asynccontextmanager

from app.config import settings

logger = logging.getLogger(__name__)

_redis_client = None
_redis_available = False

# ── In-process fallback locks (keyed by lock name) ────────────────────────────
_local_locks: dict[str, asyncio.Lock] = {}


def _get_local_lock(name: str) -> asyncio.Lock:
    if name not in _local_locks:
        _local_locks[name] = asyncio.Lock()
    return _local_locks[name]


@asynccontextmanager
async def _local_lock_ctx(name: str, **_kwargs):
    """Drop-in replacement for redis.lock() context manager."""
    lock = _get_local_lock(name)
    async with lock:
        yield


class _FallbackRedis:
    """Minimal stub that provides a .lock() context manager."""
    def lock(self, name: str, **kwargs):
        return _local_lock_ctx(name, **kwargs)


async def get_redis():
    global _redis_client, _redis_available

    # Return cached client
    if _redis_client is not None:
        return _redis_client

    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=2,
        )
        # Probe connection
        await client.ping()
        _redis_client = client
        _redis_available = True
        logger.info("[redis] Connected to Redis at %s", settings.REDIS_URL)
    except Exception as exc:
        logger.warning(
            "[redis] Redis unavailable (%s). Using in-process asyncio lock fallback. "
            "Distributed locking across multiple processes will NOT work.",
            exc,
        )
        _redis_client = _FallbackRedis()
        _redis_available = False

    return _redis_client


async def close_redis():
    global _redis_client, _redis_available
    if _redis_available and _redis_client is not None:
        try:
            await _redis_client.aclose()
        except Exception:
            pass
    _redis_client = None
    _redis_available = False
