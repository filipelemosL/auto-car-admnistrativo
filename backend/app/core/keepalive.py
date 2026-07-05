from __future__ import annotations

import asyncio
import logging
from contextlib import suppress

from app.core.config import get_settings
from app.core.supabase import get_supabase_client

logger = logging.getLogger(__name__)


async def run_database_keepalive() -> None:
    settings = get_settings()
    interval_seconds = max(settings.keepalive_interval_days, 1) * 24 * 60 * 60

    if not settings.keepalive_enabled:
        logger.info("Database keepalive disabled.")
        return

    if settings.database_mode != "supabase":
        logger.info("Database keepalive skipped because database mode is %s.", settings.database_mode)
        return

    while True:
        await _ping_database(settings.keepalive_table)
        await asyncio.sleep(interval_seconds)


async def _ping_database(table_name: str) -> None:
    supabase = get_supabase_client()
    if supabase is None:
        logger.info("Database keepalive skipped because Supabase is not configured.")
        return

    try:
        await asyncio.to_thread(
            lambda: supabase.table(table_name).select("id").limit(1).execute()
        )
        logger.info("Database keepalive query completed on table %s.", table_name)
    except Exception:
        logger.exception("Database keepalive query failed on table %s.", table_name)


async def stop_database_keepalive(task: asyncio.Task[None] | None) -> None:
    if task is None:
        return

    task.cancel()
    with suppress(asyncio.CancelledError):
        await task
