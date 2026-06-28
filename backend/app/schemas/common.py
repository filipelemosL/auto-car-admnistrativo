from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: Literal["ok"]
    environment: str
    database_mode: str
    timestamp: datetime


class DeleteResponse(BaseModel):
    detail: str


class PeriodSummaryRequest(BaseModel):
    period: Literal["monthly", "quarterly", "yearly"] = "monthly"
    reference: str
