# Possah — SQL, Migrations & Seeding Guide

Complete reference for running the database locally, on staging, and in production.
Keep this document open any time you touch the DB.

---

## 1. How the DB is structured

```
supabase/migrations/   ← schema changes, run in number order, run ONCE ever
seeds/                 ← reference data, safe to re-run (all use ON CONFLICT DO NOTHING)
```

**Migration order matters.** Each file depends on the ones before it.
Never skip a number. Never re-order.

---

## 2. Two workflows: Local vs Production (Supabase Cloud)

### A — Local development (Supabase CLI)

```bash
# 1. Start local Supabase (first time or after restart)
supabase start

# 2. Full reset — drops everything, re-runs all migrations, then seeds
supabase db reset

# 3. After reset, copy the local keys printed to your .env.local
#    (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)

# 4. Run the dev server
npm run dev
```

`supabase db reset` automatically runs every migration in `supabase/migrations/` in order,
then runs any SQL in `supabase/seed.sql` if it exists.
Because our seeds are separate files, run them manually after reset — see Section 4.

---

### B — Production (Supabase Cloud — SQL Editor)

Go to: **Supabase Dashboard → your project → SQL Editor**

Run files in this exact order. Paste each file's content and click Run.

---

## 3. Migration run order (full schema)

Run each file once. If a migration has already been applied, skip it — the
`IF NOT EXISTS` / `IF EXISTS` guards make most safe to re-run, but don't rely on it.

| # | File | What it does |
|---|------|--------------|
| 001 | `001_products.sql` | Products table + variants + images + tags |
| 002 | `002_categories.sql` | Categories table + FK on products |
| 003 | `003_orders.sql` | Orders + order items |
| 004 | `004_users.sql` | User profiles |
| 005 | `005_user_measurements.sql` | MTM measurements |
| 006 | `006_user_addresses.sql` | Saved addresses |
| 007 | `007_wishlists.sql` | Wishlists |
| 008 | `008_coupons.sql` | Coupon codes |
| 009 | `009_reviews.sql` | Product reviews |
| 010 | `010_homepage_config.sql` | Homepage config table |
| 011 | `011_admin_users.sql` | Admin user table |
| 012 | `012_gift_sets.sql` | Gift sets |
| 013 | `013_journal_articles.sql` | Journal / blog |
| 014 | `014_lookbooks.sql` | Lookbook collections |
| 015 | `015_rpc_functions.sql` | Stored functions |
| 016 | `016_add_ready_to_ship.sql` | `is_ready_to_ship` column on products |
| 017 | `017_store_settings.sql` | Store settings table |
| 018 | `018_rls_policies.sql` | Row Level Security policies |
| 018b | `018b_admin_users_fix.sql` | Admin RLS fix |
| 019 | `019_categories_updated_at.sql` | `updated_at` on categories |
| 020 | `020_performance_indexes.sql` | DB indexes |
| 021 | `021_cart_items.sql` | Persistent cart items |
| 022 | `022_missing_updated_at.sql` | `updated_at` on remaining tables |
| 023 | `023_new_categories.sql` | New category rows: dress-material, fabrics, blouses, tops, bottoms |

**When adding a new migration:** name it `024_description.sql`, `025_...` etc.
Never reuse or edit a past migration number.

---

## 4. Seed run order (reference / sample data)

Run AFTER all migrations. Safe to re-run — every INSERT uses `ON CONFLICT DO NOTHING`.

```
1. seeds/seed_categories.sql      ← categories must exist before products
2. seeds/seed_products.sql        ← products, variants, images, tags
3. seeds/seed_homepage_config.sql ← homepage config, lookbook, journal, reviews, coupons
```

**In SQL Editor:** paste + run each file in order. No partial runs — run the whole file.

---

## 5. Current category table — verified state

| ID suffix | Name | Slug | Nav section | Status |
|-----------|------|------|-------------|--------|
| ...001 | Sarees | `sarees` | Women > Ethnic | ✅ Active |
| ...002 | Lehengas | `lehengas` | Women > Ethnic | ✅ Active |
| ...003 | Kurta Sets | `kurta-sets` | Women > Ethnic | ✅ Active |
| ...004 | Co-Ords | `co-ords` | Women > Western | ✅ Active |
| ...005 | Dresses | `dresses` | Women > Western | ✅ Active |
| ...006 | Separates | `separates` | Women > Western | ⚠️ Nav-retired — row kept for data safety. Reassign any products before deleting. |
| ...007 | Bridal | `bridal` | Bridal | ✅ Active |
| ...008 | Festive | `festive` | Festive | ✅ Active |
| ...009 | Dress Material | `dress-material` | Women > Ethnic | ✅ New |
| ...010 | Fabrics | `fabrics` | Women > Ethnic | ✅ New |
| ...011 | Blouses | `blouses` | Women > Ethnic | ✅ New |
| ...012 | Tops | `tops` | Women > Western | ✅ New |
| ...013 | Bottoms | `bottoms` | Women > Western | ✅ New |

---

## 6. Current seed product coverage — verified state

| # | Product | Category | Tags | 2XL/3XL variant? |
|---|---------|----------|------|-------------------|
| 1 | The Noor Saree | sarees | Brunch, Evening, Wedding | S/M/L |
| 2 | The Veil Drape | sarees | Wedding, Evening | Free Size |
| 3 | The Ember Lehenga | lehengas | Sangeet, Wedding, Mehendi, **Cocktail** | S/M |
| 4 | The Chai Co-Ord | co-ords | Everyday, Brunch, Workwear | S/M/L |
| 5 | The Drift Dress | dresses | Everyday, Brunch, **Cocktail** | S/M |
| 6 | The Structure Co-Ord | co-ords | Workwear, Evening | S/M/L |
| 7 | The Possah Silk Saree | sarees | Everyday, Evening | Free Size |
| 8 | The Golden Lehenga | lehengas | Wedding, Sangeet, **Cocktail** | S/M |
| 9 | The Linen Kurta Set | kurta-sets | Everyday, Brunch | S/M/L |
| 10 | The Rose Separate Top | **tops** *(was separates)* | Everyday, Brunch | XS/S/M/L |
| 11 | The Ivory Dress Material | dress-material | Everyday, Wedding | Free Size |
| 12 | The Sage Georgette Fabric | fabrics | Everyday | Free Size |
| 13 | The Deep Back Blouse | blouses | Evening, Cocktail, Wedding | S/M/L |
| 14 | The Cropped Linen Top | tops | Everyday, Brunch | XS/S/M/L |
| 15 | The Wide Leg Pant | bottoms | Everyday, Brunch | XS/S/M/L |

**Note on 2XL/3XL in seeds:** Seed variants intentionally use S/M/L/XS/Free Size only —
these are sample/demo products. When you enter real products via admin, select 2XL/3XL as needed.

---

## 7. Occasion tag vocabulary — verified (matches admin + filter + validation)

These are the only valid tags. Use exactly this casing everywhere.

```
Everyday  |  Brunch  |  Workwear  |  Evening
Cocktail  |  Sangeet  |  Mehendi  |  Haldi  |  Wedding
```

`Cocktail` was added in the taxonomy refresh (migration none needed — it is a tag value,
not a DB constraint). It is live in: `FilterSidebar`, `ProductForm`, `OccasionTagEnum`.

---

## 8. Size vocabulary — verified

Valid sizes in order. Use exactly this casing.

```
XS  |  S  |  M  |  L  |  XL  |  2XL  |  3XL  |  Free Size  |  Made-to-Measure
```

`XXL` is retired. If any existing DB rows still have `XXL`, run this once in SQL Editor:

```sql
UPDATE product_variants SET size = '2XL' WHERE size = 'XXL';
```

---

## 9. Fabric vocabulary — verified (filter options)

```
Silk | Linen | Cotton | Georgette | Crepe | Chiffon
Modal | Viscose | Tissue | Velvette | Satin | Tulle | Zari | Poly Blend
```

Fabric is a free-text field on products — these are filter labels, not DB constraints.
Keep naming consistent when entering products in admin.

---

## 10. When you add a new category (checklist)

1. **DB migration** — create `0XX_new_categories.sql` in `supabase/migrations/`, run it.
2. **Seed** — add the row to `seeds/seed_categories.sql` (with a fixed UUID).
3. **Header nav** — add to `NAV_ITEMS` in `components/layout/Header.tsx`.
4. **Women page** — add to `ETHNIC_CATEGORIES` or `WESTERN_CATEGORIES` in `app/(shop)/women/page.tsx`.
5. **Sample product** — add at least one product to `seeds/seed_products.sql` for the new category.
6. **Run** — apply migration → re-run seeds on target environment.

---

## 11. When you retire a category (checklist)

1. **Nav** — remove from `Header.tsx` NAV_ITEMS and `MobileNav` (handled automatically via Header).
2. **Women page** — remove from `ETHNIC_CATEGORIES` / `WESTERN_CATEGORIES`.
3. **Footer** — check `Footer.tsx` for stale links.
4. **Homepage components** — check `CategoryCircles.tsx`, `CategorySplit.tsx`.
5. **DB row** — DO NOT delete the row until all products are reassigned to a new category.
   Run this to check: `SELECT COUNT(*) FROM products WHERE category_id = '<retired_id>';`
6. **Reassign products** — via admin UI or SQL: `UPDATE products SET category_id = '<new_id>' WHERE category_id = '<retired_id>';`
7. **Then delete** — `DELETE FROM categories WHERE slug = '<retired_slug>';`
8. **Seed** — annotate the row in `seed_categories.sql` as retired, or remove it.

---

## 12. Quick verification queries (run in SQL Editor any time)

```sql
-- All categories with product counts
SELECT c.slug, c.name, c.nav_section, COUNT(p.id) AS products
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
GROUP BY c.id, c.slug, c.name, c.nav_section
ORDER BY c.position;

-- Any products still on Separates
SELECT id, slug, name FROM products WHERE category_id = '11111111-0001-0001-0001-000000000006';

-- Any variants still using XXL
SELECT p.slug, pv.size FROM product_variants pv
JOIN products p ON p.id = pv.product_id
WHERE pv.size = 'XXL';

-- All distinct occasion tags in use
SELECT DISTINCT tag FROM product_tags ORDER BY tag;

-- Homepage config exists
SELECT id, created_at FROM homepage_config LIMIT 1;
```

---

## 13. Environment variables required (recap)

| Variable | Where | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | ✅ |
| `NEXTAUTH_SECRET` | `.env.local` | ✅ |
| `NEXTAUTH_URL` | `.env.local` | ✅ (`http://localhost:3000` locally) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | `.env.local` | ✅ |
| `RAZORPAY_KEY_ID` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `.env.local` | ✅ |
| `RAZORPAY_KEY_SECRET` | `.env.local` | ✅ |
| `RAZORPAY_WEBHOOK_SECRET` | `.env.local` | ✅ |
| `RESEND_API_KEY` | `.env.local` | ✅ |
| `ADMIN_EMAIL` | `.env.local` | ✅ |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `.env.local` | Optional |
| Sentry vars | `.env.local` | Production only |

Copy `.env.local.example` → `.env.local` and fill in every required value before `npm run dev`.
