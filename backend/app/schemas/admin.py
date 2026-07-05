from datetime import datetime

from pydantic import BaseModel

from app.schemas.budgets import Budget
from app.schemas.clients import Client
from app.schemas.company import CompanySettings, FixedCost
from app.schemas.finance import FinancialEntry
from app.schemas.reminders import Reminder
from app.schemas.service_reports import ServiceReport
from app.schemas.service_orders import ServiceOrder


class PanelStat(BaseModel):
    label: str
    value: str


class TransparencyTool(BaseModel):
    key: str
    label: str
    description: str
    endpoint: str | None = None


class IssuedFile(BaseModel):
    key: str
    label: str
    filename: str
    description: str
    download_url: str
    mime_type: str = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


class AdminPanelOverview(BaseModel):
    key: str
    title: str
    description: str
    stats: list[PanelStat]
    tools: list[TransparencyTool]


class AppSnapshot(BaseModel):
    clients: list[Client]
    budgets: list[Budget]
    service_reports: list[ServiceReport]
    service_orders: list[ServiceOrder]
    reminders: list[Reminder]
    financial_entries: list[FinancialEntry]
    company_settings: CompanySettings
    fixed_costs: list[FixedCost]
    panels: list[AdminPanelOverview]
    issued_files: list[IssuedFile]


class TransparencyTimelineItem(BaseModel):
    occurred_at: datetime | None = None
    event_type: str
    title: str
    description: str
    status: str | None = None
    entity_id: str | None = None


class ClientTransparency(BaseModel):
    client: Client
    budgets: list[Budget]
    service_reports: list[ServiceReport]
    reminders: list[Reminder]
    financial_entries: list[FinancialEntry]
    timeline: list[TransparencyTimelineItem]


class BudgetTransparency(BaseModel):
    budget: Budget
    items_total: float
    labor_value: float
    total: float
    whatsapp_message: str
    available_exports: list[TransparencyTool]


class ServiceReportTransparency(BaseModel):
    report: ServiceReport
    done_items: int
    pending_items: int
    image_count: int
    available_exports: list[TransparencyTool]
