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
  ('11111111-0001-0001-0001-000000000006', 'Separates',  'separates',  NULL, 'Women > Western', 6),
  -- Bridal
  ('11111111-0001-0001-0001-000000000007', 'Bridal',     'bridal',     NULL, 'Bridal', 7),
  -- Festive
  ('11111111-0001-0001-0001-000000000008', 'Festive',    'festive',    NULL, 'Festive', 8)
ON CONFLICT (slug) DO NOTHING;
