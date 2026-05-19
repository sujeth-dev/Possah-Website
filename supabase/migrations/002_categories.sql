-- Migration 002: Categories table

CREATE TABLE IF NOT EXISTS categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  hero_image_url  TEXT,
  nav_section     TEXT,   -- e.g. 'Women > Ethnic', 'Bridal', 'Festive'
  position        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug      ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_position  ON categories(position);

-- Add FK from products to categories (deferred so migration order works)
ALTER TABLE products
  ADD CONSTRAINT fk_products_category
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
