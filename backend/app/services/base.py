from __future__ import annotations

from collections.abc import Callable
from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.core.supabase import get_supabase_client


class BaseService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.supabase = get_supabase_client()

    @property
    def using_mock(self) -> bool:
        return self.settings.database_mode == "mock"

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def _new_id(self, prefix: str) -> str:
        return f"{prefix}_{uuid4().hex[:8]}"

    def _not_found(self, entity: str) -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{entity} nao encontrado.",
        )

    def _select_one_from_memory(
        self,
        records: list[dict],
        key: str,
        value: str,
        entity: str,
    ) -> dict:
        for record in records:
            if record.get(key) == value:
                return deepcopy(record)
        raise self._not_found(entity)

    def _update_in_memory(
        self,
        records: list[dict],
        key: str,
        value: str,
        updater: Callable[[dict], dict],
        entity: str,
    ) -> dict:
        for index, record in enumerate(records):
            if record.get(key) == value:
                updated = updater(deepcopy(record))
                records[index] = deepcopy(updated)
                return deepcopy(updated)
        raise self._not_found(entity)

    def _delete_in_memory(
        self,
        records: list[dict],
        key: str,
        value: str,
        entity: str,
    ) -> None:
        for index, record in enumerate(records):
            if record.get(key) == value:
                records.pop(index)
                return
        raise self._not_found(entity)
