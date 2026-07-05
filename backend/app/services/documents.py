from __future__ import annotations

from datetime import timedelta
from io import BytesIO

from app.schemas.budgets import Budget
from app.schemas.finance import FinancialEntry
from app.schemas.service_reports import ServiceReport
from app.services.budgets import BudgetService
from app.services.company import CompanyService
from app.services.finance import FinanceService
from app.services.service_reports import ServiceReportService
from app.templates.docx_renderer import render_template
from app.templates.formatters import format_brl, format_date, format_datetime, format_km, format_plate


class DocumentService:
    def __init__(self) -> None:
        self.budgets = BudgetService()
        self.reports = ServiceReportService()
        self.finance = FinanceService()
        self.company = CompanyService()

    def render_budget_document(self, budget_id: str) -> tuple[str, BytesIO]:
        budget = self.budgets.get_budget(budget_id)
        payload = self.build_budget_payload(budget)
        filename = f"autocar_orcamento_{budget.id}.docx"
        return filename, render_template("template_orcamento", payload)

    def render_report_document(self, report_id: str) -> tuple[str, BytesIO]:
        report = self.reports.get_report(report_id)
        payload = self.build_report_payload(report)
        filename = f"autocar_relatorio_{report.id}.docx"
        return filename, render_template("template_relatorio", payload)

    def render_nfe_document(self, entry_id: str) -> tuple[str, BytesIO]:
        entry = self.finance.get_entry(entry_id)
        payload = self.build_nfe_payload(entry)
        filename = f"autocar_nfe_{entry.id}.docx"
        return filename, render_template("template_nfe", payload)

    def build_budget_payload(self, budget: Budget) -> dict:
        created_at = budget.created_at
        services = []
        parts = []
        total_services = budget.labor_value
        total_parts = 0.0

        for index, item in enumerate(budget.items, start=1):
            row = {
                "srv_numero": f"{index:02d}",
                "srv_descricao": item.description,
                "srv_tempo": "--",
                "srv_aprovado": "Sim" if budget.status == "Aprovado" else "Pendente",
                "srv_valor": format_brl(item.quantity * item.unit_price),
                "peca_numero": f"{index:02d}",
                "peca_descricao": item.description,
                "peca_qtd": str(item.quantity),
                "peca_origem": "--",
                "peca_valor_unit": format_brl(item.unit_price),
                "peca_valor_total": format_brl(item.quantity * item.unit_price),
            }
            if "servico" in item.description.lower() or "troca" in item.description.lower():
                services.append(row)
                total_services += item.quantity * item.unit_price
            else:
                parts.append(row)
                total_parts += item.quantity * item.unit_price

        total = total_services + total_parts
        return {
            "orc_numero": budget.id,
            "orc_data": format_date(created_at),
            "orc_validade": format_date(created_at + timedelta(days=7) if created_at else None),
            "orc_responsavel": self.company.get_settings().technical_responsible or "--",
            "orc_status": budget.status,
            "cliente_nome": budget.client_name,
            "cliente_cpf_cnpj": "",
            "cliente_telefone": "",
            "cliente_email": "",
            "cliente_cidade_uf": "",
            "cliente_origem": "",
            "veiculo_modelo": budget.vehicle_label,
            "veiculo_placa": "",
            "veiculo_ano": "",
            "veiculo_cor": "",
            "veiculo_km": "",
            "veiculo_combustivel": "",
            "diagnostico": budget.notes,
            "servicos": services,
            "pecas": parts,
            "total_servicos": format_brl(total_services),
            "total_pecas": format_brl(total_parts),
            "desconto": format_brl(0),
            "prazo_entrega": "--",
            "total_geral": format_brl(total),
            "pagamento_forma": "--",
            "pagamento_parcelamento": "--",
            "observacoes": budget.notes,
            "aprovacao_data": format_date(created_at) if budget.status == "Aprovado" else "",
        }

    def build_report_payload(self, report: ServiceReport) -> dict:
        services = [
            {
                "srv_numero": f"{index:02d}",
                "srv_descricao": item.label,
                "srv_tecnico": report.mechanic,
                "srv_tempo": "--",
                "srv_concluido": "Sim" if item.done else "Nao",
            }
            for index, item in enumerate(report.checklist, start=1)
        ]
        tests = [
            {
                "teste_nome": item.label,
                "teste_resultado": "OK" if item.done else "Pendente",
                "teste_obs": item.notes or "",
            }
            for item in report.checklist
        ]
        return {
            "rel_numero": f"RT-{report.id}",
            "rel_os": report.title,
            "rel_data": format_date(report.check_in_at),
            "rel_tecnico": report.mechanic,
            "cliente_nome": report.client_name,
            "cliente_telefone": "",
            "cliente_cpf_cnpj": "",
            "veiculo_modelo": report.vehicle_label,
            "veiculo_placa": "",
            "veiculo_ano": "",
            "veiculo_chassi": "",
            "veiculo_km_entrada": "",
            "veiculo_km_saida": "",
            "veiculo_motor": "",
            "queixa": report.notes[0] if report.notes else "",
            "diag_ferramenta": "Inspecao tecnica",
            "diag_dtc": "Nao informado",
            "diag_conclusao": "\n".join(report.notes),
            "servicos": services,
            "pecas": [],
            "testes": tests,
            "fotos_legenda": f"{len(report.images)} imagem(ns) anexada(s) ao relatorio.",
            "rec_servicos": "Retorno preventivo conforme recomendacao da oficina.",
            "rec_km": "",
            "rec_data": "",
            "rec_alerta": "Nenhum",
            "rec_urgencia": report.status,
            "parecer_final": "\n".join(report.notes) or "Servico registrado e acompanhado pela AutoCar.",
            "tecnico_crea": "",
            "assinatura_data": "",
        }

    def build_nfe_payload(self, entry: FinancialEntry) -> dict:
        company = self.company.get_settings()
        return {
            "nfe_numero": entry.id,
            "nfe_serie": "001",
            "nfe_data_emissao": format_datetime(entry.issued_at),
            "nfe_chave_acesso": entry.id,
            "dest_nome": entry.description,
            "dest_cpf_cnpj": "",
            "dest_telefone": "",
            "dest_endereco": "",
            "dest_cidade_uf": company.city_uf,
            "dest_cep": company.cep,
            "veiculo_modelo": "",
            "veiculo_placa": format_plate(""),
            "veiculo_ano": "",
            "veiculo_km_entrada": format_km(""),
            "veiculo_km_saida": format_km(""),
            "itens": [
                {
                    "item_numero": "01",
                    "item_descricao": entry.description,
                    "item_qtd": "1",
                    "item_un": "SV",
                    "item_valor_unit": format_brl(entry.amount),
                    "item_valor_total": format_brl(entry.amount),
                }
            ],
            "total_produtos": format_brl(0),
            "total_servicos": format_brl(entry.amount),
            "desconto": format_brl(0),
            "total_geral": format_brl(entry.amount),
            "pagamento_forma": "--",
            "pagamento_condicao": "A vista" if entry.status == "Pago" else "Pendente",
            "pagamento_vencimento": format_date(entry.issued_at),
            "observacoes": "Documento interno preparado para futura integracao fiscal.",
        }
