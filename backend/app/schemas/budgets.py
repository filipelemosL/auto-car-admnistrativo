from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BudgetItem(BaseModel):
    id: str | None = None
    description: str
    quantity: int = Field(ge=1)
    unit_price: float = Field(ge=0)


class BudgetBase(BaseModel):
    client_name: str
    vehicle_label: str
    status: Literal["Rascunho", "Enviado", "Aprovado", "Recusado"] = "Rascunho"
    labor_value: float = Field(default=0, ge=0)
    notes: str = ""
    items: list[BudgetItem]


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    client_name: str | None = None
    vehicle_label: str | None = None
    status: Literal["Rascunho", "Enviado", "Aprovado", "Recusado"] | None = None
    labor_value: float | None = Field(default=None, ge=0)
    notes: str | None = None
    items: list[BudgetItem] | None = None


class Budget(BudgetBase):
    id: str
    created_at: datetime | None = None


class BudgetWhatsappExport(BaseModel):
    message: str
