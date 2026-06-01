# Possah — Supabase SQL Actions
Run these in order in the **Supabase Dashboard → SQL Editor**.
Each block is idempotent (safe to re-run).

---

## STEP 1 — Run migration 024 (new columns)
**Run this first — app code depends on these columns existing.**

```sql
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_festive BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_bridal  BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_is_festive ON products(is_festive);
CREATE INDEX IF NOT EXISTS idx_products_is_bridal  ON products(is_bridal);
```

---

## STEP 2 — Move 13 Separates → Tops category

```sql
UPDATE products
SET category_id = '11111111-0001-0001-0001-000000000012'
WHERE category_id = '11111111-0001-0001-0001-000000000006';

-- Verify: should return 0 rows after
SELECT slug FROM products WHERE category_id = '11111111-0001-0001-0001-000000000006';
```

---

## STEP 3 — Add Cocktail tags to 7 evening/party products

**Run the constraint update first, then the insert.**

```sql
-- 3a: Extend the tag CHECK constraint to include 'Cocktail'
ALTER TABLE product_tags DROP CONSTRAINT IF EXISTS product_tags_tag_check;

ALTER TABLE product_tags
  ADD CONSTRAINT product_tags_tag_check
  CHECK (tag IN ('Everyday', 'Brunch', 'Workwear', 'Evening', 'Cocktail', 'Sangeet', 'Mehendi', 'Haldi', 'Wedding'));
```

```sql
-- 3b: Insert Cocktail tags
INSERT INTO product_tags (product_id, tag)
SELECT id, 'Cocktail'
FROM products
WHERE slug IN (
  'violet-silk-dress',
  'skin-peach-satin-dress',
  'peach-art-deco-dress',
  'champagne-glow-top',
  'rose-gold-draped-top',
  'brown-silk-top',
  'white-bomber-dress-set'
)
ON CONFLICT DO NOTHING;

-- Verify
SELECT p.slug, pt.tag FROM product_tags pt
JOIN products p ON p.id = pt.product_id
WHERE pt.tag = 'Cocktail';
```

---

## STEP 4 — Flag Festive products (19 products)

```sql
UPDATE products SET is_festive = TRUE
WHERE slug IN (
  -- Dresses
  'violet-silk-dress', 'skin-peach-satin-dress', 'peach-art-deco-dress',
  'deep-plum-dress', 'plum-dress', 'fuchsia-calm-dress',
  'purple-gold-flower-dress', 'pink-bridesmaid-dress',
  -- Tops / Co-ords
  'rose-gold-draped-top', 'champagne-glow-top', 'white-bomber-dress-set',
  -- Sarees
  'the-noor-saree', 'the-jade-drape', 'the-ember-saree', 'the-dusk-saree',
  -- Lehengas
  'the-scarlet-lehenga', 'the-saffron-lehenga', 'the-pearl-lehenga', 'the-sage-lehenga'
);

-- Verify
SELECT COUNT(*) AS festive_count FROM products WHERE is_festive = TRUE;
-- Expected: 19
```

---

## STEP 5 — Flag Bridal products (11 products)

```sql
UPDATE products SET is_bridal = TRUE
WHERE slug IN (
  -- Sarees
  'the-noor-saree', 'the-jade-drape', 'the-ember-saree',
  -- Lehengas
  'the-scarlet-lehenga', 'the-saffron-lehenga', 'the-pearl-lehenga', 'the-sage-lehenga',
  -- Dresses
  'pink-bridesmaid-dress', 'purple-gold-flower-dress',
  'violet-silk-dress', 'skin-peach-satin-dress'
);

-- Verify
SELECT COUNT(*) AS bridal_count FROM products WHERE is_bridal = TRUE;
-- Expected: 11
```

---

## STEP 6 — Final verification

```sql
SELECT
  COUNT(*) FILTER (WHERE is_active = TRUE)  AS active,
  COUNT(*) FILTER (WHERE is_festive = TRUE) AS festive,
  COUNT(*) FILTER (WHERE is_bridal  = TRUE) AS bridal,
  COUNT(*) FILTER (WHERE category_id = '11111111-0001-0001-0001-000000000012') AS tops,
  COUNT(*) FILTER (WHERE category_id = '11111111-0001-0001-0001-000000000006') AS separates_remaining
FROM products;

-- Expected: active=42, festive=19, bridal=11, tops=13, separates_remaining=0
```

---

## After all steps — deploy app

Push to Vercel (or restart local dev server). The festive and bridal pages
will now show only flagged products. Admin product form has Festive + Bridal
toggles to manage this going forward.
