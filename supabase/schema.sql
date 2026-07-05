create extension if not exists pgcrypto;

create table if not exists public.clients (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    phone text not null,
    cpf_cnpj text not null default '',
    email text not null,
    city text not null,
    lifetime_value numeric(12,2) not null default 0,
    last_visit timestamptz,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vehicles (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    brand text not null,
    model text not null,
    plate text not null unique,
    year integer not null,
    color text not null default '',
    mileage integer not null default 0,
    status text not null default 'Em dia',
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.budgets (
    id uuid primary key default gen_random_uuid(),
    client_name text not null,
    vehicle_label text not null,
    status text not null default 'Rascunho',
    labor_value numeric(12,2) not null default 0,
    notes text not null default '',
    items jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_reports (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    client_name text not null,
    vehicle_label text not null,
    status text not null default 'Em execucao',
    mechanic text not null,
    notes text[] not null default '{}',
    images text[] not null default '{}',
    checklist jsonb not null default '[]'::jsonb,
    check_in_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reminders (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    client_name text not null,
    channel text not null default 'WhatsApp',
    due_at timestamptz not null,
    recurrence text not null default 'Unico',
    status text not null default 'Agendado',
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.finance_entries (
    id uuid primary key default gen_random_uuid(),
    type text not null,
    category text not null,
    document_type text not null,
    description text not null,
    amount numeric(12,2) not null default 0,
    issued_at timestamptz not null,
    reference_month text not null,
    status text not null default 'Pendente',
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_orders (
    id uuid primary key default gen_random_uuid(),
    client_id uuid references public.clients(id) on delete set null,
    client_name text not null default '',
    client_phone text not null default '',
    vehicle_id uuid references public.vehicles(id) on delete set null,
    vehicle_label text not null default '',
    stage text not null default 'client_selection',
    status text not null default 'Aberta',
    diagnosis jsonb not null default '{}'::jsonb,
    budget_id uuid references public.budgets(id) on delete set null,
    budget_items jsonb not null default '[]'::jsonb,
    service_tasks jsonb not null default '[]'::jsonb,
    payment jsonb not null default '{}'::jsonb,
    ready_message text not null default '',
    completed_at timestamptz,
    updated_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.company_settings (
    id text primary key default 'company_default',
    trade_name text not null default 'AutoCar',
    legal_name text not null default 'AutoCar Oficina Mecanica',
    cnpj text not null default '',
    phone text not null default '',
    email text not null default '',
    address text not null default '',
    city_uf text not null default '',
    cep text not null default '',
    technical_responsible text not null default '',
    fiscal_provider text,
    fiscal_provider_enabled boolean not null default false,
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.fixed_costs (
    id uuid primary key default gen_random_uuid(),
    description text not null,
    amount numeric(12,2) not null default 0,
    recurrence text not null default 'Mensal',
    due_day integer not null,
    alert_enabled boolean not null default true,
    active boolean not null default true,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.budget_presets (
    id uuid primary key default gen_random_uuid(),
    description text not null,
    quantity integer not null default 1,
    unit_price numeric(12,2) not null default 0,
    item_type text not null default 'Servico',
    notes text not null default '',
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_vehicles_client_id on public.vehicles(client_id);
create index if not exists idx_budgets_created_at on public.budgets(created_at desc);
create index if not exists idx_service_reports_check_in_at on public.service_reports(check_in_at desc);
create index if not exists idx_reminders_due_at on public.reminders(due_at asc);
create index if not exists idx_finance_reference_month on public.finance_entries(reference_month);
create index if not exists idx_service_orders_stage on public.service_orders(stage);
create index if not exists idx_service_orders_client_id on public.service_orders(client_id);
create index if not exists idx_fixed_costs_due_day on public.fixed_costs(due_day);

comment on table public.clients is 'Clientes da oficina.';
comment on table public.vehicles is 'Veiculos vinculados aos clientes.';
comment on table public.budgets is 'Orcamentos com itens em JSON.';
comment on table public.service_reports is 'Relatorios tecnicos de servico.';
comment on table public.reminders is 'Lembretes operacionais e comerciais.';
comment on table public.finance_entries is 'Lancamentos financeiros da oficina.';
comment on table public.service_orders is 'Jornada do cliente e ordem de servico ponta a ponta.';
comment on table public.company_settings is 'Dados da empresa usados em documentos e integracoes.';
comment on table public.fixed_costs is 'Custos fixos e alertas de vencimento.';
comment on table public.budget_presets is 'Predefinicoes reutilizaveis de linhas de orcamento.';
