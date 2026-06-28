from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ReminderBase(BaseModel):
    title: str
    client_name: str
    channel: Literal["WhatsApp", "Ligacao", "Email"] = "WhatsApp"
    due_at: datetime
    recurrence: Literal["Unico", "Semanal", "Mensal", "Trimestral", "Anual"] = "Unico"
    status: Literal["Agendado", "Pendente", "Concluido"] = "Agendado"


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    title: str | None = None
    client_name: str | None = None
    channel: Literal["WhatsApp", "Ligacao", "Email"] | None = None
    due_at: datetime | None = None
    recurrence: Literal["Unico", "Semanal", "Mensal", "Trimestral", "Anual"] | None = None
    status: Literal["Agendado", "Pendente", "Concluido"] | None = None


class Reminder(ReminderBase):
    id: str
    created_at: datetime | None = None
