-- ============================================================================
-- FashionFit — Initial database schema
-- Target: Supabase (PostgreSQL 15+)
--
-- RLS assumption: each row in `clients` is keyed by the Supabase Auth user id,
-- i.e. clients.id == auth.uid(). Tenant isolation is derived from that link.
-- The backend talks to the DB with the service role key, which bypasses RLS.
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";        -- gen_random_uuid(), gen_random_bytes()

-- ============================================================================
-- Enums
-- ============================================================================
create type plan_type        as enum ('STARTER', 'GROWTH', 'SCALE');
create type client_status    as enum ('trial', 'active', 'inactive');
create type shop_platform    as enum ('woocommerce', 'shopify', 'custom');
create type product_category as enum ('tops', 'bottoms', 'one-pieces', 'outerwear', 'accessories');
create type tryon_mode       as enum ('photo', 'live_ar');
create type tryon_status     as enum ('pending', 'processing', 'completed', 'failed');

-- ============================================================================
-- Tables
-- ============================================================================

-- 1. clients -----------------------------------------------------------------
create table clients (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null unique,
  name               text not null,
  company_name       text,
  plan               plan_type     not null default 'STARTER',
  status             client_status not null default 'trial',
  api_key            text not null unique default encode(gen_random_bytes(32), 'hex'),
  stripe_customer_id text,
  trial_ends_at      timestamptz default (now() + interval '14 days'),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 2. shops -------------------------------------------------------------------
create table shops (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references clients (id) on delete cascade,
  name               text,
  domain             text not null,
  platform           shop_platform not null default 'woocommerce',
  -- NOTE: store ciphertext only; encryption/decryption handled by the backend.
  wc_consumer_key    text,
  wc_consumer_secret text,
  -- widget_config shape:
  -- { "primaryColor": "#000", "buttonLabel": "...", "position": "...",
  --   "showLiveAR": bool, "showPhotoAI": bool }
  widget_config      jsonb not null default '{}'::jsonb,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 3. products ----------------------------------------------------------------
create table products (
  id                uuid primary key default gen_random_uuid(),
  shop_id           uuid not null references shops (id) on delete cascade,
  external_id       text,                 -- WooCommerce product ID
  name              text,
  category          product_category,
  garment_image_url text,                 -- main garment image used for try-on
  product_url       text,
  variants          jsonb,                -- sizes, colors
  is_synced         boolean not null default false,
  last_synced_at    timestamptz,
  created_at        timestamptz not null default now()
);

-- 4. tryon_sessions ----------------------------------------------------------
create table tryon_sessions (
  id                  uuid primary key default gen_random_uuid(),
  shop_id             uuid not null references shops (id) on delete cascade,
  product_id          uuid references products (id) on delete set null,
  session_token       text not null unique,
  mode                tryon_mode   not null default 'photo',
  status              tryon_status not null default 'pending',
  person_image_url    text,
  result_image_url    text,
  fashn_prediction_id text,
  metadata            jsonb,             -- browser, device, etc.
  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);

-- 5. analytics_events --------------------------------------------------------
create table analytics_events (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references shops (id) on delete cascade,
  session_id  uuid references tryon_sessions (id) on delete set null,
  -- widget_open | tryon_start | tryon_complete | add_to_cart | share
  event_type  text not null,
  product_id  uuid references products (id) on delete set null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- 6. subscriptions -----------------------------------------------------------
create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  client_id              uuid not null references clients (id) on delete cascade,
  stripe_subscription_id text unique,
  plan                   text,
  status                 text,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================
create index idx_clients_stripe_customer  on clients (stripe_customer_id);

create index idx_shops_client_id          on shops (client_id);
create index idx_shops_domain             on shops (domain);

create index idx_products_shop_id         on products (shop_id);
create index idx_products_external_id     on products (external_id);
create index idx_products_category        on products (category);

create index idx_tryon_shop_id            on tryon_sessions (shop_id);
create index idx_tryon_product_id         on tryon_sessions (product_id);
create index idx_tryon_status             on tryon_sessions (status);
create index idx_tryon_created_at         on tryon_sessions (created_at);

create index idx_events_shop_id           on analytics_events (shop_id);
create index idx_events_session_id        on analytics_events (session_id);
create index idx_events_event_type        on analytics_events (event_type);
create index idx_events_product_id        on analytics_events (product_id);
create index idx_events_created_at        on analytics_events (created_at);

create index idx_subscriptions_client_id  on subscriptions (client_id);
create index idx_subscriptions_status     on subscriptions (status);

-- ============================================================================
-- updated_at trigger
-- ============================================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_clients_updated_at
  before update on clients
  for each row execute function set_updated_at();

create trigger trg_shops_updated_at
  before update on shops
  for each row execute function set_updated_at();

create trigger trg_subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- ============================================================================
-- Row Level Security — a client can only access its own data
-- ============================================================================
alter table clients          enable row level security;
alter table shops            enable row level security;
alter table products         enable row level security;
alter table tryon_sessions   enable row level security;
alter table analytics_events enable row level security;
alter table subscriptions    enable row level security;

-- clients: own row only
create policy clients_own_data on clients
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- shops: rows owned by the authenticated client
create policy shops_own_data on shops
  for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- products: rows belonging to one of the client's shops
create policy products_own_data on products
  for all
  using (shop_id in (select id from shops where client_id = auth.uid()))
  with check (shop_id in (select id from shops where client_id = auth.uid()));

-- tryon_sessions: scoped through the owning shop
create policy tryon_own_data on tryon_sessions
  for all
  using (shop_id in (select id from shops where client_id = auth.uid()))
  with check (shop_id in (select id from shops where client_id = auth.uid()));

-- analytics_events: scoped through the owning shop
create policy events_own_data on analytics_events
  for all
  using (shop_id in (select id from shops where client_id = auth.uid()))
  with check (shop_id in (select id from shops where client_id = auth.uid()));

-- subscriptions: own rows only
create policy subscriptions_own_data on subscriptions
  for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- ============================================================================
-- Views
-- ============================================================================

-- shop_analytics: per-shop event aggregates over the last 30 days.
-- security_invoker so the querying role's RLS policies are enforced.
create view shop_analytics
with (security_invoker = on) as
select
  shop_id,
  count(*) filter (where event_type = 'widget_open')    as widget_opens,
  count(*) filter (where event_type = 'tryon_start')     as tryon_starts,
  count(*) filter (where event_type = 'tryon_complete')  as tryon_completions,
  count(*) filter (where event_type = 'add_to_cart')     as add_to_carts,
  round(
    count(*) filter (where event_type = 'add_to_cart')::numeric
      / nullif(count(*) filter (where event_type = 'tryon_complete'), 0),
    4
  ) as conversion_rate
from analytics_events
where created_at >= now() - interval '30 days'
group by shop_id;

-- client_usage: try-on volume per client for the current calendar month.
create view client_usage
with (security_invoker = on) as
select
  s.client_id,
  count(t.id)                                                as total_tryons,
  count(t.id) filter (where t.status = 'completed')          as completed_tryons
from shops s
join tryon_sessions t on t.shop_id = s.id
where date_trunc('month', t.created_at) = date_trunc('month', now())
group by s.client_id;

-- ============================================================================
-- Seed data (for local/testing only)
-- ============================================================================
insert into clients (id, email, name, company_name, plan, status)
values (
  '11111111-1111-1111-1111-111111111111',
  'test@fashionfit.pl',
  'Test Client',
  'FashionFit Test Sp. z o.o.',
  'GROWTH',
  'active'
);

insert into shops (id, client_id, name, domain, platform, widget_config)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Test Shop',
  'testshop.pl',
  'woocommerce',
  '{
    "primaryColor": "#111827",
    "buttonLabel": "Przymierz wirtualnie",
    "position": "bottom-right",
    "showLiveAR": true,
    "showPhotoAI": true
  }'::jsonb
);

insert into products (shop_id, external_id, name, category, garment_image_url, product_url, is_synced)
values
  (
    '22222222-2222-2222-2222-222222222222',
    'WC-1001',
    'Klasyczny t-shirt bawełniany',
    'tops',
    'https://placehold.co/600x800/png?text=T-Shirt',
    'https://testshop.pl/produkt/tshirt-bawelniany',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'WC-1002',
    'Jeansy slim fit',
    'bottoms',
    'https://placehold.co/600x800/png?text=Jeans',
    'https://testshop.pl/produkt/jeansy-slim-fit',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'WC-1003',
    'Sukienka letnia',
    'one-pieces',
    'https://placehold.co/600x800/png?text=Dress',
    'https://testshop.pl/produkt/sukienka-letnia',
    true
  );
