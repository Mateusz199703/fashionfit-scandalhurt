-- ============================================================================
-- FashionFit — module access foundation
--
-- M0 scope: tenant/shop module flags with plan fallback handled in backend.
-- ============================================================================

create table if not exists module_access (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients (id) on delete cascade,
  shop_id    uuid references shops (id) on delete cascade,
  module_key text not null,
  is_enabled boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint module_access_module_key_not_blank check (length(trim(module_key)) > 0)
);

alter table module_access
  drop constraint if exists module_access_module_key_lowercase;
alter table module_access
  add constraint module_access_module_key_lowercase
  check (module_key = lower(trim(module_key)) and module_key = trim(module_key));

alter table module_access
  drop constraint if exists module_access_module_key_allowed;
alter table module_access
  add constraint module_access_module_key_allowed
  check (module_key in (
    'ai_stylist_advisor',
    'virtual_try_on',
    'size_recommendation',
    'product_recommendations',
    'outfit_builder',
    'woocommerce_integration',
    'merchant_dashboard',
    'storefront_widget',
    'analytics',
    'billing'
  ));

-- One client-level override per module key (shop_id IS NULL).
create unique index if not exists uq_module_access_client_level
  on module_access (client_id, module_key)
  where shop_id is null;

-- One shop-level override per module key.
create unique index if not exists uq_module_access_shop_level
  on module_access (client_id, shop_id, module_key)
  where shop_id is not null;

create index if not exists idx_module_access_client
  on module_access (client_id);

create index if not exists idx_module_access_client_shop
  on module_access (client_id, shop_id);

create index if not exists idx_module_access_module_key
  on module_access (module_key);

drop trigger if exists trg_module_access_updated_at on module_access;
create trigger trg_module_access_updated_at
  before update on module_access
  for each row execute function set_updated_at();

alter table module_access enable row level security;

drop policy if exists module_access_own_data on module_access;
create policy module_access_own_data on module_access
  for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());
