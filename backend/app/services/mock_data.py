from copy import deepcopy
from datetime import date, datetime
import json
from pathlib import Path

LOCAL_DB_PATH = Path(__file__).resolve().parents[2] / "data" / "local_db.json"

DEFAULT_STORE = {
    "clients": [
        {
            "id": "cli_001",
            "name": "Marina Costa",
            "phone": "(11) 98877-1100",
            "cpf_cnpj": "123.456.789-00",
            "email": "marina@exemplo.com",
            "city": "Sao Paulo",
            "lifetime_value": 12480.0,
            "last_visit": "2026-06-15T10:00:00+00:00",
            "created_at": "2026-02-10T14:00:00+00:00",
            "vehicles": [
                {
                    "id": "veh_001",
                    "client_id": "cli_001",
                    "brand": "Toyota",
                    "model": "Corolla XEi",
                    "plate": "BRA2E19",
                    "year": 2021,
                    "color": "Prata",
                    "mileage": 58210,
                    "status": "Revisao em aberto",
                    "created_at": "2026-02-10T14:00:00+00:00",
                }
            ],
        },
        {
            "id": "cli_002",
            "name": "Carlos Mendes",
            "phone": "(11) 99111-2200",
            "cpf_cnpj": "987.654.321-00",
            "email": "carlos@exemplo.com",
            "city": "Osasco",
            "lifetime_value": 8450.0,
            "last_visit": "2026-06-21T14:00:00+00:00",
            "created_at": "2026-03-12T10:30:00+00:00",
            "vehicles": [
                {
                    "id": "veh_003",
                    "client_id": "cli_002",
                    "brand": "Volkswagen",
                    "model": "Saveiro Cross",
                    "plate": "SVR9P11",
                    "year": 2020,
                    "color": "Vermelho",
                    "mileage": 91230,
                    "status": "Urgente",
                    "created_at": "2026-03-12T10:30:00+00:00",
                }
            ],
        },
    ],
    "budgets": [
        {
            "id": "orc_001",
            "client_name": "Marina Costa",
            "vehicle_label": "Toyota Corolla XEi 2021",
            "status": "Enviado",
            "labor_value": 480.0,
            "notes": "Prazo estimado de 2 dias uteis apos aprovacao.",
            "created_at": "2026-06-24T12:00:00+00:00",
            "items": [
                {
                    "id": "item_001",
                    "description": "Jogo de pastilhas dianteiras",
                    "quantity": 1,
                    "unit_price": 320.0,
                },
                {
                    "id": "item_002",
                    "description": "Troca de fluido de freio",
                    "quantity": 1,
                    "unit_price": 140.0,
                },
            ],
        }
    ],
    "service_reports": [
        {
            "id": "srv_001",
            "title": "OS 1042",
            "client_name": "Carlos Mendes",
            "vehicle_label": "Volkswagen Saveiro Cross 2020",
            "status": "Em execucao",
            "mechanic": "Rafael Gomes",
            "check_in_at": "2026-06-25T11:20:00+00:00",
            "notes": [
                "Ruido na suspensao dianteira confirmado no teste de rua.",
                "Cliente autorizou fotografar desgaste da bandeja.",
            ],
            "images": ["https://images.unsplash.com/photo-1487754180451-c456f719a1fc"],
            "checklist": [
                {"id": "chk_001", "label": "Inspecao de bandejas", "done": True, "notes": None},
                {"id": "chk_002", "label": "Teste de amortecedores", "done": True, "notes": None},
                {
                    "id": "chk_003",
                    "label": "Conferencia de terminais",
                    "done": False,
                    "notes": "Aguardando elevador livre",
                },
            ],
            "created_at": "2026-06-25T11:20:00+00:00",
        }
    ],
    "reminders": [
        {
            "id": "rem_001",
            "title": "Retorno de revisao de 10.000 km",
            "client_name": "Juliana Araujo",
            "channel": "WhatsApp",
            "due_at": "2026-06-28T14:00:00+00:00",
            "recurrence": "Mensal",
            "status": "Agendado",
            "created_at": "2026-06-22T12:10:00+00:00",
        }
    ],
    "finance_entries": [
        {
            "id": "fin_001",
            "type": "Receita",
            "category": "Servicos",
            "document_type": "NF",
            "description": "OS 1038 - freios dianteiros",
            "amount": 1790.0,
            "issued_at": "2026-06-24T18:00:00+00:00",
            "reference_month": "2026-06",
            "status": "Emitido",
            "created_at": "2026-06-24T18:00:00+00:00",
        },
        {
            "id": "fin_002",
            "type": "Custo",
            "category": "Pecas",
            "document_type": "Despesa",
            "description": "Compra de kit de freio",
            "amount": 980.0,
            "issued_at": "2026-06-24T09:00:00+00:00",
            "reference_month": "2026-06",
            "status": "Pago",
            "created_at": "2026-06-24T09:00:00+00:00",
        },
    ],
    "service_orders": [
        {
            "id": "jor_001",
            "client_id": "cli_002",
            "client_name": "Carlos Mendes",
            "client_phone": "(11) 99111-2200",
            "vehicle_id": "veh_003",
            "vehicle_label": "Volkswagen Saveiro Cross 2020",
            "stage": "service",
            "status": "Em servico",
            "diagnosis": {
                "customer_complaint": "Cliente relata ruido na suspensao dianteira.",
                "mechanic_diagnosis": "Folga identificada em componentes dianteiros.",
                "diagnostic_tool": "Teste de rua + elevador",
                "dtc_codes": "Nenhum DTC registrado",
                "conclusion": "Necessaria substituicao e conferencia dos terminais.",
            },
            "budget_id": "orc_001",
            "budget_items": [
                {
                    "id": "item_001",
                    "description": "Jogo de pastilhas dianteiras",
                    "quantity": 1,
                    "unit_price": 320.0,
                },
                {
                    "id": "item_002",
                    "description": "Troca de fluido de freio",
                    "quantity": 1,
                    "unit_price": 140.0,
                },
            ],
            "service_tasks": [
                {
                    "id": "tsk_001",
                    "budget_item_id": "item_001",
                    "description": "Jogo de pastilhas dianteiras",
                    "status": "Em andamento",
                    "notes": "Desmontagem iniciada.",
                    "images": [],
                    "completed_at": None,
                },
                {
                    "id": "tsk_002",
                    "budget_item_id": "item_002",
                    "description": "Troca de fluido de freio",
                    "status": "Aguardando inicio",
                    "notes": "",
                    "images": [],
                    "completed_at": None,
                },
            ],
            "payment": {
                "document_type": "Recibo",
                "paid": False,
                "payment_method": "",
                "amount_paid": 0.0,
                "paid_at": None,
                "fiscal_provider_reference": None,
            },
            "ready_message": "",
            "created_at": "2026-06-25T11:20:00+00:00",
            "updated_at": "2026-06-25T11:20:00+00:00",
            "completed_at": None,
        }
    ],
    "company_settings": {
        "id": "company_default",
        "trade_name": "AutoCar",
        "legal_name": "AutoCar Oficina Mecanica",
        "cnpj": "",
        "phone": "(11) 4002-8922",
        "email": "contato@autocar.local",
        "address": "Av. Principal, 100",
        "city_uf": "Sao Paulo / SP",
        "cep": "01000-000",
        "technical_responsible": "Carlos Mecanico",
        "fiscal_provider": None,
        "fiscal_provider_enabled": False,
        "updated_at": "2026-06-25T11:20:00+00:00",
    },
    "fixed_costs": [
        {
            "id": "fix_001",
            "description": "Energia eletrica",
            "amount": 680.0,
            "recurrence": "Mensal",
            "due_day": 12,
            "alert_enabled": True,
            "active": True,
            "created_at": "2026-06-01T10:00:00+00:00",
        },
        {
            "id": "fix_002",
            "description": "Aluguel da oficina",
            "amount": 3200.0,
            "recurrence": "Mensal",
            "due_day": 5,
            "alert_enabled": True,
            "active": True,
            "created_at": "2026-06-01T10:00:00+00:00",
        },
    ],
    "budget_presets": [
        {
            "id": "pre_001",
            "description": "Troca de oleo e filtro",
            "quantity": 1,
            "unit_price": 265.0,
            "item_type": "Servico",
            "notes": "Inclui oleo 5W30, filtro e descarte ambiental.",
            "created_at": "2026-06-01T10:00:00+00:00",
        },
        {
            "id": "pre_002",
            "description": "Pastilha de freio dianteira",
            "quantity": 1,
            "unit_price": 320.0,
            "item_type": "Peca",
            "notes": "Valor base para jogo dianteiro.",
            "created_at": "2026-06-01T10:00:00+00:00",
        },
    ],
}


def _dump_store(store: dict) -> str:
    return json.dumps(store, ensure_ascii=False, indent=2, default=_json_default)


def _json_default(value: object) -> str:
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    raise TypeError(f"Object of type {value.__class__.__name__} is not JSON serializable")


def _load_store() -> dict:
    LOCAL_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not LOCAL_DB_PATH.exists():
        LOCAL_DB_PATH.write_text(
            _dump_store(DEFAULT_STORE),
            encoding="utf-8",
        )
        return deepcopy(DEFAULT_STORE)

    data = json.loads(LOCAL_DB_PATH.read_text(encoding="utf-8"))
    # Keep older local JSON files compatible as new modules are added.
    for key, value in DEFAULT_STORE.items():
        data.setdefault(key, deepcopy(value))
    LOCAL_DB_PATH.write_text(
        _dump_store(data),
        encoding="utf-8",
    )
    return data


MOCK_STORE = _load_store()


def get_store() -> dict[str, list[dict]]:
    return MOCK_STORE


def save_store(store: dict | None = None) -> None:
    LOCAL_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    LOCAL_DB_PATH.write_text(
        _dump_store(store or MOCK_STORE),
        encoding="utf-8",
    )


def reset_store() -> dict:
    MOCK_STORE.clear()
    MOCK_STORE.update(deepcopy(DEFAULT_STORE))
    save_store(MOCK_STORE)
    return MOCK_STORE


def clone_store(key: str) -> list[dict]:
    return deepcopy(MOCK_STORE[key])
