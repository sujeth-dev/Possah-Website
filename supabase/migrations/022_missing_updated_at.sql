-- 022_missing_updated_at.sql
-- Adds updated_at column + trigger to the 7 core tables that are missing it.
-- Verified against live DB on 2026-05-26: both trigger functions already exist
-- (update_updated_at and update_updated_at_column — using update_updated_at_column
-- for consistency with categories, products, cart_items triggers).
--
-- Tables receiving updated_at:
--   orders, coupons, journal_articles, reviews, users, user_addresses, product_variants
--
-- Tables intentionally skipped (non-mutable lookup / low-write):
--   admin_users, gift_sets, lookbooks, lookbook_looks,
--   product_images, product_look_links, product_tags, wishlists

-- ─── orders ──────────────────────────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── coupons ─────────────────────────────────────────────────────────────────
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── journal_articles ────────────────────────────────────────────────────────
ALTER TABLE journal_articles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER journal_articles_updated_at
  BEFORE UPDATE ON journal_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── reviews ─────────────────────────────────────────────────────────────────
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── users ───────────────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_addresses ──────────────────────────────────────────────────────────
ALTER TABLE user_addresses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER user_addresses_updated_at
  BEFORE UPDATE ON user_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── product_variants ────────────────────────────────────────────────────────
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Verify after running ────────────────────────────────────────────────────
-- Run this to confirm all 13 tables now have updated_at:
--
-- SELECT table_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND column_name = 'updated_at'
-- ORDER BY table_name;
--
-- Expected output includes: cart_items, categories, coupons, homepage_config,
-- journal_articles, orders, products, reviews, store_settings, user_addresses,
-- user_measurements, users, product_variants
