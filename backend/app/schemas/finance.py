from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class FinancialEntryBase(BaseModel):
    type: Literal["Receita", "Custo"]
    category: str
    document_type: Literal["NF", "Recibo", "Despesa"]
    description: str
    amount: float = Field(ge=0)
    issued_at: datetime
    reference_month: str
    status: Literal["Emitido", "Pago", "Pendente"] = "Pendente"


class FinancialEntryCreate(FinancialEntryBase):
    pass


class FinancialEntryUpdate(BaseModel):
    type: Literal["Receita", "Custo"] | None = None
    category: str | None = None
    document_type: Literal["NF", "Recibo", "Despesa"] | None = None
    description: str | None = None
    amount: float | None = Field(default=None, ge=0)
    issued_at: datetime | None = None
    reference_month: str | None = None
    status: Literal["Emitido", "Pago", "Pendente"] | None = None


class FinancialEntry(FinancialEntryBase):
    id: str
    created_at: datetime | None = None


class FinancialSummary(BaseModel):
    period: str
    reference: str
    total_revenue: float
    total_cost: float
    profit: float
    entries: list[FinancialEntry]


class FinancialAggregate(BaseModel):
    period: str
    reference: str
    total_revenue: float
    total_cost: float
    profit: float


class FinancialHistory(BaseModel):
    years: int
    monthly: list[FinancialAggregate]
    quarterly: list[FinancialAggregate]
    yearly: list[FinancialAggregate]
