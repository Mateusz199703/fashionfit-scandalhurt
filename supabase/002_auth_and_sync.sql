-- ============================================================================
-- FashionFit — auth & sync support
--
-- Adds the password hash used by the backend's custom JWT auth, and a
-- uniqueness constraint so WooCommerce product sync can upsert by
-- (shop_id, external_id) instead of creating duplicates on every run.
-- ============================================================================

alter table clients
  add column if not exists password_hash text;

alter table products
  add constraint products_shop_external_unique unique (shop_id, external_id);
