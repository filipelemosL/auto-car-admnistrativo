from fastapi import APIRouter, status

from app.schemas.common import DeleteResponse
from app.schemas.reminders import Reminder, ReminderCreate, ReminderUpdate
from app.services.reminders import ReminderService

router = APIRouter()
service = ReminderService()


@router.get("", response_model=list[Reminder])
def list_reminders() -> list[Reminder]:
    return service.list_reminders()


@router.get("/{reminder_id}", response_model=Reminder)
def get_reminder(reminder_id: str) -> Reminder:
    return service.get_reminder(reminder_id)


@router.post("", response_model=Reminder, status_code=status.HTTP_201_CREATED)
def create_reminder(payload: ReminderCreate) -> Reminder:
    return service.create_reminder(payload)


@router.put("/{reminder_id}", response_model=Reminder)
def update_reminder(reminder_id: str, payload: ReminderUpdate) -> Reminder:
    return service.update_reminder(reminder_id, payload)


@router.delete("/{reminder_id}", response_model=DeleteResponse)
def delete_reminder(reminder_id: str) -> DeleteResponse:
    service.delete_reminder(reminder_id)
    return DeleteResponse(detail="Lembrete removido com sucesso.")
