# Possah 1.0 — Data Operations Plan
Version 2.0 | APPROVED | Images confirmed | Execution underway

## WHAT THIS PLAN COVERS

| # | Task | Risk | Reversible? |
|---|------|------|-------------|
| 0 | Audit + backup current DB state | None | — |
| 1 | Verify 8 categories exist in Supabase | Low | Yes |
| 2 | Delete ALL test/sample products, orders, reviews | HIGH | YES via backup |
| 3 | Upload 42 product images to Supabase Storage as WebP | Low | Yes |
| 4 | Insert 42 real products with variants + tags | Medium | Yes |
| 5 | Insert 4 bracket test orders | Low | Yes |
| 6 | Final verification | None | — |

Rule: Each phase completes and is verified before the next begins.
Rollback: Phase 0 backup restores if anything goes wrong in 2–5.

---

## CORRECTIONS vs v1.0

| Product | Old Classification | Corrected Classification | Reason |
|---|---|---|---|
| lavender periwinkle | Kurta Set | Dress | Photo confirmed — full dress silhouette |
| periwinkle -2 | Kurta Set | Dress | Photo confirmed — full dress silhouette |
| white drawstring | Separate | Dress | Photo confirmed — full dress silhouette |
| white top with denim jacket | name wrong | White Top & Denim Skirt Set | Photo shows skirt not jacket |

---

## PRODUCT CATALOG — 42 PRODUCTS (Category-wise)

### A: DRESSES (16 products) — category slug: dresses

| SKU | Folder | Drive | Clean Name | Price | Colour | Images |
|-----|--------|-------|------------|-------|--------|--------|
| DR-001 | Botanical Grace Midi | drive-1 | Botanical Grace Midi | ₹8,500 | Sage Green | 3 |
| DR-002 | Dusty rose flare dress | drive-1 | Dusty Rose Flare Dress | ₹7,500 | Dusty Rose | 3 |
| DR-003 | Fuchsia Calm Dress | drive-1 | Fuchsia Calm Dress | ₹8,500 | Fuchsia | 4 |
| DR-004 | Peach art deco dress | drive-1 | Peach Art Deco Dress | ₹9,500 | Peach | 3 |
| DR-005 | crimson edge sleeveless dress | drive-1 | Crimson Edge Dress | ₹7,500 | Crimson | 3 |
| DR-006 | Deep plum dress | drive-2 | Deep Plum Dress | ₹8,500 | Deep Plum | 3 |
| DR-007 | lavender periwinkle | drive-2 | Lavender Periwinkle Dress | ₹8,500 | Lavender | 3 |
| DR-008 | off white knotted dress | drive-2 | Off White Knotted Dress | ₹9,500 | Off White | 3 |
| DR-009 | olive green | drive-2 | Olive Green Dress | ₹8,500 | Olive Green | 3 (PNG only, skip JPG) |
| DR-010 | periwinkle -2 | drive-2 | Periwinkle Dress | ₹8,500 | Periwinkle | 3 |
| DR-011 | pink bridesmaid | drive-2 | Pink Bridesmaid Dress | ₹12,500 | Pink | 3 |
| DR-012 | plum dress | drive-2 | Plum Dress | ₹8,500 | Plum | 3 |
| DR-013 | purple gold flower | drive-2 | Purple Gold Flower Dress | ₹11,500 | Purple | 3 |
| DR-014 | skin peach satin dress | drive-2 | Skin Peach Satin Dress | ₹10,500 | Skin Peach | 3 |
| DR-015 | violet silk | drive-2 | Violet Silk Dress | ₹9,500 | Violet | 3 |
| DR-016 | white drawstring | drive-2 | White Drawstring Dress | ₹8,500 | White | 3 |

### B: SEPARATES (13 products) — category slug: separates

| SKU | Folder | Drive | Clean Name | Price | Colour | Images |
|-----|--------|-------|------------|-------|--------|--------|
| SP-001 | Amber glow button top | drive-1 | Amber Glow Button Top | ₹5,500 | Amber | 6 |
| SP-002 | Champagne Glow Top | drive-1 | Champagne Glow Top | ₹5,500 | Champagne | 4 |
| SP-003 | Dusty Rose Drift Top | drive-1 | Dusty Rose Drift Top | ₹5,500 | Dusty Rose | 3 |
| SP-004 | Rose gold draped top | drive-1 | Rose Gold Draped Top | ₹6,500 | Rose Gold | 3 |
| SP-005 | Rose gold mandarin style | drive-1 | Rose Gold Mandarin Top | ₹6,500 | Rose Gold | 3 |
| SP-006 | golden hour top (peach) | drive-1 | Golden Hour Top | ₹5,500 | Peach | 3 |
| SP-007 | Brown silk top | drive-2 | Brown Silk Top | ₹6,500 | Brown | 3 |
| SP-008 | blue embroidery shirt | drive-2 | Blue Embroidery Shirt | ₹7,500 | Blue | 3 |
| SP-009 | dolman purple | drive-2 | Dolman Purple Top | ₹5,500 | Purple | 4 |
| SP-010 | earthy tones top | drive-2 | Earthy Tones Top | ₹5,500 | Earthy Brown | 3 |
| SP-011 | light blue top | drive-2 | Light Blue Top | ₹5,500 | Light Blue | 3 |
| SP-012 | white cardigan | drive-2 | White Cardigan | ₹5,500 | White | 6 |
| SP-013 | white translucent shirt | drive-2 | White Translucent Shirt | ₹5,500 | White | 3 |

### C: CO-ORDS (4 products) — category slug: co-ords

| SKU | Folder | Drive | Clean Name | Price | Colour | Images |
|-----|--------|-------|------------|-------|--------|--------|
| CO-001 | olive top and skirt | drive-2 | Olive Top & Skirt Co-Ord | ₹12,500 | Olive | 3 |
| CO-002 | white bomber + dress | drive-2 | White Bomber & Dress Set | ₹14,500 | White | 3 |
| CO-003 | white drawstring + rose bomber | drive-2 | White Drawstring & Rose Bomber | ₹14,500 | White | 3 |
| CO-004 | white top with denim jacket | drive-2 | White Top & Denim Skirt Set | ₹13,500 | White | 3 |

### D: KURTA SETS (1 product) — category slug: kurta-sets

| SKU | Folder | Drive | Clean Name | Price | Colour | Images |
|-----|--------|-------|------------|-------|--------|--------|
| KS-001 | cyanish Blue kurti | drive-2 | Cyanish Blue Kurti Set | ₹8,500 | Cyan Blue | 3 |

### E: SAREES (4 products) — category slug: sarees — Unsplash images

| SKU | Name | Price | Colour | Sub-Line | Unsplash Image ID |
|-----|------|-------|--------|----------|-------------------|
| SR-001 | The Noor Saree | ₹28,000 | Dusty Rose | THE DRAPE | photo-1727430228383-aa1fb59db8bf |
| SR-002 | The Jade Drape | ₹24,000 | Emerald Green | THE DRAPE | photo-1679006831648-7c9ea12e5807 |
| SR-003 | The Ember Saree | ₹35,000 | Crimson & Gold | THE ATELIER | photo-1769500804057-ca1391bf4617 |
| SR-004 | The Dusk Saree | ₹22,000 | Midnight Blue | THE VAULT | photo-1641699862936-be9f49b1c38d |

### F: LEHENGAS (4 products) — category slug: lehengas — Unsplash images

| SKU | Name | Price | Colour | Sub-Line | Unsplash Image ID |
|-----|------|-------|--------|----------|-------------------|
| LH-001 | The Scarlet Lehenga | ₹65,000 | Red & Gold | THE ATELIER | photo-1762201698238-bf412e297016 |
| LH-002 | The Saffron Lehenga | ₹45,000 | Saffron Yellow | THE EDIT | photo-1767955694884-d4bf352c23c2 |
| LH-003 | The Pearl Lehenga | ₹55,000 | Ivory & Gold | THE ATELIER | photo-1601432093209-8af1fd74b054 |
| LH-004 | The Sage Lehenga | ₹48,000 | Forest Green | THE EDIT | photo-1619715613791-89d35b51ff81 |

**TOTALS: 42 products | 16D + 13S + 4C + 1K + 4Sr + 4L**
Variants: S / M / L / XL × 10 stock each = 4 variants per product = 168 total variant rows

---

## 4 BRACKET TEST ORDERS

| # | Name | City | Order# | Product | Size | Payment | Fulfillment |
|---|------|------|--------|---------|------|---------|-------------|
| 1 | Priya Sharma | Mumbai MH | PSH-2026-0001 | Amber Glow Button Top | M | paid | delivered |
| 2 | Ananya Iyer | Bengaluru KA | PSH-2026-0002 | Peach Art Deco Dress | S | paid | shipped |
| 3 | Neha Gupta | New Delhi DL | PSH-2026-0003 | Botanical Grace Midi | L | pending | unfulfilled |
| 4 | Kavya Reddy | Hyderabad TS | PSH-2026-0004 | Olive Top & Skirt Co-Ord | M | failed | cancelled |

---

## SCRIPTS

All scripts live in `scripts/data_ops/`. Run from project root.

```
node scripts/data_ops/00_audit.mjs           # safe read-only
node scripts/data_ops/01_verify_categories.mjs
node scripts/data_ops/02_clean.mjs           # POINT OF NO RETURN
node scripts/data_ops/03_upload_images.mjs   # requires: npm install sharp --save-dev
node scripts/data_ops/04_seed_products.mjs
node scripts/data_ops/05_seed_orders.mjs
node scripts/data_ops/06_verify.mjs
```

Rollback: `node scripts/data_ops/99_restore.mjs`

---

## PHASES

### PHASE 0: AUDIT + BACKUP
- READ-ONLY. Dumps products, orders, categories → scripts/data_ops/backup/BACKUP_[timestamp].json
- Zero risk.

### PHASE 1: VERIFY CATEGORIES
- Checks 8 categories exist. Upserts any missing.
- Does NOT delete anything.

### PHASE 2: CLEAN DATA — POINT OF NO RETURN
FK-safe deletion order:
1. cart_items
2. wishlists
3. reviews
4. product_look_links
5. product_tags
6. product_images
7. product_variants
8. products
9. orders
10. categories WHERE slug LIKE 'test-%' (test categories only — real 8 NOT touched)

Aborts on any error. Expected after: products=0, orders=0, categories=8.

### PHASE 3: UPLOAD IMAGES
- Local: reads PNGs from Products/drive-1/ and drive-2/, converts via sharp → WebP, uploads
- Ethnic: fetches Unsplash URLs, converts via sharp → WebP, uploads
- Storage path: `possah-media/products/{slug}/{n}.webp`
- Writes `scripts/data_ops/image_manifest.json`
- Idempotent: skips already-uploaded files (upsert:true)

### PHASE 4: INSERT 42 PRODUCTS
- Reads image_manifest.json for URLs
- Inserts products, product_images, product_variants (S/M/L/XL × 10), product_tags

### PHASE 5: INSERT 4 ORDERS
- 4 bracket test orders with real Indian addresses

### PHASE 6: VERIFY
- products=42, variants=168, orders=4, categories=8
- All products have category_id
- All 4 order statuses correct

---

## ROLLBACK
If anything fails after Phase 2: run `node scripts/data_ops/99_restore.mjs`
Reads Phase 0 backup JSON, re-inserts everything.
