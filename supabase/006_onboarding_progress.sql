create table if not exists onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references clients(id) on delete cascade,
  step_account_created boolean not null default false,
  step_shop_added boolean not null default false,
  step_plugin_installed boolean not null default false,
  step_products_synced boolean not null default false,
  step_first_tryon boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_onboarding_progress_client_id on onboarding_progress (client_id);

insert into onboarding_progress (client_id, step_account_created, updated_at)
select id, true, now()
from clients
where not exists (
  select 1 from onboarding_progress op where op.client_id = clients.id
);
