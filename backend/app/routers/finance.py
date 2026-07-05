from fastapi import APIRouter, Query, status
from fastapi.responses import StreamingResponse

from app.schemas.common import DeleteResponse
from app.schemas.finance import (
    FinancialEntry,
    FinancialEntryCreate,
    FinancialEntryUpdate,
    FinancialHistory,
    FinancialSummary,
)
from app.services.finance import FinanceService

router = APIRouter()
service = FinanceService()


@router.get("", response_model=list[FinancialEntry])
def list_entries() -> list[FinancialEntry]:
    return service.list_entries()


@router.get("/summary/{period}", response_model=FinancialSummary)
def get_summary(period: str, reference: str = Query(..., description="2026-06, 2026-Q2 ou 2026")) -> FinancialSummary:
    return service.get_summary(period=period, reference=reference)


@router.get("/summary/{period}/pdf")
def export_summary_pdf(period: str, reference: str = Query(..., description="2026-06, 2026-Q2 ou 2026")) -> StreamingResponse:
    file_buffer = service.export_summary_pdf(period=period, reference=reference)
    filename = f"finance-summary-{period}-{reference}.pdf"
    return StreamingResponse(
        file_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/history", response_model=FinancialHistory)
def get_history(years: int = Query(5, ge=1, le=5)) -> FinancialHistory:
    return service.get_history(years=years)


@router.get("/{entry_id}/exports/pdf")
def export_entry_pdf(entry_id: str) -> StreamingResponse:
    file_buffer = service.export_entry_pdf(entry_id)
    filename = f"finance-entry-{entry_id}.pdf"
    return StreamingResponse(
        file_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{entry_id}", response_model=FinancialEntry)
def get_entry(entry_id: str) -> FinancialEntry:
    return service.get_entry(entry_id)


@router.post("", response_model=FinancialEntry, status_code=status.HTTP_201_CREATED)
def create_entry(payload: FinancialEntryCreate) -> FinancialEntry:
    return service.create_entry(payload)


@router.put("/{entry_id}", response_model=FinancialEntry)
def update_entry(entry_id: str, payload: FinancialEntryUpdate) -> FinancialEntry:
    return service.update_entry(entry_id, payload)


@router.delete("/{entry_id}", response_model=DeleteResponse)
def delete_entry(entry_id: str) -> DeleteResponse:
    service.delete_entry(entry_id)
    return DeleteResponse(detail="Lancamento removido com sucesso.")
