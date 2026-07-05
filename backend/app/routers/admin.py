from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.schemas.admin import AdminPanelOverview, AppSnapshot, IssuedFile
from app.services.admin_panels import AdminPanelService

router = APIRouter()
service = AdminPanelService()

PROJECT_ROOT = Path(__file__).resolve().parents[3]
FILES_DIR = PROJECT_ROOT / "frontend" / "public" / "assets" / "files"
ALLOWED_FILES = {
    "autocar_orcamento.docx",
    "autocar_relatorio.docx",
    "autocar_nfe.docx",
}


@router.get("/snapshot", response_model=AppSnapshot)
def get_app_snapshot() -> AppSnapshot:
    return service.get_snapshot()


@router.get("/panels", response_model=list[AdminPanelOverview])
def get_panels() -> list[AdminPanelOverview]:
    return service.get_panel_overview()


@router.get("/files", response_model=list[IssuedFile])
def list_issued_files() -> list[IssuedFile]:
    return service.get_issued_files()


@router.get("/files/{filename}")
def download_issued_file(filename: str) -> FileResponse:
    if filename not in ALLOWED_FILES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo nao encontrado.",
        )

    file_path = FILES_DIR / filename
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo nao encontrado no diretorio de modelos.",
        )

    return FileResponse(
        file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
