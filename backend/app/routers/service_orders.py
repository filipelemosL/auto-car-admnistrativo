from fastapi import APIRouter, Query, status

from app.schemas.service_orders import (
    AddExtraServiceRequest,
    ApproveBudgetRequest,
    CompletePaymentRequest,
    CompleteTaskRequest,
    DiagnosisRecord,
    ServiceOrder,
    ServiceOrderCreate,
    ServiceOrderUpdate,
    WhatsAppAction,
)
from app.services.service_orders import ServiceOrderService

router = APIRouter()
service = ServiceOrderService()


@router.get("", response_model=list[ServiceOrder])
def list_orders(include_completed: bool = Query(False)) -> list[ServiceOrder]:
    return service.list_orders(include_completed=include_completed)


@router.get("/{order_id}", response_model=ServiceOrder)
def get_order(order_id: str) -> ServiceOrder:
    return service.get_order(order_id)


@router.post("", response_model=ServiceOrder, status_code=status.HTTP_201_CREATED)
def create_order(payload: ServiceOrderCreate) -> ServiceOrder:
    return service.create_order(payload)


@router.put("/{order_id}", response_model=ServiceOrder)
def update_order(order_id: str, payload: ServiceOrderUpdate) -> ServiceOrder:
    return service.update_order(order_id, payload)


@router.post("/{order_id}/diagnosis", response_model=ServiceOrder)
def save_diagnosis(order_id: str, payload: DiagnosisRecord) -> ServiceOrder:
    return service.save_diagnosis(order_id, payload)


@router.post("/{order_id}/approve-budget", response_model=ServiceOrder)
def approve_budget(order_id: str, payload: ApproveBudgetRequest) -> ServiceOrder:
    return service.approve_budget(order_id, payload)


@router.post("/{order_id}/extra-service", response_model=ServiceOrder)
def add_extra_service(order_id: str, payload: AddExtraServiceRequest) -> ServiceOrder:
    return service.add_extra_service(order_id, payload)


@router.post("/{order_id}/tasks/{task_id}/complete", response_model=ServiceOrder)
def complete_task(order_id: str, task_id: str, payload: CompleteTaskRequest) -> ServiceOrder:
    return service.complete_task(order_id, task_id, notes=payload.notes, images=payload.images)


@router.get("/{order_id}/ready-whatsapp", response_model=WhatsAppAction)
def build_ready_whatsapp(order_id: str) -> WhatsAppAction:
    return service.build_ready_whatsapp(order_id)


@router.post("/{order_id}/payment", response_model=ServiceOrder)
def complete_payment(order_id: str, payload: CompletePaymentRequest) -> ServiceOrder:
    return service.complete_payment(order_id, payload)
