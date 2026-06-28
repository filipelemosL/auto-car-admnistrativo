from app.schemas.budgets import Budget
from app.templates.formatters import format_brl, format_date


def build_budget_whatsapp_message(budget: Budget) -> str:
    items = "\n".join(
        f"- {item.description}: {item.quantity} x {format_brl(item.unit_price)} = {format_brl(item.quantity * item.unit_price)}"
        for item in budget.items
    )
    items_total = sum(item.quantity * item.unit_price for item in budget.items)
    total = items_total + budget.labor_value

    return "\n".join(
        [
            "*Orcamento AutoCar*",
            f"Cliente: {budget.client_name}",
            f"Veiculo: {budget.vehicle_label}",
            f"Data: {format_date(budget.created_at)}",
            "",
            "*Itens*",
            items,
            "",
            f"Mao de obra: {format_brl(budget.labor_value)}",
            f"Total estimado: {format_brl(total)}",
            "",
            f"Observacoes: {budget.notes}",
        ]
    )
