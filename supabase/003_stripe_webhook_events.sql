-- ============================================================================
-- FashionFit — Stripe webhook idempotency & audit log
--
-- Stores Stripe event IDs so webhook processing is safe against retries and
-- duplicate deliveries. This follows SaaS billing best practices.
-- ============================================================================

create table if not exists stripe_webhook_events (
  id           uuid primary key default gen_random_uuid(),
  event_id     text not null unique,
  event_type   text not null,
  status       text not null default 'processing', -- processing|processed|failed
  payload      jsonb,
  error_message text,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  processed_at  timestamptz
);

create index if not exists idx_stripe_webhook_events_event_type
  on stripe_webhook_events (event_type);

create index if not exists idx_stripe_webhook_events_status
  on stripe_webhook_events (status);

create index if not exists idx_stripe_webhook_events_first_seen
  on stripe_webhook_events (first_seen_at);
