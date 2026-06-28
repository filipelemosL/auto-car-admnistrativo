from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ChecklistItem(BaseModel):
    id: str | None = None
    label: str
    done: bool = False
    notes: str | None = None


class ServiceReportBase(BaseModel):
    title: str
    client_name: str
    vehicle_label: str
    status: Literal["Em execucao", "Aguardando peca", "Concluido"] = "Em execucao"
    mechanic: str
    notes: list[str] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)
    checklist: list[ChecklistItem] = Field(default_factory=list)


class ServiceReportCreate(ServiceReportBase):
    check_in_at: datetime | None = None


class ServiceReportUpdate(BaseModel):
    title: str | None = None
    client_name: str | None = None
    vehicle_label: str | None = None
    status: Literal["Em execucao", "Aguardando peca", "Concluido"] | None = None
    mechanic: str | None = None
    notes: list[str] | None = None
    images: list[str] | None = None
    checklist: list[ChecklistItem] | None = None
    check_in_at: datetime | None = None


class ServiceReport(ServiceReportBase):
    id: str
    check_in_at: datetime | None = None
    created_at: datetime | None = None


class ImageAttachmentRequest(BaseModel):
    image_url: str
