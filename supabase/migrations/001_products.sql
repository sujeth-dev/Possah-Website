-- Migration 001: Products table
-- Run in Supabase SQL Editor or via supabase db push

CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  description         TEXT,
  fabric              TEXT,
  craft_description   TEXT,
  care_instructions   TEXT,
  drape_guide         TEXT,
  price               NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_price       NUMERIC(10, 2) CHECK (compare_price >= 0),
  category_id         UUID,                 -- FK added in 002_categories.sql
  sub_line            TEXT CHECK (sub_line IN ('THE DRAPE', 'THE EDIT', 'THE ATELIER', 'THE VAULT')),
  stock_qty           INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival      BOOLEAN NOT NULL DEFAULT FALSE,
  is_top_selling      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  meta_title          TEXT,
  meta_description    TEXT,
  audio_url           TEXT,
  craft_story_title   TEXT,
  craft_story_body    TEXT,
  craft_story_image   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_slug        ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active    ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_new       ON products(is_new_arrival);

-- ─── Product images ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt         TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_position   ON product_images(product_id, position);

-- ─── Product variants ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  colour_name  TEXT NOT NULL,
  colour_hex   TEXT NOT NULL DEFAULT '#000000',
  size         TEXT NOT NULL,
  stock_qty    INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- ─── Product tags (occasion) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS product_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL CHECK (tag IN ('Everyday', 'Brunch', 'Workwear', 'Evening', 'Sangeet', 'Mehendi', 'Haldi', 'Wedding')),
  UNIQUE (product_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag        ON product_tags(tag);

-- ─── Complete the Look (linked products per PDP) ──────────────
CREATE TABLE IF NOT EXISTS product_look_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  linked_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL DEFAULT 0,
  UNIQUE (product_id, linked_id)
);
