-- ============================================================================
-- FashionFit — company NIP for invoice onboarding
-- ============================================================================

alter table clients
  add column if not exists company_nip text;

create index if not exists idx_clients_company_nip
  on clients (company_nip);
