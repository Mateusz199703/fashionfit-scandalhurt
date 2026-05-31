-- ============================================================================
-- FashionFit — Advisor Chat MVP persistence
-- Milestone 1: minimal conversations + messages tables
-- ============================================================================

create table if not exists advisor_conversations (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients (id) on delete cascade,
  shop_id    uuid not null references shops (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists advisor_messages (
  id                         uuid primary key default gen_random_uuid(),
  conversation_id            uuid not null references advisor_conversations (id) on delete cascade,
  role                       text not null check (role in ('user', 'assistant')),
  content                    text not null,
  recommendation_product_ids uuid[] not null default '{}'::uuid[],
  created_at                 timestamptz not null default now()
);

create index if not exists idx_advisor_conversations_client_shop_created
  on advisor_conversations (client_id, shop_id, created_at desc);

create index if not exists idx_advisor_messages_conversation_created
  on advisor_messages (conversation_id, created_at asc);

drop trigger if exists trg_advisor_conversations_updated_at on advisor_conversations;
create trigger trg_advisor_conversations_updated_at
  before update on advisor_conversations
  for each row execute function set_updated_at();

alter table advisor_conversations enable row level security;
alter table advisor_messages enable row level security;

drop policy if exists advisor_conversations_own_data on advisor_conversations;
create policy advisor_conversations_own_data on advisor_conversations
  for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

drop policy if exists advisor_messages_own_data on advisor_messages;
create policy advisor_messages_own_data on advisor_messages
  for all
  using (
    conversation_id in (
      select id
      from advisor_conversations
      where client_id = auth.uid()
    )
  )
  with check (
    conversation_id in (
      select id
      from advisor_conversations
      where client_id = auth.uid()
    )
  );
