-- ============================================================================
-- FashionFit — product fact fields for richer AI stylist catalog Q&A
-- Backwards-compatible extension only (no destructive changes)
-- ============================================================================

alter table products
  add column if not exists price numeric(12,2),
  add column if not exists regular_price numeric(12,2),
  add column if not exists sale_price numeric(12,2),
  add column if not exists currency text,
  add column if not exists stock_status text,
  add column if not exists stock_quantity integer,
  add column if not exists is_in_stock boolean,
  add column if not exists attributes jsonb,
  add column if not exists colors text[],
  add column if not exists sizes text[],
  add column if not exists material text,
  add column if not exists description text,
  add column if not exists short_description text,
  add column if not exists tags jsonb,
  add column if not exists gallery_images jsonb,
  add column if not exists source_updated_at timestamptz;

create index if not exists idx_products_shop_stock_status
  on products (shop_id, stock_status);

create index if not exists idx_products_shop_is_in_stock
  on products (shop_id, is_in_stock);
