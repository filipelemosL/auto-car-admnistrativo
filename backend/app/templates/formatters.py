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


def only_digits(value: str) -> str:
    return "".join(char for char in value if char.isdigit())


def format_cpf(value: str) -> str:
    digits = only_digits(value)
    if len(digits) != 11:
        return value
    return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"


def format_cnpj(value: str) -> str:
    digits = only_digits(value)
    if len(digits) != 14:
        return value
    return f"{digits[:2]}.{digits[2:5]}.{digits[5:8]}/{digits[8:12]}-{digits[12:]}"


def format_document(value: str) -> str:
    digits = only_digits(value)
    if len(digits) == 11:
        return format_cpf(digits)
    if len(digits) == 14:
        return format_cnpj(digits)
    return value


def format_plate(value: str) -> str:
    compact = value.replace("-", "").replace(" ", "").upper()
    if len(compact) == 7:
        return f"{compact[:3]}-{compact[3:]}"
    return value.upper()


def format_km(value: int | float | str | None) -> str:
    if value is None or value == "":
        return "--"
    try:
        km = int(float(str(value).replace(".", "").replace(",", ".")))
    except ValueError:
        return str(value)
    return f"{km:,}".replace(",", ".")
