from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.budgets import BudgetItem


JourneyStage = Literal[
    "client_selection",
    "diagnosis",
    "budget",
    "service",
    "notification",
    "finance",
    "completed",
]


ServiceTaskStatus = Literal[
    "Aguardando inicio",
    "Em andamento",
    "Aguardando pecas",
    "Concluido",
]


class DiagnosisRecord(BaseModel):
    customer_complaint: str = ""
    mechanic_diagnosis: str = ""
    diagnostic_tool: str = ""
    dtc_codes: str = ""
    conclusion: str = ""


class ServiceTask(BaseModel):
    id: str | None = None
    budget_item_id: str | None = None
    description: str
    status: ServiceTaskStatus = "Aguardando inicio"
    notes: str = ""
    images: list[str] = Field(default_factory=list)
    completed_at: datetime | None = None


class PaymentRecord(BaseModel):
    document_type: Literal["NF", "Recibo"] = "Recibo"
    paid: bool = False
    payment_method: str = ""
    amount_paid: float = Field(default=0, ge=0)
    paid_at: datetime | None = None
    fiscal_provider_reference: str | None = None


class ServiceOrderBase(BaseModel):
    client_id: str | None = None
    client_name: str = ""
    client_phone: str = ""
    vehicle_id: str | None = None
    vehicle_label: str = ""
    stage: JourneyStage = "client_selection"
    status: Literal["Aberta", "Aguardando aprovacao", "Em servico", "Aguardando pagamento", "Concluida"] = "Aberta"
    diagnosis: DiagnosisRecord = Field(default_factory=DiagnosisRecord)
    budget_id: str | None = None
    budget_items: list[BudgetItem] = Field(default_factory=list)
    service_tasks: list[ServiceTask] = Field(default_factory=list)
    payment: PaymentRecord = Field(default_factory=PaymentRecord)
    ready_message: str = ""


class ServiceOrderCreate(ServiceOrderBase):
    pass


class ServiceOrderUpdate(BaseModel):
    client_id: str | None = None
    client_name: str | None = None
    client_phone: str | None = None
    vehicle_id: str | None = None
    vehicle_label: str | None = None
    stage: JourneyStage | None = None
    status: Literal["Aberta", "Aguardando aprovacao", "Em servico", "Aguardando pagamento", "Concluida"] | None = None
    diagnosis: DiagnosisRecord | None = None
    budget_id: str | None = None
    budget_items: list[BudgetItem] | None = None
    service_tasks: list[ServiceTask] | None = None
    payment: PaymentRecord | None = None
    ready_message: str | None = None


class ServiceOrder(ServiceOrderBase):
    id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    completed_at: datetime | None = None


class ApproveBudgetRequest(BaseModel):
    budget_id: str | None = None
    items: list[BudgetItem] = Field(default_factory=list)


class AddExtraServiceRequest(BaseModel):
    description: str
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(default=0, ge=0)
    notes: str = ""


class CompletePaymentRequest(PaymentRecord):
    pass


class CompleteTaskRequest(BaseModel):
    notes: str = ""
    images: list[str] = Field(default_factory=list)


class WhatsAppAction(BaseModel):
    phone: str
    message: str
    url: str
