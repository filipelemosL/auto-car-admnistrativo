from fastapi import APIRouter, status

from app.schemas.company import (
    CompanySettings,
    CompanySettingsUpdate,
    EmergencyReservePlan,
    FixedCost,
    FixedCostCreate,
    FixedCostUpdate,
)
from app.services.company import CompanyService

router = APIRouter()
service = CompanyService()


@router.get("/settings", response_model=CompanySettings)
def get_settings() -> CompanySettings:
    return service.get_settings()


@router.put("/settings", response_model=CompanySettings)
def update_settings(payload: CompanySettingsUpdate) -> CompanySettings:
    return service.update_settings(payload)


@router.get("/fixed-costs", response_model=list[FixedCost])
def list_fixed_costs() -> list[FixedCost]:
    return service.list_fixed_costs()


@router.post("/fixed-costs", response_model=FixedCost, status_code=status.HTTP_201_CREATED)
def create_fixed_cost(payload: FixedCostCreate) -> FixedCost:
    return service.create_fixed_cost(payload)


@router.put("/fixed-costs/{cost_id}", response_model=FixedCost)
def update_fixed_cost(cost_id: str, payload: FixedCostUpdate) -> FixedCost:
    return service.update_fixed_cost(cost_id, payload)


@router.get("/emergency-reserve", response_model=EmergencyReservePlan)
def get_emergency_reserve_plan() -> EmergencyReservePlan:
    return service.get_emergency_reserve_plan()
