from __future__ import annotations

from copy import deepcopy
from urllib.parse import quote

from app.schemas.budgets import BudgetCreate, BudgetItem
from app.schemas.finance import FinancialEntryCreate
from app.schemas.service_orders import (
    AddExtraServiceRequest,
    ApproveBudgetRequest,
    CompletePaymentRequest,
    DiagnosisRecord,
    ServiceOrder,
    ServiceOrderCreate,
    ServiceOrderUpdate,
    ServiceTask,
    WhatsAppAction,
)
from app.services.base import BaseService
from app.services.budgets import BudgetService
from app.services.finance import FinanceService
from app.services.mock_data import get_store, save_store
from app.templates.formatters import format_brl


class ServiceOrderService(BaseService):
    table_name = "service_orders"

    def __init__(self) -> None:
        super().__init__()
        self.store = get_store()
        self.budgets = BudgetService()
        self.finance = FinanceService()

    def list_orders(self, include_completed: bool = False) -> list[ServiceOrder]:
        if self.using_mock:
            records = [ServiceOrder.model_validate(deepcopy(item)) for item in self.store["service_orders"]]
        else:
            response = self.supabase.table(self.table_name).select("*").order("created_at", desc=True).execute()
            records = [ServiceOrder.model_validate(item) for item in response.data]

        if include_completed:
            return records
        return [record for record in records if record.stage != "completed" and record.status != "Concluida"]

    def get_order(self, order_id: str) -> ServiceOrder:
        if self.using_mock:
            record = self._select_one_from_memory(self.store["service_orders"], "id", order_id, "Jornada")
            return ServiceOrder.model_validate(record)

        response = self.supabase.table(self.table_name).select("*").eq("id", order_id).limit(1).execute()
        if not response.data:
            raise self._not_found("Jornada")
        return ServiceOrder.model_validate(response.data[0])

    def create_order(self, payload: ServiceOrderCreate) -> ServiceOrder:
        data = payload.model_dump(mode="json")
        data["updated_at"] = self._now().isoformat()

        if self.using_mock:
            record = ServiceOrder(
                id=self._new_id("jor"),
                created_at=self._now(),
                **data,
            ).model_dump(mode="json")
            self.store["service_orders"].insert(0, record)
            save_store()
            return ServiceOrder.model_validate(record)

        response = self.supabase.table(self.table_name).insert(data).execute()
        return ServiceOrder.model_validate(response.data[0])

    def update_order(self, order_id: str, payload: ServiceOrderUpdate) -> ServiceOrder:
        update_data = payload.model_dump(mode="json", exclude_unset=True)
        update_data["updated_at"] = self._now().isoformat()

        if self.using_mock:
            record = self._update_in_memory(
                self.store["service_orders"],
                "id",
                order_id,
                lambda item: {**item, **update_data},
                "Jornada",
            )
            return ServiceOrder.model_validate(record)

        self.supabase.table(self.table_name).update(update_data).eq("id", order_id).execute()
        return self.get_order(order_id)

    def delete_order(self, order_id: str) -> None:
        if self.using_mock:
            self._delete_in_memory(self.store["service_orders"], "id", order_id, "Jornada")
            return

        self.supabase.table(self.table_name).delete().eq("id", order_id).execute()

    def save_diagnosis(self, order_id: str, payload: DiagnosisRecord) -> ServiceOrder:
        return self.update_order(
            order_id,
            ServiceOrderUpdate(
                diagnosis=payload,
                stage="budget",
                status="Aberta",
            ),
        )

    def approve_budget(self, order_id: str, payload: ApproveBudgetRequest) -> ServiceOrder:
        order = self.get_order(order_id)
        items = payload.items or order.budget_items
        budget_id = payload.budget_id or order.budget_id

        if not budget_id and items:
            budget = self.budgets.create_budget(
                BudgetCreate(
                    client_name=order.client_name,
                    vehicle_label=order.vehicle_label,
                    status="Aprovado",
                    labor_value=0,
                    notes=order.diagnosis.conclusion,
                    items=items,
                )
            )
            budget_id = budget.id

        service_tasks = self._merge_service_tasks(order.service_tasks, items)
        return self.update_order(
            order_id,
            ServiceOrderUpdate(
                budget_id=budget_id,
                budget_items=items,
                service_tasks=service_tasks,
                stage="service",
                status="Em servico",
            ),
        )

    def add_extra_service(self, order_id: str, payload: AddExtraServiceRequest) -> ServiceOrder:
        order = self.get_order(order_id)
        item = BudgetItem(
            id=self._new_id("item"),
            description=payload.description,
            quantity=payload.quantity,
            unit_price=payload.unit_price,
        )
        return self.update_order(
            order_id,
            ServiceOrderUpdate(
                budget_items=[*order.budget_items, item],
                stage="budget",
                status="Aguardando aprovacao",
            ),
        )

    def complete_task(self, order_id: str, task_id: str, notes: str = "", images: list[str] | None = None) -> ServiceOrder:
        order = self.get_order(order_id)
        updated_tasks: list[ServiceTask] = []
        for task in order.service_tasks:
            if task.id == task_id:
                task.status = "Concluido"
                task.notes = notes or task.notes
                task.images = images if images is not None else task.images
                task.completed_at = self._now()
            updated_tasks.append(task)

        stage = "notification" if updated_tasks and all(task.status == "Concluido" for task in updated_tasks) else "service"
        status = "Aguardando pagamento" if stage == "notification" else "Em servico"
        ready_message = self.build_ready_message(ServiceOrder.model_validate({**order.model_dump(), "service_tasks": updated_tasks}))
        return self.update_order(
            order_id,
            ServiceOrderUpdate(
                service_tasks=updated_tasks,
                stage=stage,
                status=status,
                ready_message=ready_message,
            ),
        )

    def build_ready_whatsapp(self, order_id: str) -> WhatsAppAction:
        order = self.get_order(order_id)
        message = order.ready_message or self.build_ready_message(order)
        phone = self._normalize_phone(order.client_phone)
        return WhatsAppAction(
            phone=phone,
            message=message,
            url=f"https://wa.me/{phone}?text={quote(message)}",
        )

    def complete_payment(self, order_id: str, payload: CompletePaymentRequest) -> ServiceOrder:
        order = self.get_order(order_id)
        paid_at = payload.paid_at or self._now()
        payment = payload.model_copy(update={"paid": True, "paid_at": paid_at})

        self.finance.create_entry(
            FinancialEntryCreate(
                type="Receita",
                category="Servicos",
                document_type=payment.document_type,
                description=f"{order.id} - {order.client_name} - {order.vehicle_label}",
                amount=payment.amount_paid,
                issued_at=paid_at,
                reference_month=paid_at.strftime("%Y-%m"),
                status="Pago",
            )
        )
        return self.update_order(
            order_id,
            ServiceOrderUpdate(
                payment=payment,
                stage="completed",
                status="Concluida",
            ),
        )

    def build_ready_message(self, order: ServiceOrder) -> str:
        tasks = "\n".join(
            f"- {task.description}: {task.status}" for task in order.service_tasks
        )
        return "\n".join(
            [
                "*AutoCar - Servico pronto*",
                f"Cliente: {order.client_name}",
                f"Veiculo: {order.vehicle_label}",
                "",
                "Etapas executadas:",
                tasks or "- Nenhuma etapa registrada",
                "",
                "Seu veiculo esta pronto para retirada. Caso deseje, respondemos por aqui mesmo.",
            ]
        )

    def _merge_service_tasks(self, existing_tasks: list[ServiceTask], items: list[BudgetItem]) -> list[ServiceTask]:
        existing_by_item = {
            task.budget_item_id: task for task in existing_tasks if task.budget_item_id
        }
        tasks = list(existing_tasks)
        for item in items:
            if item.id and item.id in existing_by_item:
                continue
            tasks.append(
                ServiceTask(
                    id=self._new_id("tsk"),
                    budget_item_id=item.id,
                    description=item.description,
                    status="Aguardando inicio",
                )
            )
        return tasks

    def _normalize_phone(self, phone: str) -> str:
        digits = "".join(char for char in phone if char.isdigit())
        if not digits.startswith("55"):
            digits = f"55{digits}"
        return digits
