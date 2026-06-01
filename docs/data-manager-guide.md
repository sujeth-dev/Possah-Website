# Data Manager Guide

How to manage products, categories, and taxonomy in Possah.

---

## Three systems — when to use which

| System | Use for |
|---|---|
| **Admin panel** (`/admin/products`) | Adding/editing 1–5 real products day-to-day |
| **data_ops pipeline** | Bulk re-seed, full catalog refresh, new image batch |
| **SQL Editor** (Supabase dashboard) | Targeted fixes, flag updates, category migrations |

Never use `seeds/seed_products.sql` for real products — that file is a redirect comment only.

---

## Adding a product (day-to-day)

1. Go to `/admin/products/new`
2. Fill in all fields — name, slug, price, fabric, category, sub_line, description, care
3. Upload images via media library
4. Add variants (colour + size + stock)
5. Tag occasions
6. Toggle **Active** ON, and **Festive** / **Bridal** if relevant
7. Save

---

## Festive + Bridal editorial curation

The Festive and Bridal pages show only products where the flag is set.

| Flag | Controls |
|---|---|
| `is_festive` | Appears in `/festive` product grid |
| `is_bridal` | Appears in `/bridal` product grid |

Set these in the admin product edit form (Festive / Bridal toggles) or via SQL:

```sql
UPDATE products SET is_festive = TRUE WHERE slug = 'your-product-slug';
UPDATE products SET is_bridal  = TRUE WHERE slug = 'your-product-slug';
```

---

## Categories

13 active categories. IDs are fixed UUIDs.

| Slug | Name | Section |
|---|---|---|
| `sarees` | Sarees | Women > Ethnic |
| `lehengas` | Lehengas | Women > Ethnic |
| `kurta-sets` | Kurta Sets | Women > Ethnic |
| `dress-material` | Dress Material | Women > Ethnic |
| `fabrics` | Fabrics | Women > Ethnic |
| `blouses` | Blouses | Women > Ethnic |
| `co-ords` | Co-Ords | Women > Western |
| `dresses` | Dresses | Women > Western |
| `tops` | Tops | Women > Western |
| `bottoms` | Bottoms | Women > Western |
| `bridal` | Bridal | Bridal |
| `festive` | Festive | Festive |
| `separates` | Separates | ⚠️ Nav-retired — data only |

Full UUID list: `scripts/data_ops/category_map.json`

Adding a category → see [`docs/change-flow.md`](./change-flow.md) Section A.

---

## Occasion tags

Valid values — use exact casing:

```
Everyday  Brunch  Workwear  Evening  Cocktail
Sangeet   Mehendi  Haldi    Wedding
```

Defined in: `lib/validations/admin-products.ts` → `OccasionTagEnum`
Also in: `scripts/data_ops/lib/products.mjs` → `OCCASION_TAGS`

---

## Fabric options

```
Silk  Linen  Cotton  Georgette  Crepe  Chiffon
Modal  Viscose  Tissue  Velvette  Satin  Tulle  Zari  Poly Blend
```

Fabric is a free-text field — these are the filter labels in `FilterSidebar.tsx`.
Keep naming consistent when entering products.

---

## Sizes

Valid values in order:

```
XS  S  M  L  XL  2XL  3XL  Free Size  Made-to-Measure
```

`XXL` is retired. If any DB rows have `XXL`, fix with:
```sql
UPDATE product_variants SET size = '2XL' WHERE size = 'XXL';
```

---

## Pipeline re-run (full catalog refresh)

Only needed when re-seeding from scratch or after major catalog changes.
Always run [`Possah_Data_Operations_Plan.md`](../Possah_Data_Operations_Plan.md) phases in order:

```bash
node scripts/data_ops/00_audit.mjs            # backup first — always
node scripts/data_ops/01_verify_categories.mjs
node scripts/data_ops/02_clean.mjs            # POINT OF NO RETURN
node scripts/data_ops/03_upload_images.mjs
node scripts/data_ops/04_seed_products.mjs
node scripts/data_ops/05_seed_orders.mjs
node scripts/data_ops/06_verify.mjs
```

Rollback: `node scripts/data_ops/99_restore.mjs`

---

## Useful SQL queries

```sql
-- Products per category
SELECT c.slug, COUNT(p.id) AS count
FROM categories c LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.slug ORDER BY c.position;

-- All distinct occasion tags in DB
SELECT tag, COUNT(*) FROM product_tags GROUP BY tag ORDER BY tag;

-- Products flagged festive / bridal
SELECT slug, is_festive, is_bridal FROM products
WHERE is_festive = TRUE OR is_bridal = TRUE;

-- Any XXL variants remaining
SELECT p.slug, pv.size FROM product_variants pv
JOIN products p ON p.id = pv.product_id WHERE pv.size = 'XXL';
```
