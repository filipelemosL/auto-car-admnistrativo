from __future__ import annotations

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.schemas.budgets import Budget
from app.schemas.finance import FinancialSummary
from app.schemas.service_reports import ServiceReport
from app.templates.formatters import format_brl, format_date, format_datetime


TITLE_COLOR = colors.HexColor("#2A3F73")
TEXT_COLOR = colors.HexColor("#364968")
ACCENT_COLOR = colors.HexColor("#6D84FF")


def _build_document_buffer(title: str, story: list) -> BytesIO:
    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=42,
        rightMargin=42,
        topMargin=46,
        bottomMargin=42,
        title=title,
    )
    document.build(story)
    buffer.seek(0)
    return buffer


def _styles() -> dict[str, ParagraphStyle]:
    base_styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title",
            parent=base_styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=20,
            textColor=TITLE_COLOR,
            spaceAfter=10,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            parent=base_styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=ACCENT_COLOR,
            spaceAfter=8,
            spaceBefore=12,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base_styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=TEXT_COLOR,
        ),
    }


def build_budget_pdf(budget: Budget) -> BytesIO:
    styles = _styles()
    story = [
        Paragraph("Orcamento AutoCar", styles["title"]),
        Paragraph(f"Cliente: {budget.client_name}", styles["body"]),
        Paragraph(f"Veiculo: {budget.vehicle_label}", styles["body"]),
        Paragraph(f"Data: {format_date(budget.created_at)}", styles["body"]),
        Spacer(1, 14),
    ]

    table_data = [["Descricao", "Qtd", "Valor unit.", "Total"]]
    total_items = 0.0
    for item in budget.items:
        line_total = item.quantity * item.unit_price
        total_items += line_total
        table_data.append(
            [
                item.description,
                str(item.quantity),
                format_brl(item.unit_price),
                format_brl(line_total),
            ]
        )

    total = total_items + budget.labor_value
    table_data.extend(
        [
            ["", "", "Mao de obra", format_brl(budget.labor_value)],
            ["", "", "Total", format_brl(total)],
        ]
    )
    story.append(_soft_table(table_data))
    story.extend(
        [
            Spacer(1, 16),
            Paragraph("Observacoes", styles["subtitle"]),
            Paragraph(budget.notes or "Sem observacoes adicionais.", styles["body"]),
        ]
    )
    return _build_document_buffer(f"orcamento-{budget.id}", story)


def build_service_report_pdf(report: ServiceReport) -> BytesIO:
    styles = _styles()
    story = [
        Paragraph("Relatorio de Servico", styles["title"]),
        Paragraph(f"OS: {report.title}", styles["body"]),
        Paragraph(f"Cliente: {report.client_name}", styles["body"]),
        Paragraph(f"Veiculo: {report.vehicle_label}", styles["body"]),
        Paragraph(f"Entrada: {format_datetime(report.check_in_at)}", styles["body"]),
        Paragraph(f"Mecanico: {report.mechanic}", styles["body"]),
        Spacer(1, 14),
        Paragraph("Checklist tecnico", styles["subtitle"]),
    ]

    checklist_rows = [["Item", "Status", "Notas"]]
    for item in report.checklist:
        checklist_rows.append(
            [
                item.label,
                "Concluido" if item.done else "Pendente",
                item.notes or "--",
            ]
        )
    story.append(_soft_table(checklist_rows))
    story.extend(
        [
            Spacer(1, 16),
            Paragraph("Notas do servico", styles["subtitle"]),
            *[Paragraph(f"- {note}", styles["body"]) for note in report.notes],
            Spacer(1, 14),
            Paragraph(f"Imagens anexadas: {len(report.images)}", styles["body"]),
        ]
    )
    return _build_document_buffer(f"servico-{report.id}", story)


def build_financial_summary_pdf(summary: FinancialSummary) -> BytesIO:
    styles = _styles()
    story = [
        Paragraph("Resumo Financeiro", styles["title"]),
        Paragraph(f"Periodo: {summary.period}", styles["body"]),
        Paragraph(f"Referencia: {summary.reference}", styles["body"]),
        Spacer(1, 12),
        Paragraph(f"Receitas: {format_brl(summary.total_revenue)}", styles["body"]),
        Paragraph(f"Custos: {format_brl(summary.total_cost)}", styles["body"]),
        Paragraph(f"Resultado: {format_brl(summary.profit)}", styles["body"]),
        Spacer(1, 16),
        Paragraph("Lancamentos", styles["subtitle"]),
    ]

    rows = [["Tipo", "Documento", "Descricao", "Data", "Valor"]]
    for entry in summary.entries:
        rows.append(
            [
                entry.type,
                entry.document_type,
                entry.description,
                format_datetime(entry.issued_at),
                format_brl(entry.amount),
            ]
        )
    story.append(_soft_table(rows))
    return _build_document_buffer("finance-summary", story)


def _soft_table(data: list[list[str]]) -> Table:
    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF0FF")),
                ("TEXTCOLOR", (0, 0), (-1, 0), TITLE_COLOR),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("TOPPADDING", (0, 0), (-1, 0), 10),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_COLOR),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D7E0FF")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
                ("TOPPADDING", (0, 1), (-1, -1), 8),
            ]
        )
    )
    return table
