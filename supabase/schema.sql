create extension if not exists pgcrypto;

create table if not exists public.clients (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    phone text not null,
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

create index if not exists idx_vehicles_client_id on public.vehicles(client_id);
create index if not exists idx_budgets_created_at on public.budgets(created_at desc);
create index if not exists idx_service_reports_check_in_at on public.service_reports(check_in_at desc);
create index if not exists idx_reminders_due_at on public.reminders(due_at asc);
create index if not exists idx_finance_reference_month on public.finance_entries(reference_month);

comment on table public.clients is 'Clientes da oficina.';
comment on table public.vehicles is 'Veiculos vinculados aos clientes.';
comment on table public.budgets is 'Orcamentos com itens em JSON.';
comment on table public.service_reports is 'Relatorios tecnicos de servico.';
comment on table public.reminders is 'Lembretes operacionais e comerciais.';
comment on table public.finance_entries is 'Lancamentos financeiros da oficina.';
