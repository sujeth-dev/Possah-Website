-- Seed: 10 sample products
-- Run AFTER seed_categories.sql

INSERT INTO products (
  id, slug, name, description, fabric, craft_description, care_instructions,
  price, compare_price, category_id, sub_line, stock_qty,
  is_featured, is_new_arrival, is_top_selling, is_active,
  meta_title, meta_description,
  craft_story_title, craft_story_body
) VALUES

-- 1. Noor Saree (New Arrival, Top Selling)
(
  'aaaaaaaa-0001-0001-0001-000000000001',
  'the-noor-saree',
  'The Noor Saree',
  'A Dusty Rose Chikankari Silk saree, handwoven in Lucknow. Crafted for the woman who knows exactly who she is when she enters a room.',
  'Pure Chikankari Silk',
  'Handwoven by master weavers in Lucknow over 72 hours. Each motif is hand-embroidered using the centuries-old chikankari technique.',
  'Dry clean recommended. Store in a muslin bag away from direct sunlight. Do not wring or machine wash.',
  42000, NULL,
  '11111111-0001-0001-0001-000000000001',
  'THE DRAPE', 12,
  TRUE, TRUE, TRUE, TRUE,
  'The Noor Saree — Dusty Rose Chikankari Silk | The Possah',
  'Shop The Noor Saree — handwoven Dusty Rose Chikankari Silk from Lucknow. Designed for the woman who knows what she wants.',
  'The Craft Behind Noor',
  'In a quiet atelier in Lucknow, master weavers spent 72 hours bringing Noor to life — stitch by stitch, motif by motif. This is not fast fashion. This is patience, made wearable.'
),

-- 2. Veil Drape (New Arrival)
(
  'aaaaaaaa-0002-0002-0002-000000000002',
  'the-veil-drape',
  'The Veil Drape',
  'An ivory silk saree from The Spring 26 collection. Quiet luxury in its purest form.',
  'Pure Banarasi Silk',
  'Woven on traditional pit looms in Varanasi. The zari work is hand-applied by skilled karigars.',
  'Dry clean only. Handle the zari border with care.',
  52000, NULL,
  '11111111-0001-0001-0001-000000000001',
  'THE ATELIER', 5,
  TRUE, TRUE, FALSE, TRUE,
  'The Veil Drape — Ivory Banarasi Silk | The Possah',
  'Shop The Veil Drape — pure Banarasi Silk from Varanasi. Part of the Possah Spring 26 collection.',
  'The Craft Behind Veil',
  'Varanasi''s weavers have passed this technique across generations. The Veil Drape carries that legacy — a quiet conversation between tradition and modern restraint.'
),

-- 3. Ember Lehenga (Featured)
(
  'aaaaaaaa-0003-0003-0003-000000000003',
  'the-ember-lehenga',
  'The Ember Lehenga',
  'A deep burgundy embroidered lehenga set. For the woman who commands attention without asking for it.',
  'Raw Silk with Thread Embroidery',
  'Hand-embroidered over 120 hours by artisans in Jaipur. The motifs are inspired by Rajasthani architecture.',
  'Dry clean only. Do not iron directly on the embroidery.',
  98000, NULL,
  '11111111-0001-0001-0001-000000000002',
  'THE ATELIER', 3,
  TRUE, FALSE, TRUE, TRUE,
  'The Ember Lehenga — Burgundy Raw Silk | The Possah',
  'Shop The Ember Lehenga — hand-embroidered raw silk from Jaipur. For bridal, sangeet, and moments that deserve to be remembered.',
  'The Craft Behind Ember',
  'Every thread on the Ember Lehenga was placed by hand over 120 hours. The artisans in Jaipur refer to this as ''stitching a story'' — and this one is yours.'
),

-- 4. Chai Co-Ord Set
(
  'aaaaaaaa-0004-0004-0004-000000000004',
  'the-chai-co-ord',
  'The Chai Co-Ord Set',
  'A structured Honey Brown kurta + palazzo set. Everyday luxury.',
  'Linen-Silk Blend',
  'Structured cuts with a subtle natural sheen. Hand-finished seams.',
  'Hand wash in cold water. Iron on low heat. Do not tumble dry.',
  18500, NULL,
  '11111111-0001-0001-0001-000000000004',
  'THE EDIT', 20,
  FALSE, TRUE, FALSE, TRUE,
  'The Chai Co-Ord Set — Honey Brown Linen-Silk | The Possah',
  'Shop The Chai Co-Ord Set — honey brown linen-silk blend. Structured, refined, everyday.',
  NULL, NULL
),

-- 5. Drift Dress
(
  'aaaaaaaa-0005-0005-0005-000000000005',
  'the-drift-dress',
  'The Drift Dress',
  'A sage green silk midi dress. Movement captured in fabric.',
  'Pure Crepe Silk',
  'Cut on the bias for natural drape. Finished with a hand-rolled hem.',
  'Hand wash cold. Lay flat to dry.',
  24000, NULL,
  '11111111-0001-0001-0001-000000000005',
  'THE EDIT', 8,
  FALSE, TRUE, FALSE, TRUE,
  'The Drift Dress — Sage Green Crepe Silk | The Possah',
  'Shop The Drift Dress — pure crepe silk in sage green. Designed to move with you.',
  NULL, NULL
),

-- 6. Structured Co-Ord Set
(
  'aaaaaaaa-0006-0006-0006-000000000006',
  'the-structure-co-ord',
  'The Structure Co-Ord',
  'A deep green kurta + cigarette pant set. Clean lines, quiet authority.',
  'Cotton-Silk Blend',
  'Precision-cut with minimal embellishment. Let the fabric speak.',
  'Machine wash cold, gentle cycle. Do not bleach.',
  32000, NULL,
  '11111111-0001-0001-0001-000000000004',
  'THE EDIT', 15,
  FALSE, FALSE, TRUE, TRUE,
  'The Structure Co-Ord — Deep Green Cotton-Silk | The Possah',
  'Shop The Structure Co-Ord — deep green cotton-silk blend. Workwear redefined.',
  NULL, NULL
),

-- 7. Possah Silk Saree (Sale)
(
  'aaaaaaaa-0007-0007-0007-000000000007',
  'the-possah-silk-saree',
  'The Possah Silk Saree',
  'A warm taupe pure silk saree. Timeless, effortless, hers.',
  'Pure Mysore Silk',
  'Woven in Mysore with traditional silk threads. The weight and lustre are signature Mysore.',
  'Dry clean only.',
  38000, 45000,
  '11111111-0001-0001-0001-000000000001',
  'THE DRAPE', 7,
  FALSE, FALSE, TRUE, TRUE,
  'The Possah Silk Saree — Taupe Pure Mysore Silk | The Possah',
  'Shop The Possah Silk Saree — pure Mysore silk in taupe. Timeless luxury at an exceptional price.',
  NULL, NULL
),

-- 8. Indian Silk Lehenga
(
  'aaaaaaaa-0008-0008-0008-000000000008',
  'the-golden-lehenga',
  'The Golden Lehenga',
  'A rich gold tissue silk lehenga. Made for the moments you will never forget.',
  'Tissue Silk with Zardozi',
  'Zardozi embroidery done by hand using gold metallic thread in Lucknow.',
  'Dry clean only. Store in the garment bag provided.',
  125000, NULL,
  '11111111-0001-0001-0001-000000000002',
  'THE ATELIER', 2,
  TRUE, FALSE, FALSE, TRUE,
  'The Golden Lehenga — Gold Tissue Silk with Zardozi | The Possah',
  'Shop The Golden Lehenga — handcrafted tissue silk with Zardozi embroidery. Bridal and wedding.',
  'The Craft Behind Golden',
  'Gold thread, woven by hand. The Zardozi artisans of Lucknow have kept this tradition alive for centuries — and each stitch on The Golden Lehenga carries that weight.'
),

-- 9. Kurta Set
(
  'aaaaaaaa-0009-0009-0009-000000000009',
  'the-linen-kurta-set',
  'The Linen Kurta Set',
  'A white linen kurta set with delicate mirror work. Everyday, elevated.',
  'Pure Linen with Mirror Work',
  'Mirror work applied by hand. Each piece is unique.',
  'Hand wash cold. Iron while slightly damp.',
  16000, NULL,
  '11111111-0001-0001-0001-000000000003',
  'THE EDIT', 18,
  FALSE, TRUE, FALSE, TRUE,
  'The Linen Kurta Set — White Linen with Mirror Work | The Possah',
  'Shop The Linen Kurta Set — pure white linen with hand-applied mirror work.',
  NULL, NULL
),

-- 10. Separates Top
(
  'aaaaaaaa-0010-0010-0010-000000000010',
  'the-rose-separate-top',
  'The Rose Separate Top',
  'A dusty rose chikankari crop blouse. The foundation of every perfect look.',
  'Georgette Chikankari',
  'Hand-embroidered on georgette. Wear with sarees, palazzos, or denim.',
  'Hand wash cold with mild detergent.',
  8500, NULL,
  '11111111-0001-0001-0001-000000000006',
  'THE EDIT', 25,
  FALSE, FALSE, FALSE, TRUE,
  'The Rose Separate Top — Dusty Rose Chikankari Georgette | The Possah',
  'Shop The Rose Separate Top — dusty rose chikankari georgette. Versatile, refined, hers.',
  NULL, NULL
)
ON CONFLICT (slug) DO NOTHING;

-- Product images (using placeholder paths — replace with real URLs post-upload)
INSERT INTO product_images (product_id, url, alt, position) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', '/images/placeholder-product.jpg', 'The Noor Saree — front view', 0),
  ('aaaaaaaa-0002-0002-0002-000000000002', '/images/placeholder-product.jpg', 'The Veil Drape — front view', 0),
  ('aaaaaaaa-0003-0003-0003-000000000003', '/images/placeholder-product.jpg', 'The Ember Lehenga — front view', 0),
  ('aaaaaaaa-0004-0004-0004-000000000004', '/images/placeholder-product.jpg', 'The Chai Co-Ord — front view', 0),
  ('aaaaaaaa-0005-0005-0005-000000000005', '/images/placeholder-product.jpg', 'The Drift Dress — front view', 0),
  ('aaaaaaaa-0006-0006-0006-000000000006', '/images/placeholder-product.jpg', 'The Structure Co-Ord — front view', 0),
  ('aaaaaaaa-0007-0007-0007-000000000007', '/images/placeholder-product.jpg', 'The Possah Silk Saree — front view', 0),
  ('aaaaaaaa-0008-0008-0008-000000000008', '/images/placeholder-product.jpg', 'The Golden Lehenga — front view', 0),
  ('aaaaaaaa-0009-0009-0009-000000000009', '/images/placeholder-product.jpg', 'The Linen Kurta Set — front view', 0),
  ('aaaaaaaa-0010-0010-0010-000000000010', '/images/placeholder-product.jpg', 'The Rose Separate Top — front view', 0)
ON CONFLICT DO NOTHING;

-- Product variants
INSERT INTO product_variants (product_id, colour_name, colour_hex, size, stock_qty) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Dusty Rose',    '#C99A99', 'S',   3),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Dusty Rose',    '#C99A99', 'M',   4),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Dusty Rose',    '#C99A99', 'L',   5),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'Ivory',         '#F4ECDF', 'Free Size', 5),
  ('aaaaaaaa-0003-0003-0003-000000000003', 'Burgundy',      '#7B1C2C', 'S',   1),
  ('aaaaaaaa-0003-0003-0003-000000000003', 'Burgundy',      '#7B1C2C', 'M',   2),
  ('aaaaaaaa-0004-0004-0004-000000000004', 'Honey Brown',   '#B8832A', 'S',   6),
  ('aaaaaaaa-0004-0004-0004-000000000004', 'Honey Brown',   '#B8832A', 'M',   7),
  ('aaaaaaaa-0004-0004-0004-000000000004', 'Honey Brown',   '#B8832A', 'L',   7),
  ('aaaaaaaa-0005-0005-0005-000000000005', 'Sage Green',    '#7D9B7A', 'S',   3),
  ('aaaaaaaa-0005-0005-0005-000000000005', 'Sage Green',    '#7D9B7A', 'M',   5),
  ('aaaaaaaa-0006-0006-0006-000000000006', 'Deep Green',    '#1F3A2D', 'S',   5),
  ('aaaaaaaa-0006-0006-0006-000000000006', 'Deep Green',    '#1F3A2D', 'M',   5),
  ('aaaaaaaa-0006-0006-0006-000000000006', 'Deep Green',    '#1F3A2D', 'L',   5),
  ('aaaaaaaa-0007-0007-0007-000000000007', 'Taupe',         '#B8A898', 'Free Size', 7),
  ('aaaaaaaa-0008-0008-0008-000000000008', 'Gold',          '#C8973A', 'S',   1),
  ('aaaaaaaa-0008-0008-0008-000000000008', 'Gold',          '#C8973A', 'M',   1),
  ('aaaaaaaa-0009-0009-0009-000000000009', 'White',         '#FAFAFA', 'S',   6),
  ('aaaaaaaa-0009-0009-0009-000000000009', 'White',         '#FAFAFA', 'M',   6),
  ('aaaaaaaa-0009-0009-0009-000000000009', 'White',         '#FAFAFA', 'L',   6),
  ('aaaaaaaa-0010-0010-0010-000000000010', 'Dusty Rose',    '#C99A99', 'XS',  6),
  ('aaaaaaaa-0010-0010-0010-000000000010', 'Dusty Rose',    '#C99A99', 'S',   8),
  ('aaaaaaaa-0010-0010-0010-000000000010', 'Dusty Rose',    '#C99A99', 'M',   7),
  ('aaaaaaaa-0010-0010-0010-000000000010', 'Dusty Rose',    '#C99A99', 'L',   4)
ON CONFLICT DO NOTHING;

-- Product tags
INSERT INTO product_tags (product_id, tag) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Brunch'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Evening'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Wedding'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'Wedding'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'Evening'),
  ('aaaaaaaa-0003-0003-0003-000000000003', 'Sangeet'),
  ('aaaaaaaa-0003-0003-0003-000000000003', 'Wedding'),
  ('aaaaaaaa-0003-0003-0003-000000000003', 'Mehendi'),
  ('aaaaaaaa-0004-0004-0004-000000000004', 'Everyday'),
  ('aaaaaaaa-0004-0004-0004-000000000004', 'Brunch'),
  ('aaaaaaaa-0004-0004-0004-000000000004', 'Workwear'),
  ('aaaaaaaa-0005-0005-0005-000000000005', 'Everyday'),
  ('aaaaaaaa-0005-0005-0005-000000000005', 'Brunch'),
  ('aaaaaaaa-0006-0006-0006-000000000006', 'Workwear'),
  ('aaaaaaaa-0006-0006-0006-000000000006', 'Evening'),
  ('aaaaaaaa-0007-0007-0007-000000000007', 'Everyday'),
  ('aaaaaaaa-0007-0007-0007-000000000007', 'Evening'),
  ('aaaaaaaa-0008-0008-0008-000000000008', 'Wedding'),
  ('aaaaaaaa-0008-0008-0008-000000000008', 'Sangeet'),
  ('aaaaaaaa-0009-0009-0009-000000000009', 'Everyday'),
  ('aaaaaaaa-0009-0009-0009-000000000009', 'Brunch'),
  ('aaaaaaaa-0010-0010-0010-000000000010', 'Everyday'),
  ('aaaaaaaa-0010-0010-0010-000000000010', 'Brunch')
ON CONFLICT DO NOTHING;
