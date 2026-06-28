from __future__ import annotations

from copy import deepcopy

from app.schemas.reminders import Reminder, ReminderCreate, ReminderUpdate
from app.services.base import BaseService
from app.services.mock_data import get_store


class ReminderService(BaseService):
    table_name = "reminders"

    def __init__(self) -> None:
        super().__init__()
        self.store = get_store()

    def list_reminders(self) -> list[Reminder]:
        if self.using_mock:
            return [Reminder.model_validate(deepcopy(item)) for item in self.store["reminders"]]

        response = self.supabase.table(self.table_name).select("*").order("due_at", desc=False).execute()
        return [Reminder.model_validate(item) for item in response.data]

    def get_reminder(self, reminder_id: str) -> Reminder:
        if self.using_mock:
            record = self._select_one_from_memory(self.store["reminders"], "id", reminder_id, "Lembrete")
            return Reminder.model_validate(record)

        response = self.supabase.table(self.table_name).select("*").eq("id", reminder_id).limit(1).execute()
        if not response.data:
            raise self._not_found("Lembrete")
        return Reminder.model_validate(response.data[0])

    def create_reminder(self, payload: ReminderCreate) -> Reminder:
        if self.using_mock:
            record = Reminder(
                id=self._new_id("rem"),
                created_at=self._now(),
                **payload.model_dump(),
            ).model_dump(mode="json")
            self.store["reminders"].insert(0, record)
            return Reminder.model_validate(record)

        response = self.supabase.table(self.table_name).insert(payload.model_dump()).execute()
        return Reminder.model_validate(response.data[0])

    def update_reminder(self, reminder_id: str, payload: ReminderUpdate) -> Reminder:
        update_data = payload.model_dump(exclude_unset=True)

        if self.using_mock:
            record = self._update_in_memory(
                self.store["reminders"],
                "id",
                reminder_id,
                lambda item: {**item, **update_data},
                "Lembrete",
            )
            return Reminder.model_validate(record)

        self.supabase.table(self.table_name).update(update_data).eq("id", reminder_id).execute()
        return self.get_reminder(reminder_id)

    def delete_reminder(self, reminder_id: str) -> None:
        if self.using_mock:
            self._delete_in_memory(self.store["reminders"], "id", reminder_id, "Lembrete")
            return

        self.supabase.table(self.table_name).delete().eq("id", reminder_id).execute()
