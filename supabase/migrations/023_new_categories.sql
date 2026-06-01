-- Migration 023: Add new Women category destinations (taxonomy refresh)
-- Adds: dress-material, fabrics, blouses (Ethnic), tops, bottoms (Western)
-- Replaces Separates in Western with Tops + Bottoms (Separates row left intact for data safety)

INSERT INTO categories (id, name, slug, parent_id, hero_image_url, nav_section, position)
VALUES
  ('11111111-0001-0001-0001-000000000009', 'Dress Material', 'dress-material', NULL, NULL, 'Women > Ethnic',    9),
  ('11111111-0001-0001-0001-000000000010', 'Fabrics',        'fabrics',        NULL, NULL, 'Women > Ethnic',   10),
  ('11111111-0001-0001-0001-000000000011', 'Blouses',        'blouses',        NULL, NULL, 'Women > Ethnic',   11),
  ('11111111-0001-0001-0001-000000000012', 'Tops',           'tops',           NULL, NULL, 'Women > Western',  12),
  ('11111111-0001-0001-0001-000000000013', 'Bottoms',        'bottoms',        NULL, NULL, 'Women > Western',  13)
ON CONFLICT (slug) DO NOTHING;

-- Note: 'Separates' (slug: separates) is intentionally left in the categories table
-- so any existing products assigned to it remain valid. It is simply removed from
-- storefront navigation. Reassign those products before deleting this row.
