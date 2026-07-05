from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

from app.schemas.admin import (
    AdminPanelOverview,
    AppSnapshot,
    BudgetTransparency,
    ClientTransparency,
    IssuedFile,
    PanelStat,
    ServiceReportTransparency,
    TransparencyTimelineItem,
    TransparencyTool,
)
from app.schemas.budgets import Budget
from app.schemas.clients import Client
from app.schemas.finance import FinancialEntry
from app.schemas.reminders import Reminder
from app.schemas.service_reports import ServiceReport
from app.services.budgets import BudgetService
from app.services.clients import ClientService
from app.services.company import CompanyService
from app.services.finance import FinanceService
from app.services.reminders import ReminderService
from app.services.service_reports import ServiceReportService
from app.services.service_orders import ServiceOrderService
from app.templates.formatters import format_brl
from app.templates.whatsapp import build_budget_whatsapp_message


class AdminPanelService:
    def __init__(self) -> None:
        self.clients = ClientService()
        self.company = CompanyService()
        self.budgets = BudgetService()
        self.service_reports = ServiceReportService()
        self.service_orders = ServiceOrderService()
        self.reminders = ReminderService()
        self.finance = FinanceService()

    def get_snapshot(self) -> AppSnapshot:
        clients = self.clients.list_clients()
        budgets = self.budgets.list_budgets()
        reports = self.service_reports.list_reports()
        orders = self.service_orders.list_orders()
        reminders = self.reminders.list_reminders()
        entries = self.finance.list_entries()
        company_settings = self.company.get_settings()
        fixed_costs = self.company.list_fixed_costs()

        return AppSnapshot(
            clients=clients,
            budgets=budgets,
            service_reports=reports,
            service_orders=orders,
            reminders=reminders,
            financial_entries=entries,
            company_settings=company_settings,
            fixed_costs=fixed_costs,
            panels=self.get_panel_overview(clients, budgets, reports, reminders, entries),
            issued_files=self.get_issued_files(),
        )

    def get_issued_files(self) -> list[IssuedFile]:
        return [
            IssuedFile(
                key="budget",
                label="Modelo de orcamento",
                filename="autocar_orcamento.docx",
                description="Documento-base para proposta comercial estruturada.",
                download_url="/api/admin/files/autocar_orcamento.docx",
            ),
            IssuedFile(
                key="service_report",
                label="Modelo de relatorio tecnico",
                filename="autocar_relatorio.docx",
                description="Documento-base para checklist, notas e evidencias do servico.",
                download_url="/api/admin/files/autocar_relatorio.docx",
            ),
            IssuedFile(
                key="nfe",
                label="Modelo de NFe",
                filename="autocar_nfe.docx",
                description="Documento-base para expedicao fiscal e comprovantes financeiros.",
                download_url="/api/admin/files/autocar_nfe.docx",
            ),
        ]

    def get_panel_overview(
        self,
        clients: list[Client] | None = None,
        budgets: list[Budget] | None = None,
        reports: list[ServiceReport] | None = None,
        reminders: list[Reminder] | None = None,
        entries: list[FinancialEntry] | None = None,
    ) -> list[AdminPanelOverview]:
        clients = clients if clients is not None else self.clients.list_clients()
        budgets = budgets if budgets is not None else self.budgets.list_budgets()
        reports = reports if reports is not None else self.service_reports.list_reports()
        reminders = reminders if reminders is not None else self.reminders.list_reminders()
        entries = entries if entries is not None else self.finance.list_entries()

        vehicles_count = sum(len(client.vehicles) for client in clients)
        open_budgets = [budget for budget in budgets if budget.status in {"Rascunho", "Enviado"}]
        active_reports = [report for report in reports if report.status != "Concluido"]
        pending_reminders = [reminder for reminder in reminders if reminder.status != "Concluido"]
        revenue = sum(entry.amount for entry in entries if entry.type == "Receita")
        costs = sum(entry.amount for entry in entries if entry.type == "Custo")

        return [
            AdminPanelOverview(
                key="clients",
                title="Clientes",
                description="Cadastro, veiculos, historico e linha do tempo por cliente.",
                stats=[
                    PanelStat(label="Clientes", value=str(len(clients))),
                    PanelStat(label="Veiculos", value=str(vehicles_count)),
                    PanelStat(label="Historico", value=format_brl(sum(client.lifetime_value for client in clients))),
                ],
                tools=[
                    TransparencyTool(key="search", label="Busca por placa/nome", description="Localiza cliente e veiculo rapidamente.", endpoint="/api/clients/search"),
                    TransparencyTool(key="timeline", label="Transparencia do cliente", description="Une orcamentos, servicos, lembretes e financeiro.", endpoint="/api/clients/{client_id}/transparency"),
                ],
            ),
            AdminPanelOverview(
                key="budgets",
                title="Orcamentos",
                description="Propostas com composicao de preco e exportacao para WhatsApp/PDF.",
                stats=[
                    PanelStat(label="Abertos", value=str(len(open_budgets))),
                    PanelStat(label="Total", value=format_brl(sum(self._budget_total(budget) for budget in open_budgets))),
                    PanelStat(label="Saidas", value="WhatsApp + PDF"),
                ],
                tools=[
                    TransparencyTool(key="whatsapp", label="Preview WhatsApp", description="Mensagem estruturada para aprovacao.", endpoint="/api/budgets/{budget_id}/exports/whatsapp"),
                    TransparencyTool(key="pdf", label="PDF de orcamento", description="Arquivo formal para envio ou arquivo.", endpoint="/api/budgets/{budget_id}/exports/pdf"),
                ],
            ),
            AdminPanelOverview(
                key="service_reports",
                title="Servicos",
                description="Checklist tecnico, notas e evidencias para relatorio transparente.",
                stats=[
                    PanelStat(label="Ativos", value=str(len(active_reports))),
                    PanelStat(label="Imagens", value=str(sum(len(report.images) for report in reports))),
                    PanelStat(label="Relatorio", value="PDF tecnico"),
                ],
                tools=[
                    TransparencyTool(key="images", label="Anexar imagem", description="Prova visual do servico.", endpoint="/api/service-reports/{report_id}/images"),
                    TransparencyTool(key="pdf", label="PDF tecnico", description="Relatorio final com checklist e notas.", endpoint="/api/service-reports/{report_id}/exports/pdf"),
                ],
            ),
            AdminPanelOverview(
                key="reminders",
                title="Lembretes",
                description="Agenda de retorno, recorrencia e registro de contato.",
                stats=[
                    PanelStat(label="Pendentes", value=str(len(pending_reminders))),
                    PanelStat(label="Recorrentes", value=str(sum(1 for reminder in reminders if reminder.recurrence != "Unico"))),
                    PanelStat(label="Canal", value="WhatsApp"),
                ],
                tools=[
                    TransparencyTool(key="create", label="Novo lembrete", description="Agenda data, hora e recorrencia.", endpoint="/api/reminders"),
                    TransparencyTool(key="complete", label="Concluir contato", description="Registra que o retorno foi tratado.", endpoint="/api/reminders/{reminder_id}"),
                ],
            ),
            AdminPanelOverview(
                key="finance",
                title="Financeiro",
                description="Receitas, custos, NF, recibos e consolidacao ate cinco anos.",
                stats=[
                    PanelStat(label="Receita", value=format_brl(revenue)),
                    PanelStat(label="Custos", value=format_brl(costs)),
                    PanelStat(label="Resultado", value=format_brl(revenue - costs)),
                ],
                tools=[
                    TransparencyTool(key="entry_pdf", label="NF/recibo em PDF", description="Comprovante por lancamento.", endpoint="/api/finance/{entry_id}/exports/pdf"),
                    TransparencyTool(key="history", label="Resumo 5 anos", description="Mensal, trimestral e anual.", endpoint="/api/finance/history"),
                ],
            ),
        ]

    def search_clients(self, query: str) -> list[Client]:
        normalized = query.strip().lower()
        if not normalized:
            return self.clients.list_clients()

        results: list[Client] = []
        for client in self.clients.list_clients():
            haystack = " ".join(
                [
                    client.name,
                    client.phone,
                    client.cpf_cnpj,
                    client.email,
                    client.city,
                    *[vehicle.plate for vehicle in client.vehicles],
                    *[vehicle.model for vehicle in client.vehicles],
                    *[vehicle.brand for vehicle in client.vehicles],
                    *[vehicle.color for vehicle in client.vehicles],
                ]
            ).lower()
            if normalized in haystack:
                results.append(client)
        return results

    def get_client_transparency(self, client_id: str) -> ClientTransparency:
        client = self.clients.get_client(client_id)
        name = client.name.strip().lower()
        vehicle_terms = [vehicle.model.lower() for vehicle in client.vehicles] + [vehicle.plate.lower() for vehicle in client.vehicles]

        budgets = [budget for budget in self.budgets.list_budgets() if budget.client_name.strip().lower() == name]
        reports = [report for report in self.service_reports.list_reports() if report.client_name.strip().lower() == name]
        reminders = [reminder for reminder in self.reminders.list_reminders() if reminder.client_name.strip().lower() == name]
        entries = [
            entry
            for entry in self.finance.list_entries()
            if name in entry.description.lower() or any(term and term in entry.description.lower() for term in vehicle_terms)
        ]

        timeline = self._build_client_timeline(client, budgets, reports, reminders, entries)
        return ClientTransparency(
            client=client,
            budgets=budgets,
            service_reports=reports,
            reminders=reminders,
            financial_entries=entries,
            timeline=timeline,
        )

    def get_budget_transparency(self, budget_id: str) -> BudgetTransparency:
        budget = self.budgets.get_budget(budget_id)
        items_total = sum(item.quantity * item.unit_price for item in budget.items)
        return BudgetTransparency(
            budget=budget,
            items_total=items_total,
            labor_value=budget.labor_value,
            total=items_total + budget.labor_value,
            whatsapp_message=build_budget_whatsapp_message(budget),
            available_exports=[
                TransparencyTool(key="whatsapp", label="WhatsApp", description="Mensagem estruturada para aprovacao.", endpoint=f"/api/budgets/{budget_id}/exports/whatsapp"),
                TransparencyTool(key="pdf", label="PDF", description="Documento formal de orcamento.", endpoint=f"/api/budgets/{budget_id}/exports/pdf"),
            ],
        )

    def get_service_report_transparency(self, report_id: str) -> ServiceReportTransparency:
        report = self.service_reports.get_report(report_id)
        done_items = sum(1 for item in report.checklist if item.done)
        pending_items = len(report.checklist) - done_items
        return ServiceReportTransparency(
            report=report,
            done_items=done_items,
            pending_items=pending_items,
            image_count=len(report.images),
            available_exports=[
                TransparencyTool(key="images", label="Imagens", description="Evidencias visuais anexadas.", endpoint=f"/api/service-reports/{report_id}/images"),
                TransparencyTool(key="pdf", label="PDF tecnico", description="Relatorio estruturado do servico.", endpoint=f"/api/service-reports/{report_id}/exports/pdf"),
            ],
        )

    def _build_client_timeline(
        self,
        client: Client,
        budgets: list[Budget],
        reports: list[ServiceReport],
        reminders: list[Reminder],
        entries: list[FinancialEntry],
    ) -> list[TransparencyTimelineItem]:
        timeline: list[TransparencyTimelineItem] = []
        if client.last_visit:
            timeline.append(
                TransparencyTimelineItem(
                    occurred_at=client.last_visit,
                    event_type="client",
                    title="Ultima visita registrada",
                    description=f"Atendimento de {client.name} atualizado no cadastro.",
                    status="historico",
                    entity_id=client.id,
                )
            )

        for budget in budgets:
            timeline.append(
                TransparencyTimelineItem(
                    occurred_at=budget.created_at,
                    event_type="budget",
                    title=f"Orcamento {budget.status.lower()}",
                    description=f"{budget.vehicle_label} - {format_brl(self._budget_total(budget))}",
                    status=budget.status,
                    entity_id=budget.id,
                )
            )

        for report in reports:
            timeline.append(
                TransparencyTimelineItem(
                    occurred_at=report.check_in_at,
                    event_type="service_report",
                    title=f"Servico {report.title}",
                    description=f"{report.vehicle_label} - {len(report.checklist)} itens de checklist.",
                    status=report.status,
                    entity_id=report.id,
                )
            )

        for reminder in reminders:
            timeline.append(
                TransparencyTimelineItem(
                    occurred_at=reminder.due_at,
                    event_type="reminder",
                    title=reminder.title,
                    description=f"{reminder.channel} / recorrencia {reminder.recurrence}.",
                    status=reminder.status,
                    entity_id=reminder.id,
                )
            )

        for entry in entries:
            timeline.append(
                TransparencyTimelineItem(
                    occurred_at=entry.issued_at,
                    event_type="finance",
                    title=f"{entry.document_type} {entry.status.lower()}",
                    description=f"{entry.description} - {format_brl(entry.amount)}.",
                    status=entry.status,
                    entity_id=entry.id,
                )
            )

        return sorted(
            timeline,
            key=lambda item: item.occurred_at or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )

    def _budget_total(self, budget: Budget) -> float:
        return sum(item.quantity * item.unit_price for item in budget.items) + budget.labor_value


def aggregate_financial_entries(entries: list[FinancialEntry]) -> dict[str, dict[str, float]]:
    grouped: dict[str, dict[str, float]] = defaultdict(lambda: {"total_revenue": 0.0, "total_cost": 0.0})
    for entry in entries:
        totals = grouped[entry.reference_month]
        if entry.type == "Receita":
            totals["total_revenue"] += entry.amount
        else:
            totals["total_cost"] += entry.amount
    return grouped
