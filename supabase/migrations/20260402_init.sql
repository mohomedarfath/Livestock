create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'manager', 'employee', 'accountant');
create type public.billing_status as enum ('trialing', 'active', 'past_due', 'canceled');

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'starter',
  billing_status public.billing_status not null default 'trialing',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.flocks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  breed text,
  type text,
  count integer not null default 0,
  age integer,
  status text not null default 'active',
  arrival_date date,
  notes text,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  flock_id uuid references public.flocks (id) on delete set null,
  log_date date not null,
  eggs_collected integer not null default 0,
  mortality integer not null default 0,
  feed_given numeric(10,2) not null default 0,
  water_consumed numeric(10,2) not null default 0,
  notes text,
  sync_status text not null default 'synced',
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  flock_id uuid references public.flocks (id) on delete set null,
  name text not null,
  due_date date not null,
  status text not null default 'pending',
  notes text,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  flock_id uuid references public.flocks (id) on delete set null,
  amount numeric(12,2) not null,
  category text not null,
  description text not null,
  reference text,
  expense_date date not null,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  quantity numeric(12,2) not null,
  unit text not null,
  price_per_unit numeric(12,2) not null,
  total_price numeric(12,2) not null,
  type text not null,
  buyer_name text,
  sale_date date not null,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  role text not null,
  wage_type text,
  rate numeric(12,2),
  active boolean not null default true,
  joined_at date,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_settings (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  farm_name text not null,
  logo_url text,
  currency_code text not null default 'LKR',
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_organization_ids()
returns setof uuid
language sql
stable
as $$
  select organization_id
  from public.memberships
  where user_id = auth.uid()
$$;

create or replace function public.create_organization_with_membership(
  org_name text,
  org_slug text,
  membership_role public.app_role default 'admin'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_org_id uuid;
begin
  insert into public.organizations (name, slug, created_by)
  values (org_name, org_slug, auth.uid())
  returning id into created_org_id;

  insert into public.memberships (organization_id, user_id, role)
  values (created_org_id, auth.uid(), membership_role);

  insert into public.organization_settings (organization_id, farm_name)
  values (created_org_id, org_name);

  return created_org_id;
end;
$$;

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.flocks enable row level security;
alter table public.daily_logs enable row level security;
alter table public.vaccinations enable row level security;
alter table public.expenses enable row level security;
alter table public.sales enable row level security;
alter table public.employees enable row level security;
alter table public.organization_settings enable row level security;

create policy "organization members can read organizations"
  on public.organizations for select
  using (
    exists (
      select 1
      from public.memberships
      where memberships.organization_id = organizations.id
        and memberships.user_id = auth.uid()
    )
  );

create policy "authenticated users can create organizations"
  on public.organizations for insert
  with check (auth.uid() = created_by);

create policy "organization members can read memberships"
  on public.memberships for select
  using (user_id = auth.uid());

create policy "organization members can manage flocks"
  on public.flocks for all
  using (organization_id in (select public.current_organization_ids()))
  with check (organization_id in (select public.current_organization_ids()));

create policy "organization members can manage daily logs"
  on public.daily_logs for all
  using (organization_id in (select public.current_organization_ids()))
  with check (organization_id in (select public.current_organization_ids()));

create policy "organization members can manage vaccinations"
  on public.vaccinations for all
  using (organization_id in (select public.current_organization_ids()))
  with check (organization_id in (select public.current_organization_ids()));

create policy "organization members can manage expenses"
  on public.expenses for all
  using (organization_id in (select public.current_organization_ids()))
  with check (organization_id in (select public.current_organization_ids()));

create policy "organization members can manage sales"
  on public.sales for all
  using (organization_id in (select public.current_organization_ids()))
  with check (organization_id in (select public.current_organization_ids()));

create policy "organization members can manage employees"
  on public.employees for all
  using (organization_id in (select public.current_organization_ids()))
  with check (organization_id in (select public.current_organization_ids()));

create policy "organization members can manage organization settings"
  on public.organization_settings for all
  using (organization_id in (select public.current_organization_ids()))
  with check (organization_id in (select public.current_organization_ids()));
