# FashionFit Security and Live Checklist

## Completed in code/infrastructure

- API key abuse protection added (`429 API_KEY_TEMP_BLOCKED` after repeated invalid keys).
- Stricter rate limits enabled:
  - auth: 10 requests / 15 min
  - widget: 30 requests / min
  - dashboard API: 240 requests / 15 min
- Security audit logging enabled for key events:
  - invalid/missing API key
  - 401/403/429 responses
  - rate-limit breaches
- Production provider hardening:
  - `TRYON_ALLOW_MOCK_IN_PRODUCTION=false`
  - mock provider disabled in production fallback chain.
- CORS tightened:
  - dashboard: explicit allowlist only
  - widget: explicit allowlist only (`WIDGET_ALLOWED_ORIGINS`).
- New runtime secrets rotated in Render:
  - `JWT_SECRET`
  - `REFRESH_TOKEN_SECRET`
  - `ENCRYPTION_KEY`
  - `DEMO_API_KEY`

## Must be done manually (external providers)

### 1) Render API token
- Delete old Render personal token(s) used before.
- Create a new token and store in password manager.

### 2) Stripe keys
- Rotate `STRIPE_SECRET_KEY` (`sk_test...` currently exposed before).
- Create a new webhook endpoint secret (`STRIPE_WEBHOOK_SECRET`) and disable old endpoint.
- Verify webhook delivery status = 2xx for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### 3) Supabase keys
- Rotate project JWT secret / API keys in Supabase project settings.
- Update `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_KEY` in Render.

### 4) Google service account
- In service account keys: delete old key file and generate a fresh JSON key.
- Update `GOOGLE_CREDENTIALS_JSON` in Render.

## Backup and restore minimum

### Daily backup
- Enable automated database backups in Supabase.
- Keep at least 7 rolling backups.

### Restore test (monthly)
- Restore latest backup to a staging project.
- Run smoke tests:
  - login/register
  - add shop
  - product sync
  - try-on status polling
  - billing page loads

## Monitoring minimum

- Render alerting: notify on failed deploy and healthcheck failures.
- Stripe webhook monitoring: alert on non-2xx or spike in failures.
- Track backend logs for `[SECURITY]` events and 5xx spikes.

## Go-live gate

Go live only when all are true:
- [ ] All exposed keys rotated
- [ ] Production CORS/domain allowlists verified
- [ ] Webhooks stable 2xx for 24h
- [ ] Backup restore test passed
- [ ] Legal documents published (privacy + terms)
