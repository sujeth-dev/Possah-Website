# Possah — QA Checklist
Run this after every deploy. Check each item manually in the browser + Supabase.

---

## PRE-DEPLOY: Run SQL steps 1–6 in supabase-sql-actions.md first.

---

## 1. NAVIGATION

### Desktop header
- [ ] Logo is larger than before (140px height, not 120px)
- [ ] Nav bar shows: NEW IN · WOMEN · BEST SELLERS · BRIDAL · FESTIVE · ABOUT
- [ ] READY-TO-SHIP is gone from nav
- [ ] Hovering WOMEN opens dropdown with 4 columns:
  - [ ] Column 1 — ETHNIC label + Sarees, Lehengas, Kurta Sets
  - [ ] Column 2 — (no label) Dress Material, Fabrics, Blouses
  - [ ] Column 3 — WESTERN label + Co-Ords, Dresses, Tops, Bottoms
  - [ ] Column 4 — "Shop all Women →" link on far right
- [ ] BEST SELLERS nav link → `/best-sellers` (no 404)
- [ ] All Women submenu links resolve without 404:
  - [ ] `/shop/dress-material`
  - [ ] `/shop/fabrics`
  - [ ] `/shop/blouses`
  - [ ] `/shop/tops`
  - [ ] `/shop/bottoms`

### Mobile nav
- [ ] Hamburger opens drawer
- [ ] Drawer shows: NEW IN, WOMEN, BEST SELLERS, BRIDAL, FESTIVE, ABOUT
- [ ] READY-TO-SHIP absent from mobile nav
- [ ] WOMEN expands to show Ethnic + Western sub-items with all new categories
- [ ] All mobile links work

---

## 2. FOOTER

### CATEGORIES column
- [ ] Shows all 10: Sarees, Lehengas, Kurta Sets, Dress Material, Fabrics, Blouses, Co-Ords, Dresses, Tops, Bottoms
- [ ] Separates is gone
- [ ] SHOP column shows Best Sellers (not Ready to Ship)

---

## 3. PAGE TITLES (browser tab)
Format must be `Page Name - The Possah` — not double-suffixed.
- [ ] Home: `The Possah - Luxury Indian Fashion | she wants what she wants.`
- [ ] Dresses: `Dresses - The Possah`
- [ ] Sarees: `Sarees - The Possah`
- [ ] Bridal: `Bridal - The Possah`
- [ ] Festive: `Festive - The Possah`
- [ ] Best Sellers: `Best Sellers - The Possah`
- [ ] Size Guide: `Size Guide - The Possah`
- [ ] Any PDP: `[Product Name] - The Possah`
- [ ] No page should show `— The Possah - The Possah`

---

## 4. CATEGORY LISTING PAGES

### Show More (same-page expansion)
- [ ] On `/shop/dresses` — click Show More Pieces
- [ ] Products append IN PLACE — no page reload, URL stays the same
- [ ] Active filters stay applied after expanding
- [ ] "Showing X of Y" counter updates correctly
- [ ] Loading spinner appears during fetch
- [ ] When all loaded: "All X pieces loaded" message shows

### Product cards
- [ ] Hover on a multi-image product → alternate image fades in smoothly
- [ ] Single-image product on hover → no flicker, stays stable
- [ ] Price shows in ₹ format (e.g. ₹8,500)
- [ ] Sale price: compare price shown with strikethrough
- [ ] NEW badge shows on new arrivals
- [ ] SALE badge shows when compare_price > price

### Filters
- [ ] Filter headings are lighter/smaller than before (body font, not all-caps mono)
- [ ] Strong visual separation between heading and options
- [ ] Occasion filter includes: Everyday, Brunch, Workwear, Evening, **Cocktail**, Sangeet, Mehendi, Haldi, Wedding
- [ ] Fabric filter includes: Silk, Linen, Cotton, Georgette, Crepe, Chiffon, **Modal, Viscose, Tissue, Velvette, Satin, Tulle, Zari, Poly Blend**
- [ ] Size filter shows: XS, S, M, L, XL, **2XL, 3XL**, Free Size, Made-to-Measure
- [ ] XXL is gone from size filter
- [ ] Occasion filter → Cocktail → returns products (at least 7)
- [ ] OCCASION heading on Sarees page is visually lighter, not oversized

---

## 5. BEST SELLERS PAGE `/best-sellers`

- [ ] Page loads without 404
- [ ] Shows products with `is_top_selling = true`
- [ ] Filter sidebar present
- [ ] Sort bar present
- [ ] Show More works (same-page expand)
- [ ] Breadcrumb: Home › Best Sellers

---

## 6. TOPS PAGE `/shop/tops`

- [ ] Page loads (no 404)
- [ ] Shows 13 products (all SP-001 to SP-013)
- [ ] No products still on `/shop/separates` that belong here
- [ ] Verify in Supabase: `SELECT COUNT(*) FROM products WHERE category_id = '11111111-0001-0001-0001-000000000012'` → 13

---

## 7. FESTIVE PAGE `/festive`

### Occasion tiles
- [ ] 5 tiles: Cocktail & Party, Vacation Glam, Festive Edit, Everyday Luxe, Custom Couture
- [ ] 5-col grid on desktop, 2-col on mobile
- [ ] Each tile links to correct collection
- [ ] Custom Couture tile → `/made-to-measure`

### Product grid
- [ ] Shows products with `is_festive = TRUE` (should be ~19)
- [ ] NOT showing all products randomly
- [ ] Empty state shows if no flagged products (if SQL step 4 not run yet)

---

## 8. BRIDAL PAGE `/bridal`

### Occasion tiles
- [ ] Row 1 (4 tiles): Reception Glam, Mehendi's Edit, Sangeet Edit, Haldi Edit
- [ ] Row 2 (2 tiles + CTA): Wedding Guest Edit, Cocktail Night
- [ ] Bridal Trousseau: solid green CTA tile, links to `/made-to-measure`
- [ ] Each tile links to the right collection+occasion filter

### Product grid
- [ ] Shows products with `is_bridal = TRUE` (~11)
- [ ] NOT showing by tag query (old behaviour)

---

## 9. SIZE GUIDE `/size-guide`

- [ ] Table shows: XS, S, M, L, XL, **2XL, 3XL**
- [ ] XXL row is gone
- [ ] 3XL measurements: 47–49 / 40–42 / 50–52 / 44–45

---

## 10. WOMEN PAGE `/women`

- [ ] Ethnic section shows: Sarees, Lehengas, Kurta Sets, Dress Material, Fabrics, Blouses
- [ ] Western section shows: Co-Ords, Dresses, Tops, Bottoms
- [ ] Separates is gone from Western section

---

## 11. ADMIN — PRODUCT FORM

Go to `/admin/products/new` or edit any product.
- [ ] Toggle section shows 6 toggles: New Arrival, Top Selling, Featured, **Festive**, **Bridal**, Active
- [ ] Festive toggle saves correctly (check in Supabase after save)
- [ ] Bridal toggle saves correctly
- [ ] Occasion tags include **Cocktail**
- [ ] Size dropdown includes **2XL** and **3XL**
- [ ] XXL is gone from size dropdown
- [ ] Free Size is present in size dropdown

---

## 12. SUPABASE — DATA VERIFICATION

Run these queries in SQL Editor to confirm:

```sql
-- Overall counts
SELECT
  COUNT(*) FILTER (WHERE is_active = TRUE)  AS active,
  COUNT(*) FILTER (WHERE is_festive = TRUE) AS festive,
  COUNT(*) FILTER (WHERE is_bridal  = TRUE) AS bridal,
  COUNT(*) FILTER (WHERE is_top_selling = TRUE) AS best_sellers,
  COUNT(*) FILTER (WHERE category_id = '11111111-0001-0001-0001-000000000012') AS tops,
  COUNT(*) FILTER (WHERE category_id = '11111111-0001-0001-0001-000000000006') AS separates_remaining
FROM products;
-- Expected: active=42, festive=19, bridal=11, tops=13, separates_remaining=0

-- Cocktail tags
SELECT COUNT(*) FROM product_tags WHERE tag = 'Cocktail';
-- Expected: 7

-- No XXL variants
SELECT COUNT(*) FROM product_variants WHERE size = 'XXL';
-- Expected: 0

-- Categories count
SELECT COUNT(*) FROM categories;
-- Expected: 13
```

---

## 13. PIPELINE INTEGRITY (before next pipeline run)

- [ ] `scripts/data_ops/category_map.json` has 13 entries
- [ ] `scripts/data_ops/lib/products.mjs` — all 13 SP products use `category: 'tops'`
- [ ] `scripts/data_ops/01_verify_categories.mjs` — REQUIRED_CATEGORIES has 13 entries
- [ ] `scripts/data_ops/06_verify.mjs` — `EXPECTED.categories` is 13
- [ ] Run Phase 0 audit before any future pipeline run: `node scripts/data_ops/00_audit.mjs`

---

## SIGN-OFF

| Area | Checked by | Date | Status |
|---|---|---|---|
| Navigation | | | |
| Filters + taxonomy | | | |
| Listing pages | | | |
| Festive + Bridal | | | |
| Admin | | | |
| DB verification | | | |
