from __future__ import annotations

from copy import deepcopy

from app.schemas.company import (
    CompanySettings,
    CompanySettingsUpdate,
    EmergencyReservePlan,
    FixedCost,
    FixedCostCreate,
    FixedCostUpdate,
)
from app.services.base import BaseService
from app.services.mock_data import get_store, save_store


class CompanyService(BaseService):
    settings_table = "company_settings"
    fixed_costs_table = "fixed_costs"

    def __init__(self) -> None:
        super().__init__()
        self.store = get_store()

    def get_settings(self) -> CompanySettings:
        if self.using_mock:
            return CompanySettings.model_validate(deepcopy(self.store["company_settings"]))

        response = self.supabase.table(self.settings_table).select("*").eq("id", "company_default").limit(1).execute()
        if not response.data:
            return CompanySettings()
        return CompanySettings.model_validate(response.data[0])

    def update_settings(self, payload: CompanySettingsUpdate) -> CompanySettings:
        update_data = payload.model_dump(exclude_unset=True)
        update_data["updated_at"] = self._now()

        if self.using_mock:
            self.store["company_settings"].update(update_data)
            save_store()
            return CompanySettings.model_validate(deepcopy(self.store["company_settings"]))

        data = {**self.get_settings().model_dump(), **update_data}
        self.supabase.table(self.settings_table).upsert(data).execute()
        return self.get_settings()

    def list_fixed_costs(self) -> list[FixedCost]:
        if self.using_mock:
            return [FixedCost.model_validate(deepcopy(item)) for item in self.store["fixed_costs"]]

        response = self.supabase.table(self.fixed_costs_table).select("*").order("due_day").execute()
        return [FixedCost.model_validate(item) for item in response.data]

    def create_fixed_cost(self, payload: FixedCostCreate) -> FixedCost:
        if self.using_mock:
            record = FixedCost(
                id=self._new_id("fix"),
                created_at=self._now(),
                **payload.model_dump(),
            ).model_dump(mode="json")
            self.store["fixed_costs"].insert(0, record)
            save_store()
            return FixedCost.model_validate(record)

        response = self.supabase.table(self.fixed_costs_table).insert(payload.model_dump()).execute()
        return FixedCost.model_validate(response.data[0])

    def update_fixed_cost(self, cost_id: str, payload: FixedCostUpdate) -> FixedCost:
        update_data = payload.model_dump(exclude_unset=True)
        if self.using_mock:
            record = self._update_in_memory(
                self.store["fixed_costs"],
                "id",
                cost_id,
                lambda item: {**item, **update_data},
                "Custo fixo",
            )
            return FixedCost.model_validate(record)

        self.supabase.table(self.fixed_costs_table).update(update_data).eq("id", cost_id).execute()
        response = self.supabase.table(self.fixed_costs_table).select("*").eq("id", cost_id).limit(1).execute()
        if not response.data:
            raise self._not_found("Custo fixo")
        return FixedCost.model_validate(response.data[0])

    def get_emergency_reserve_plan(self) -> EmergencyReservePlan:
        active_costs = [cost for cost in self.list_fixed_costs() if cost.active]
        monthly_average = sum(cost.amount for cost in active_costs)
        target = monthly_average * 6
        return EmergencyReservePlan(
            monthly_fixed_cost_average=monthly_average,
            target_amount=target,
            contribution_3_months=target / 3 if target else 0,
            contribution_6_months=target / 6 if target else 0,
            contribution_12_months=target / 12 if target else 0,
        )
