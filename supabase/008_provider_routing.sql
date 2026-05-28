-- Multi-provider try-on support (Google VTO / FASHN / mock)

alter table tryon_sessions
  add column if not exists ai_provider text default 'auto';

create table if not exists provider_usage (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  provider text not null,
  date date not null default current_date,
  count integer not null default 0,
  avg_time_ms integer,
  error_count integer not null default 0,
  unique (shop_id, provider, date)
);

create index if not exists idx_provider_usage_shop_date
  on provider_usage (shop_id, date desc);
