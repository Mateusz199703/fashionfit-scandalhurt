-- FashionFit API keys hardening
-- Adds hashed API key storage and backfills currently active client keys.

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null,
  name text not null default 'Default key',
  scopes text[] not null default array['widget', 'sync']::text[],
  is_active boolean not null default true,
  last_used_at timestamptz,
  last_used_ip text,
  expires_at timestamptz,
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_keys_client_id on api_keys (client_id);
create index if not exists idx_api_keys_active on api_keys (is_active) where is_active = true;

-- Backfill existing plaintext client keys to hashed key store.
insert into api_keys (client_id, key_hash, key_prefix, name, scopes, is_active)
select
  c.id,
  encode(digest(c.api_key, 'sha256'), 'hex') as key_hash,
  left(c.api_key, 12) as key_prefix,
  'Migrated key' as name,
  array['widget', 'sync']::text[] as scopes,
  true
from clients c
where c.api_key is not null
  and c.api_key <> ''
  and not exists (
    select 1 from api_keys k where k.key_hash = encode(digest(c.api_key, 'sha256'), 'hex')
  );
