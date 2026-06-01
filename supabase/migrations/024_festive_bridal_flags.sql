-- Migration 024: Add is_festive + is_bridal flags to products
-- Run BEFORE deploying admin/festive/bridal page changes.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_festive BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_bridal  BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_is_festive ON products(is_festive);
CREATE INDEX IF NOT EXISTS idx_products_is_bridal  ON products(is_bridal);

COMMENT ON COLUMN products.is_festive IS 'When true the product appears in the Festive editorial grid.';
COMMENT ON COLUMN products.is_bridal  IS 'When true the product appears in the Bridal editorial grid.';
