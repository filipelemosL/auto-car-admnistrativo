from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.services.documents import DocumentService

router = APIRouter()
service = DocumentService()

DOCX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


@router.get("/nfe/{nfe_id}/download")
def download_nfe(nfe_id: str) -> StreamingResponse:
    filename, file_buffer = service.render_nfe_document(nfe_id)
    return _docx_response(filename, file_buffer)


@router.get("/orcamento/{orcamento_id}/download")
def download_orcamento(orcamento_id: str) -> StreamingResponse:
    filename, file_buffer = service.render_budget_document(orcamento_id)
    return _docx_response(filename, file_buffer)


@router.get("/relatorio/{relatorio_id}/download")
def download_relatorio(relatorio_id: str) -> StreamingResponse:
    filename, file_buffer = service.render_report_document(relatorio_id)
    return _docx_response(filename, file_buffer)


def _docx_response(filename: str, file_buffer) -> StreamingResponse:
    return StreamingResponse(
        file_buffer,
        media_type=DOCX_MEDIA_TYPE,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
