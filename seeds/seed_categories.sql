-- Seed: Categories
-- Run AFTER migrations 001 + 002

INSERT INTO categories (id, name, slug, parent_id, nav_section, position) VALUES
  -- Top-level ethnic
  ('11111111-0001-0001-0001-000000000001', 'Sarees',     'sarees',     NULL, 'Women > Ethnic', 1),
  ('11111111-0001-0001-0001-000000000002', 'Lehengas',   'lehengas',   NULL, 'Women > Ethnic', 2),
  ('11111111-0001-0001-0001-000000000003', 'Kurta Sets',  'kurta-sets', NULL, 'Women > Ethnic', 3),
  -- Top-level western
  ('11111111-0001-0001-0001-000000000004', 'Co-Ords',    'co-ords',    NULL, 'Women > Western', 4),
  ('11111111-0001-0001-0001-000000000005', 'Dresses',    'dresses',    NULL, 'Women > Western', 5),
  -- Separates: KEPT for data integrity (existing products reference this id).
  -- Removed from storefront nav. Reassign products before deleting this row.
  ('11111111-0001-0001-0001-000000000006', 'Separates',  'separates',  NULL, 'Women > Western', 6),
  -- Bridal
  ('11111111-0001-0001-0001-000000000007', 'Bridal',     'bridal',     NULL, 'Bridal', 7),
  -- Festive
  ('11111111-0001-0001-0001-000000000008', 'Festive',    'festive',    NULL, 'Festive', 8),
  -- New ethnic sub-categories (taxonomy refresh)
  ('11111111-0001-0001-0001-000000000009', 'Dress Material', 'dress-material', NULL, 'Women > Ethnic',   9),
  ('11111111-0001-0001-0001-000000000010', 'Fabrics',        'fabrics',        NULL, 'Women > Ethnic',  10),
  ('11111111-0001-0001-0001-000000000011', 'Blouses',        'blouses',        NULL, 'Women > Ethnic',  11),
  -- New western sub-categories (Separates replaced by Tops + Bottoms)
  ('11111111-0001-0001-0001-000000000012', 'Tops',           'tops',           NULL, 'Women > Western', 12),
  ('11111111-0001-0001-0001-000000000013', 'Bottoms',        'bottoms',        NULL, 'Women > Western', 13)
ON CONFLICT (slug) DO NOTHING;
