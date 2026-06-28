# AutoCar Administrativo

Base inicial de um sistema administrativo para oficina mecanica com front-end em React + TypeScript + Vite e back-end em FastAPI preparado para Supabase.

## Modulos

- Clientes: cadastro de clientes e seus veiculos.
- Orcamentos: composicao de itens, mao de obra e exportacao para WhatsApp e PDF.
- Servicos: checklist tecnico, notas, imagens e relatorio em PDF.
- Lembretes: agenda por cliente com data, hora e recorrencia.
- Financeiro: notas, recibos, custos, receitas e resumos por periodo.

## Estrutura

```text
frontend/   React + Vite + tema Soft UI por variaveis CSS
backend/    FastAPI + services + exports PDF + integracao Supabase
supabase/   schema.sql com as tabelas base
```

## Frontend

1. Entre em `frontend/`.
2. Copie `.env.example` para `.env` se quiser controlar o modo de dados.
3. Rode `npm install`.
4. Rode `npm run dev`.

O tema Soft UI esta centralizado em `frontend/src/styles.css` via variaveis `:root`, para facilitar troca posterior de paleta, sombras, tipografia e bordas.

Para rodar sem backend agora, deixe:

- `VITE_DATA_MODE=mock`
- `VITE_MOCK_LATENCY_MS=0`

Quando quiser trocar para a API real depois, altere para:

- `VITE_DATA_MODE=api`
- `VITE_API_URL=http://localhost:8000/api`

## Backend

1. Entre em `backend/`.
2. Crie e ative um ambiente virtual Python.
3. Copie `.env.example` para `.env`.
4. Rode `pip install -r requirements.txt`.
5. Rode `uvicorn app.main:app --reload`.

Por padrao o backend sobe com `AUTOCAR_USE_MOCK_DATA=true`, entao a base funciona mesmo antes do Supabase estar configurado. Quando quiser usar o banco real, ajuste:

- `AUTOCAR_USE_MOCK_DATA=false`
- `AUTOCAR_SUPABASE_URL=...`
- `AUTOCAR_SUPABASE_KEY=...`

## Supabase

O schema inicial esta em `supabase/schema.sql`. Ele cria as tabelas principais e indices base para os cinco modulos.

## Endpoints principais

- `GET /api/health`
- `GET/POST/PUT/DELETE /api/clients`
- `GET/POST/PUT/DELETE /api/budgets`
- `GET /api/budgets/{id}/exports/whatsapp`
- `GET /api/budgets/{id}/exports/pdf`
- `GET/POST/PUT/DELETE /api/service-reports`
- `POST /api/service-reports/{id}/images`
- `GET /api/service-reports/{id}/exports/pdf`
- `GET/POST/PUT/DELETE /api/reminders`
- `GET/POST/PUT/DELETE /api/finance`
- `GET /api/finance/summary/{period}?reference=...`
- `GET /api/finance/summary/{period}/pdf?reference=...`
