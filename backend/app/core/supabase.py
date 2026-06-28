from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Client | None:
    settings = get_settings()
    if settings.database_mode != "supabase":
        return None
    return create_client(settings.supabase_url or "", settings.supabase_key or "")
