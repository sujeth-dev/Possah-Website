-- FIX-DB-01: Add updated_at column and trigger to categories table.
--
-- Problem: categories had no updated_at column. sitemap.ts queried
-- categories.updated_at and got undefined for every category, producing
-- invalid sitemap lastmod values.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Set existing rows to their created_at date (best approximation)
UPDATE categories SET updated_at = created_at WHERE updated_at IS NULL;

-- Trigger function (may already exist from products migration — CREATE OR REPLACE is safe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to categories
DROP TRIGGER IF EXISTS categories_updated_at_trigger ON categories;
CREATE TRIGGER categories_updated_at_trigger
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify:
-- SELECT id, name, updated_at FROM categories LIMIT 5;
-- UPDATE categories SET name = name WHERE id = (SELECT id FROM categories LIMIT 1);
-- → updated_at should change to NOW()
