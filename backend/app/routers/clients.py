from fastapi import APIRouter, status

from app.schemas.admin import ClientTransparency
from app.schemas.clients import Client, ClientCreate, ClientUpdate
from app.schemas.common import DeleteResponse
from app.services.admin_panels import AdminPanelService
from app.services.clients import ClientService

router = APIRouter()
service = ClientService()
admin_service = AdminPanelService()


@router.get("", response_model=list[Client])
def list_clients() -> list[Client]:
    return service.list_clients()


@router.get("/search", response_model=list[Client])
def search_clients(q: str) -> list[Client]:
    return admin_service.search_clients(q)


@router.get("/{client_id}", response_model=Client)
def get_client(client_id: str) -> Client:
    return service.get_client(client_id)


@router.get("/{client_id}/transparency", response_model=ClientTransparency)
def get_client_transparency(client_id: str) -> ClientTransparency:
    return admin_service.get_client_transparency(client_id)


@router.post("", response_model=Client, status_code=status.HTTP_201_CREATED)
def create_client(payload: ClientCreate) -> Client:
    return service.create_client(payload)


@router.put("/{client_id}", response_model=Client)
def update_client(client_id: str, payload: ClientUpdate) -> Client:
    return service.update_client(client_id, payload)


@router.delete("/{client_id}", response_model=DeleteResponse)
def delete_client(client_id: str) -> DeleteResponse:
    service.delete_client(client_id)
    return DeleteResponse(detail="Cliente removido com sucesso.")
