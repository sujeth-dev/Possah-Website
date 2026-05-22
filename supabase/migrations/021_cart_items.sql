-- FIX-DB-03: Persistent cart_items table for server-side cart sync.
--
-- Enables: cart survives localStorage clear, cart merges on sign-in,
-- cart analytics, abandoned cart recovery (future).
--
-- Cart logic: Zustand localStorage cart remains primary for UX speed.
-- On sign-in, server cart is fetched and merged (server wins on conflict).
-- On add-to-cart (authenticated user), item is upserted to server cart.

CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  TEXT,              -- for anonymous guest carts (future)
  variant_id  UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can have one row per variant
  UNIQUE NULLS NOT DISTINCT (user_id, variant_id),
  -- Each anonymous session can have one row per variant
  UNIQUE NULLS NOT DISTINCT (session_id, variant_id)
);

-- RLS: users can only see and manage their own cart
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_owner_all"    ON cart_items;
DROP POLICY IF EXISTS "cart_owner_insert" ON cart_items;

CREATE POLICY "cart_owner_all"
  ON cart_items FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "cart_owner_insert"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id
  ON cart_items(user_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_session_id
  ON cart_items(session_id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS cart_items_updated_at ON cart_items;
CREATE TRIGGER cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
