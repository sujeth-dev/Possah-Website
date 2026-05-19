-- Migration 012: Gift sets (Festive page — purchasable gift boxes)

CREATE TABLE IF NOT EXISTS gift_sets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT,
  price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url    TEXT,
  includes     JSONB NOT NULL DEFAULT '[]',   -- array of what's in the box
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_sets_slug      ON gift_sets(slug);
CREATE INDEX IF NOT EXISTS idx_gift_sets_is_active ON gift_sets(is_active);
