alter table public.employees
  add column if not exists phone text,
  add column if not exists notes text;

create table if not exists public.employee_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  flock_id uuid references public.flocks (id) on delete set null,
  task_type text not null,
  description text not null,
  hours numeric(10,2) not null default 0,
  activity_date date not null,
  activity_time time,
  notes text,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  budget_month date not null,
  category text not null,
  amount numeric(12,2) not null default 0,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists budgets_organization_month_category_idx
  on public.budgets (organization_id, budget_month, category);

create table if not exists public.wages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  wage_month date not null,
  hours_worked numeric(10,2),
  rate numeric(12,2) not null default 0,
  wage_type text not null,
  calculated_wage numeric(12,2) not null default 0,
  status text not null default 'pending',
  paid_at date,
  notes text,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists wages_organization_employee_month_idx
  on public.wages (organization_id, employee_id, wage_month);

create table if not exists public.feed_purchases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  feed_type text not null,
  quantity_kg numeric(12,2) not null default 0,
  price_per_kg numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  purchase_date date not null,
  notes text,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employee_activities enable row level security;
alter table public.budgets enable row level security;
alter table public.wages enable row level security;
alter table public.feed_purchases enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'employee_activities' and policyname = 'organization members can manage employee activities'
  ) then
    create policy "organization members can manage employee activities"
      on public.employee_activities for all
      using (organization_id in (select public.current_organization_ids()))
      with check (organization_id in (select public.current_organization_ids()));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'budgets' and policyname = 'organization members can manage budgets'
  ) then
    create policy "organization members can manage budgets"
      on public.budgets for all
      using (organization_id in (select public.current_organization_ids()))
      with check (organization_id in (select public.current_organization_ids()));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'wages' and policyname = 'organization members can manage wages'
  ) then
    create policy "organization members can manage wages"
      on public.wages for all
      using (organization_id in (select public.current_organization_ids()))
      with check (organization_id in (select public.current_organization_ids()));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feed_purchases' and policyname = 'organization members can manage feed purchases'
  ) then
    create policy "organization members can manage feed purchases"
      on public.feed_purchases for all
      using (organization_id in (select public.current_organization_ids()))
      with check (organization_id in (select public.current_organization_ids()));
  end if;
end $$;
