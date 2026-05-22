-- FIX-DB-02: Performance indexes + full-text search vector.
--
-- Adds partial and composite indexes for the most common query patterns.
-- All use IF NOT EXISTS — safe to run multiple times.

-- Product variants: fast stock checks and cart lookups
CREATE INDEX IF NOT EXISTS idx_variants_product_active
  ON product_variants(product_id)
  WHERE stock_qty > 0;

-- Wishlists: user-scoped reads
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id
  ON wishlists(user_id);

-- Reviews: per-product approved reviews (most common query on PDP)
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved
  ON reviews(product_id)
  WHERE is_approved = true;

-- Coupons: code lookup with active filter (all coupon validates hit this)
CREATE INDEX IF NOT EXISTS idx_coupons_code_active
  ON coupons(code)
  WHERE is_active = true;

-- Journal: slug lookup for published articles (published_at IS NOT NULL = published)
CREATE INDEX IF NOT EXISTS idx_journal_slug_published
  ON journal_articles(slug)
  WHERE published_at IS NOT NULL;

-- Journal: listing page sorted by date (most common admin + public query)
CREATE INDEX IF NOT EXISTS idx_journal_created_desc
  ON journal_articles(created_at DESC)
  WHERE published_at IS NOT NULL;

-- Orders: customer email lookup (account page — orders keyed by email, no user_id column)
CREATE INDEX IF NOT EXISTS idx_orders_customer_email_created
  ON orders(customer_email, created_at DESC);

-- Orders: gateway_order_id lookup (webhook + verify routes — called on every payment)
CREATE INDEX IF NOT EXISTS idx_orders_gateway_order_id
  ON orders(gateway_order_id);

-- ─── Full-text search on products ────────────────────────────────────────────
-- Generated stored column — automatically updated on INSERT/UPDATE.
-- Enables fast full-text search via /api/search without pg_trgm extension.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(fabric, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'C')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search
  ON products USING GIN(search_vector);

-- Verify index sizes:
-- SELECT indexname, pg_size_pretty(pg_relation_size(indexrelid))
-- FROM pg_stat_user_indexes WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;
