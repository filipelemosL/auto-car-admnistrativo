from __future__ import annotations

from copy import deepcopy
from io import BytesIO

from app.schemas.finance import FinancialEntry, FinancialEntryCreate, FinancialEntryUpdate, FinancialSummary
from app.services.base import BaseService
from app.services.mock_data import get_store
from app.templates.pdf_builders import build_financial_summary_pdf


class FinanceService(BaseService):
    table_name = "finance_entries"

    def __init__(self) -> None:
        super().__init__()
        self.store = get_store()

    def list_entries(self) -> list[FinancialEntry]:
        if self.using_mock:
            return [FinancialEntry.model_validate(deepcopy(item)) for item in self.store["finance_entries"]]

        response = self.supabase.table(self.table_name).select("*").order("issued_at", desc=True).execute()
        return [FinancialEntry.model_validate(item) for item in response.data]

    def get_entry(self, entry_id: str) -> FinancialEntry:
        if self.using_mock:
            record = self._select_one_from_memory(self.store["finance_entries"], "id", entry_id, "Lancamento financeiro")
            return FinancialEntry.model_validate(record)

        response = self.supabase.table(self.table_name).select("*").eq("id", entry_id).limit(1).execute()
        if not response.data:
            raise self._not_found("Lancamento financeiro")
        return FinancialEntry.model_validate(response.data[0])

    def create_entry(self, payload: FinancialEntryCreate) -> FinancialEntry:
        if self.using_mock:
            record = FinancialEntry(
                id=self._new_id("fin"),
                created_at=self._now(),
                **payload.model_dump(),
            ).model_dump(mode="json")
            self.store["finance_entries"].insert(0, record)
            return FinancialEntry.model_validate(record)

        response = self.supabase.table(self.table_name).insert(payload.model_dump()).execute()
        return FinancialEntry.model_validate(response.data[0])

    def update_entry(self, entry_id: str, payload: FinancialEntryUpdate) -> FinancialEntry:
        update_data = payload.model_dump(exclude_unset=True)

        if self.using_mock:
            record = self._update_in_memory(
                self.store["finance_entries"],
                "id",
                entry_id,
                lambda item: {**item, **update_data},
                "Lancamento financeiro",
            )
            return FinancialEntry.model_validate(record)

        self.supabase.table(self.table_name).update(update_data).eq("id", entry_id).execute()
        return self.get_entry(entry_id)

    def delete_entry(self, entry_id: str) -> None:
        if self.using_mock:
            self._delete_in_memory(self.store["finance_entries"], "id", entry_id, "Lancamento financeiro")
            return

        self.supabase.table(self.table_name).delete().eq("id", entry_id).execute()

    def get_summary(self, period: str, reference: str) -> FinancialSummary:
        entries = [entry for entry in self.list_entries() if self._matches_period(entry.reference_month, period, reference)]
        total_revenue = sum(entry.amount for entry in entries if entry.type == "Receita")
        total_cost = sum(entry.amount for entry in entries if entry.type == "Custo")
        return FinancialSummary(
            period=period,
            reference=reference,
            total_revenue=total_revenue,
            total_cost=total_cost,
            profit=total_revenue - total_cost,
            entries=entries,
        )

    def export_summary_pdf(self, period: str, reference: str) -> BytesIO:
        summary = self.get_summary(period, reference)
        return build_financial_summary_pdf(summary)

    def _matches_period(self, reference_month: str, period: str, reference: str) -> bool:
        year, month = reference_month.split("-")

        if period == "monthly":
            return reference_month == reference
        if period == "yearly":
            return year == reference

        if period == "quarterly":
            if "-Q" not in reference:
                return False
            ref_year, ref_quarter = reference.split("-Q")
            quarter_map = {
                "01": "1",
                "02": "1",
                "03": "1",
                "04": "2",
                "05": "2",
                "06": "2",
                "07": "3",
                "08": "3",
                "09": "3",
                "10": "4",
                "11": "4",
                "12": "4",
            }
            return year == ref_year and quarter_map[month] == ref_quarter

        return False
