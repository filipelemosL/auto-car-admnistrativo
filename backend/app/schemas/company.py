from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class CompanySettings(BaseModel):
    id: str = "company_default"
    trade_name: str = "AutoCar"
    legal_name: str = "AutoCar Oficina Mecanica"
    cnpj: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    city_uf: str = ""
    cep: str = ""
    technical_responsible: str = ""
    fiscal_provider: str | None = None
    fiscal_provider_enabled: bool = False
    updated_at: datetime | None = None


class CompanySettingsUpdate(BaseModel):
    trade_name: str | None = None
    legal_name: str | None = None
    cnpj: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    city_uf: str | None = None
    cep: str | None = None
    technical_responsible: str | None = None
    fiscal_provider: str | None = None
    fiscal_provider_enabled: bool | None = None


class FixedCost(BaseModel):
    id: str
    description: str
    amount: float = Field(ge=0)
    recurrence: Literal["Mensal", "Trimestral", "Anual"] = "Mensal"
    due_day: int = Field(ge=1, le=31)
    alert_enabled: bool = True
    active: bool = True
    created_at: datetime | None = None


class FixedCostCreate(BaseModel):
    description: str
    amount: float = Field(ge=0)
    recurrence: Literal["Mensal", "Trimestral", "Anual"] = "Mensal"
    due_day: int = Field(ge=1, le=31)
    alert_enabled: bool = True
    active: bool = True


class FixedCostUpdate(BaseModel):
    description: str | None = None
    amount: float | None = Field(default=None, ge=0)
    recurrence: Literal["Mensal", "Trimestral", "Anual"] | None = None
    due_day: int | None = Field(default=None, ge=1, le=31)
    alert_enabled: bool | None = None
    active: bool | None = None


class EmergencyReservePlan(BaseModel):
    monthly_fixed_cost_average: float
    target_amount: float
    contribution_3_months: float
    contribution_6_months: float
    contribution_12_months: float
