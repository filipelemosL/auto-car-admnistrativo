from fastapi import APIRouter, status
from fastapi.responses import StreamingResponse

from app.schemas.common import DeleteResponse
from app.schemas.service_reports import (
    ImageAttachmentRequest,
    ServiceReport,
    ServiceReportCreate,
    ServiceReportUpdate,
)
from app.services.service_reports import ServiceReportService

router = APIRouter()
service = ServiceReportService()


@router.get("", response_model=list[ServiceReport])
def list_reports() -> list[ServiceReport]:
    return service.list_reports()


@router.get("/{report_id}", response_model=ServiceReport)
def get_report(report_id: str) -> ServiceReport:
    return service.get_report(report_id)


@router.post("", response_model=ServiceReport, status_code=status.HTTP_201_CREATED)
def create_report(payload: ServiceReportCreate) -> ServiceReport:
    return service.create_report(payload)


@router.put("/{report_id}", response_model=ServiceReport)
def update_report(report_id: str, payload: ServiceReportUpdate) -> ServiceReport:
    return service.update_report(report_id, payload)


@router.delete("/{report_id}", response_model=DeleteResponse)
def delete_report(report_id: str) -> DeleteResponse:
    service.delete_report(report_id)
    return DeleteResponse(detail="Relatorio removido com sucesso.")


@router.post("/{report_id}/images", response_model=ServiceReport)
def attach_image(report_id: str, payload: ImageAttachmentRequest) -> ServiceReport:
    return service.append_image(report_id, payload)


@router.get("/{report_id}/exports/pdf")
def export_report_pdf(report_id: str) -> StreamingResponse:
    file_buffer = service.build_pdf_export(report_id)
    return StreamingResponse(
        file_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="relatorio-servico-{report_id}.pdf"'},
    )
