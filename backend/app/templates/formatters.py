from datetime import datetime


def format_brl(value: float) -> str:
    formatted = f"{value:,.2f}"
    return f"R$ {formatted}".replace(",", "X").replace(".", ",").replace("X", ".")


def format_datetime(value: datetime | None) -> str:
    if value is None:
        return "--"
    return value.strftime("%d/%m/%Y %H:%M")


def format_date(value: datetime | None) -> str:
    if value is None:
        return "--"
    return value.strftime("%d/%m/%Y")
