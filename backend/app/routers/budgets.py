from fastapi import APIRouter, status
from fastapi.responses import StreamingResponse

from app.schemas.budgets import Budget, BudgetCreate, BudgetUpdate, BudgetWhatsappExport
from app.schemas.common import DeleteResponse
from app.services.budgets import BudgetService

router = APIRouter()
service = BudgetService()


@router.get("", response_model=list[Budget])
def list_budgets() -> list[Budget]:
    return service.list_budgets()


@router.get("/{budget_id}", response_model=Budget)
def get_budget(budget_id: str) -> Budget:
    return service.get_budget(budget_id)


@router.post("", response_model=Budget, status_code=status.HTTP_201_CREATED)
def create_budget(payload: BudgetCreate) -> Budget:
    return service.create_budget(payload)


@router.put("/{budget_id}", response_model=Budget)
def update_budget(budget_id: str, payload: BudgetUpdate) -> Budget:
    return service.update_budget(budget_id, payload)


@router.delete("/{budget_id}", response_model=DeleteResponse)
def delete_budget(budget_id: str) -> DeleteResponse:
    service.delete_budget(budget_id)
    return DeleteResponse(detail="Orcamento removido com sucesso.")


@router.get("/{budget_id}/exports/whatsapp", response_model=BudgetWhatsappExport)
def export_budget_whatsapp(budget_id: str) -> BudgetWhatsappExport:
    return BudgetWhatsappExport(message=service.build_whatsapp_export(budget_id))


@router.get("/{budget_id}/exports/pdf")
def export_budget_pdf(budget_id: str) -> StreamingResponse:
    file_buffer = service.build_pdf_export(budget_id)
    return StreamingResponse(
        file_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="orcamento-{budget_id}.pdf"'},
    )
