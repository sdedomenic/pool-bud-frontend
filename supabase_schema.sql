
-- Core tables
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stripe_account_id text,
  created_at timestamp with time zone default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  customer_name text not null,
  address text,
  phone text,
  email text,
  balance_due integer default 0,
  portal_user_id uuid references auth.users(id) on delete set null,
  last_job_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  address text not null,
  scheduled_at timestamptz not null,
  completed_at timestamptz,
  before_url text,
  after_url text,
  technician_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists chem_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  ph text,
  chlorine_ppm text,
  alkalinity text,
  taken_at timestamptz default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  sku text not null,
  name text not null,
  price_cents int not null default 0,
  qty int not null default 0,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  company_id uuid references companies(id) on delete set null,
  role text check (role in ('platform_admin','owner','admin','dispatcher','tech')) not null,
  full_name text,
  email text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  has_completed_setup boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table companies enable row level security;
alter table customers enable row level security;
alter table jobs enable row level security;
alter table chem_logs enable row level security;
alter table inventory_items enable row level security;
alter table profiles enable row level security;

-- Policies
create policy if not exists "profiles readable self" on profiles
  for select using (auth.uid() = id);

create policy if not exists "profiles insert self" on profiles
  for insert with check (auth.uid() = id);

create or replace function public.can_read_company_profile(target_company uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles requester
    where requester.id = auth.uid()
      and (
        requester.role = 'platform_admin'
        or (
          requester.company_id is not null
          and requester.company_id = target_company
          and requester.role in ('owner','admin','dispatcher','tech')
        )
      )
  );
$$;

create policy if not exists "profiles readable by company roles" on profiles
  for select using (
    auth.uid() = id or public.can_read_company_profile(company_id)
  );

create policy if not exists "companies readable by profile company" on companies
  for select using (exists (select 1 from profiles p where p.company_id = companies.id and p.id = auth.uid()));

create policy if not exists "customers by company" on customers
  for select using (exists (select 1 from profiles p where p.company_id = customers.company_id and p.id = auth.uid()));

drop policy if exists "customers insert company staff" on customers;
drop policy if exists "customers update company staff" on customers;

create policy "customers insert company staff" on customers
  for insert
  with check (
    public.can_read_company_profile(company_id)
    and exists (
      select 1 from profiles requester
      where requester.id = auth.uid()
        and requester.role in ('owner','admin','dispatcher','tech')
    )
  );

create policy "customers update company staff" on customers
  for update
  using (
    (public.can_read_company_profile(company_id)
      and exists (
        select 1 from profiles requester
        where requester.id = auth.uid()
          and requester.role in ('owner','admin','dispatcher','tech')
      ))
    or portal_user_id = auth.uid()
  )
  with check (
    (public.can_read_company_profile(company_id)
      and exists (
        select 1 from profiles requester
        where requester.id = auth.uid()
          and requester.role in ('owner','admin','dispatcher','tech')
      ))
    or portal_user_id = auth.uid()
  );

create policy if not exists "jobs by company" on jobs
  for select using (exists (select 1 from profiles p where p.company_id = jobs.company_id and p.id = auth.uid()));

create policy if not exists "jobs insert company staff" on jobs
  for insert
  with check (
    public.can_read_company_profile(company_id)
    and exists (
      select 1 from profiles requester
      where requester.id = auth.uid()
        and requester.role in ('owner','admin','dispatcher')
    )
  );

create policy if not exists "jobs update company staff" on jobs
  for update
  using (
    public.can_read_company_profile(company_id)
    and exists (
      select 1 from profiles requester
      where requester.id = auth.uid()
        and requester.role in ('owner','admin','dispatcher')
    )
  )
  with check (
    public.can_read_company_profile(company_id)
    and exists (
      select 1 from profiles requester
      where requester.id = auth.uid()
        and requester.role in ('owner','admin','dispatcher')
    )
  );

create policy if not exists "chem logs by job company" on chem_logs
  for select using (exists (
    select 1 from jobs j 
    join profiles p on p.company_id = j.company_id 
    where j.id = chem_logs.job_id and p.id = auth.uid()
  ));

create policy if not exists "inventory by company" on inventory_items
  for select using (exists (select 1 from profiles p where p.company_id = inventory_items.company_id and p.id = auth.uid()));
