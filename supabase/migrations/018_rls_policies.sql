-- FIX-SEC-03: Row Level Security on all unprotected tables
-- Only migration 017 (store_settings) had RLS. All 16 other tables were fully exposed.
-- Run on local Supabase first, then staging, then production.

-- ─── Enable RLS on all tables ────────────────────────────────────────────────
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_look_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_measurements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_articles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbooks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_sets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users        ENABLE ROW LEVEL SECURITY;

-- ─── Public anon read (storefront catalog) ───────────────────────────────────
-- Anon users can browse the catalog — these are public storefront data.
CREATE POLICY "products_anon_read"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "images_anon_read"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "variants_anon_read"
  ON product_variants FOR SELECT
  USING (true);

CREATE POLICY "tags_anon_read"
  ON product_tags FOR SELECT
  USING (true);

CREATE POLICY "look_links_anon_read"
  ON product_look_links FOR SELECT
  USING (true);

CREATE POLICY "categories_anon_read"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "homepage_anon_read"
  ON homepage_config FOR SELECT
  USING (true);

CREATE POLICY "journal_anon_read"
  ON journal_articles FOR SELECT
  USING (published_at IS NOT NULL);

CREATE POLICY "lookbooks_anon_read"
  ON lookbooks FOR SELECT
  USING (true);

CREATE POLICY "gift_sets_anon_read"
  ON gift_sets FOR SELECT
  USING (true);

-- ─── Reviews ─────────────────────────────────────────────────────────────────
-- Public can read approved reviews. Authenticated users can submit.
CREATE POLICY "reviews_anon_read"
  ON reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "reviews_user_insert"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── Orders ──────────────────────────────────────────────────────────────────
-- orders has NO user_id column — orders are keyed by customer_email only.
-- All order reads/writes go through server API routes using the service role key
-- which bypasses RLS. No client-facing policies = deny all from browser.
-- This is intentional: order data must never be readable by anonymous clients.

CREATE POLICY "wishlists_owner_all"
  ON wishlists FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "addresses_owner_all"
  ON user_addresses FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "measurements_owner_all"
  ON user_measurements FOR ALL
  USING (auth.uid() = user_id);

-- ─── Locked tables ───────────────────────────────────────────────────────────
-- coupons: no direct client read — all coupon logic goes through /api/coupons/validate
--   which uses the service role key. Anon clients cannot enumerate coupon codes.
-- admin_users: no client access at all. Admin auth is JWT-based (NextAuth + token.isAdmin).
--   Server uses service role which bypasses RLS.
-- No policies created for coupons or admin_users = deny all from browser.

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- Using anon key client (not service role):
-- SELECT * FROM orders;          -- must return 0 rows (no session)
-- SELECT * FROM coupons;         -- must return error (no policy)
-- SELECT * FROM admin_users;     -- must return error (no policy)
-- SELECT * FROM products WHERE is_active = true;  -- must return products
