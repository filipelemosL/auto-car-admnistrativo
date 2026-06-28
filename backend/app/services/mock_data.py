from copy import deepcopy

MOCK_STORE = {
    "clients": [
        {
            "id": "cli_001",
            "name": "Marina Costa",
            "phone": "(11) 98877-1100",
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
}


def get_store() -> dict[str, list[dict]]:
    return MOCK_STORE


def clone_store(key: str) -> list[dict]:
    return deepcopy(MOCK_STORE[key])
