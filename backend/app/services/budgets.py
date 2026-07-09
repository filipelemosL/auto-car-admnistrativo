from __future__ import annotations

from copy import deepcopy
from io import BytesIO

from app.schemas.budgets import Budget, BudgetCreate, BudgetPreset, BudgetPresetCreate, BudgetPresetUpdate, BudgetUpdate
from app.services.base import BaseService
from app.services.mock_data import get_store, save_store
from app.templates.pdf_builders import build_budget_pdf
from app.templates.whatsapp import build_budget_whatsapp_message


class BudgetService(BaseService):
    table_name = "budgets"
    preset_table_name = "budget_presets"

    def __init__(self) -> None:
        super().__init__()
        self.store = get_store()

    def list_budgets(self) -> list[Budget]:
        if self.using_mock:
            return [Budget.model_validate(deepcopy(item)) for item in self.store["budgets"]]

        response = self.supabase.table(self.table_name).select("*").order("created_at", desc=True).execute()
        return [Budget.model_validate(item) for item in response.data]

    def get_budget(self, budget_id: str) -> Budget:
        if self.using_mock:
            record = self._select_one_from_memory(self.store["budgets"], "id", budget_id, "Orcamento")
            return Budget.model_validate(record)

        response = self.supabase.table(self.table_name).select("*").eq("id", budget_id).limit(1).execute()
        if not response.data:
            raise self._not_found("Orcamento")
        return Budget.model_validate(response.data[0])

    def create_budget(self, payload: BudgetCreate) -> Budget:
        if self.using_mock:
            record = Budget(
                id=self._new_id("orc"),
                created_at=self._now(),
                **payload.model_dump(),
            ).model_dump(mode="json")
            self.store["budgets"].insert(0, record)
            save_store()
            return Budget.model_validate(record)

        response = self.supabase.table(self.table_name).insert(payload.model_dump()).execute()
        return Budget.model_validate(response.data[0])

    def update_budget(self, budget_id: str, payload: BudgetUpdate) -> Budget:
        update_data = payload.model_dump(exclude_unset=True)

        if self.using_mock:
            record = self._update_in_memory(
                self.store["budgets"],
                "id",
                budget_id,
                lambda item: {**item, **update_data},
                "Orcamento",
            )
            return Budget.model_validate(record)

        self.supabase.table(self.table_name).update(update_data).eq("id", budget_id).execute()
        return self.get_budget(budget_id)

    def delete_budget(self, budget_id: str) -> None:
        if self.using_mock:
            self._delete_in_memory(self.store["budgets"], "id", budget_id, "Orcamento")
            return

        self.supabase.table(self.table_name).delete().eq("id", budget_id).execute()

    def build_whatsapp_export(self, budget_id: str) -> str:
        budget = self.get_budget(budget_id)
        return build_budget_whatsapp_message(budget)

    def build_pdf_export(self, budget_id: str) -> BytesIO:
        budget = self.get_budget(budget_id)
        return build_budget_pdf(budget)

    def list_presets(self) -> list[BudgetPreset]:
        if self.using_mock:
            return [BudgetPreset.model_validate(deepcopy(item)) for item in self.store["budget_presets"]]

        response = self.supabase.table(self.preset_table_name).select("*").order("created_at", desc=True).execute()
        return [BudgetPreset.model_validate(item) for item in response.data]

    def create_preset(self, payload: BudgetPresetCreate) -> BudgetPreset:
        if self.using_mock:
            record = BudgetPreset(
                id=self._new_id("pre"),
                created_at=self._now(),
                **payload.model_dump(),
            ).model_dump(mode="json")
            self.store["budget_presets"].insert(0, record)
            save_store()
            return BudgetPreset.model_validate(record)

        response = self.supabase.table(self.preset_table_name).insert(payload.model_dump()).execute()
        return BudgetPreset.model_validate(response.data[0])

    def update_preset(self, preset_id: str, payload: BudgetPresetUpdate) -> BudgetPreset:
        update_data = payload.model_dump(exclude_unset=True)
        if self.using_mock:
            record = self._update_in_memory(
                self.store["budget_presets"],
                "id",
                preset_id,
                lambda item: {**item, **update_data},
                "Predefinicao de orcamento",
            )
            return BudgetPreset.model_validate(record)

        self.supabase.table(self.preset_table_name).update(update_data).eq("id", preset_id).execute()
        response = self.supabase.table(self.preset_table_name).select("*").eq("id", preset_id).limit(1).execute()
        if not response.data:
            raise self._not_found("Predefinicao de orcamento")
        return BudgetPreset.model_validate(response.data[0])

    def delete_preset(self, preset_id: str) -> None:
        if self.using_mock:
            self._delete_in_memory(self.store["budget_presets"], "id", preset_id, "Predefinicao de orcamento")
            return

        self.supabase.table(self.preset_table_name).delete().eq("id", preset_id).execute()
