# Change Flow

Exact steps for every type of change. Read the relevant section before starting.

---

## A — Add a new category

1. Create migration `supabase/migrations/0XX_description.sql`
   ```sql
   INSERT INTO categories (id, name, slug, nav_section, position)
   VALUES ('fixed-uuid-here', 'Name', 'slug', 'Women > Ethnic', N);
   ```
2. Add to `seeds/seed_categories.sql`
3. Add to `scripts/data_ops/01_verify_categories.mjs` → `REQUIRED_CATEGORIES`
4. Add to `scripts/data_ops/category_map.json`
5. Add to `components/layout/Header.tsx` → `NAV_ITEMS`
6. Add to `app/(shop)/women/page.tsx` → `ETHNIC_CATEGORIES` or `WESTERN_CATEGORIES`
7. Add to `components/layout/Footer.tsx` → `CATEGORIES` column
8. Add sample product in `seeds/seed_products.sql` (comment only — or via admin)
9. Update `scripts/data_ops/06_verify.mjs` → `EXPECTED.categories` count
10. Run migration in Supabase SQL Editor
11. Commit → test nav links resolve, no 404s

---

## B — Retire a category

1. Remove from `Header.tsx` NAV_ITEMS
2. Remove from `women/page.tsx`
3. Remove from `Footer.tsx`
4. Reassign products in DB:
   ```sql
   UPDATE products SET category_id = 'new-id' WHERE category_id = 'old-id';
   ```
5. Annotate row in `seeds/seed_categories.sql` as retired
6. Only delete the DB row after all products are moved
7. Commit

---

## C — Add a new product field (DB column)

1. Create migration `supabase/migrations/0XX_field.sql`
2. Add to `lib/validations/admin-products.ts` → `ProductCreateSchema`
3. Add to `app/admin/products/ProductForm.tsx` — interface + state + UI
4. Add to relevant page queries (category page, PDP, etc.) if storefront-facing
5. Add to `scripts/data_ops/04_seed_products.mjs` upsert block
6. Add to `scripts/data_ops/lib/products.mjs` product objects if applicable
7. Update `scripts/admin_test/seed.mjs` + `tests/02-products.mjs`
8. Run migration in Supabase SQL Editor
9. Append SQL to `docs/supabase-sql-actions.md`
10. Commit → run admin test suite → QA checklist

---

## D — Change navigation

1. Edit `components/layout/Header.tsx` → `NAV_ITEMS`
   MobileNav updates automatically from Header (passed as props)
2. Edit `components/layout/Footer.tsx` if footer links affected
3. Edit `app/(shop)/women/page.tsx` if Women section changes
4. Commit → smoke test: click every nav link, check no 404s

---

## E — Change taxonomy (occasion / fabric / size)

**Occasion:**
1. `components/shop/FilterSidebar.tsx` → `FILTER_SECTIONS` occasion options
2. `app/admin/products/ProductForm.tsx` → `OccasionTag` type + `ALL_OCCASIONS`
3. `lib/validations/admin-products.ts` → `OccasionTagEnum`
4. `scripts/data_ops/lib/products.mjs` → `OCCASION_TAGS`
5. SQL to add tags to existing products if needed
6. Append SQL to `docs/supabase-sql-actions.md`

**Fabric:** Edit `FilterSidebar.tsx` options only (free-text field — no enum).

**Size:**
1. `FilterSidebar.tsx` → size options
2. `ProductForm.tsx` → `ALL_SIZES`
3. `components/pdp/ProductInfo.tsx` → `SIZE_ORDER`
4. `app/(shop)/size-guide/page.tsx` → `WOMEN_SIZES` table
5. SQL to rename old sizes in `product_variants` if needed

---

## F — Full pipeline re-run

Only needed for bulk re-seed. Always backup first.

```bash
node scripts/data_ops/00_audit.mjs            # 1. Backup — never skip
node scripts/data_ops/01_verify_categories.mjs # 2. Verify 13 categories
node scripts/data_ops/02_clean.mjs            # 3. POINT OF NO RETURN
node scripts/data_ops/03_upload_images.mjs    # 4. Upload images → WebP
node scripts/data_ops/04_seed_products.mjs    # 5. Seed 42 products
node scripts/data_ops/05_seed_orders.mjs      # 6. Seed test orders
node scripts/data_ops/06_verify.mjs           # 7. Verify counts
```

After pipeline: run SQL steps in `docs/supabase-sql-actions.md` to re-apply
flags (`is_festive`, `is_bridal`, separates→tops).

---

## G — After any deploy

1. `npm run lint && npm run typecheck` — must be clean
2. `npm test` — unit tests pass
3. If admin code changed → `node scripts/admin_test/run.mjs`
4. If payment code changed → `node scripts/payment_test/run.mjs`
5. If data changed → `node scripts/data_ops/06_verify.mjs`
6. Work through `docs/qa-checklist.md` in the browser
7. Update `POSSAH_MASTER_DOCUMENT.md` if architecture changed

---

## H — Planning new work

1. Read `POSSAH_MASTER_DOCUMENT.md` — does it conflict with existing architecture?
2. Identify change type → relevant section above
3. Estimate: code files, migrations, SQL actions needed
4. Write items in `SPRINT.md` under new sprint heading
5. After sprint: mark items complete, update master doc, update QA checklist
