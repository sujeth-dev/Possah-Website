# Admin Panel Audit — June 2026

This document captures audit findings, improvement backlog, and advisory notes from the June 2026 admin improvement pass. High-priority items were implemented directly. Medium/low items are tracked here for future sprints.

---

## Implemented in This Pass

| Item | Description | Files |
|------|-------------|-------|
| HomepageEditor sections reordered | Admin editor now matches actual homepage visual order | `app/admin/homepage/HomepageEditor.tsx` |
| TOC jump nav in HomepageEditor | Sticky pill bar at top lets admin jump to any section | `app/admin/homepage/HomepageEditor.tsx` |
| Page hero images (editorial) | Women, New In, Best Sellers, Festive, Bridal hero images now admin-configurable | `HomepageEditor.tsx`, `festive/page.tsx`, `bridal/page.tsx`, `[gender]/page.tsx`, `new-in/page.tsx`, `best-sellers/page.tsx` |
| Orders quick date buttons | "Today / This Week / This Month" preset buttons above date range picker | `app/admin/orders/DateQuickFilters.tsx` |
| Active Coupons dashboard card | 7th stat card showing count of `is_active=true` coupons | `app/admin/page.tsx` |
| Product form top save buttons (iOS) | Duplicate Save/Publish bar at top of ProductForm | `app/admin/products/ProductForm.tsx` |
| Categories test site reflection | `01-categories.mjs` now checks `/women`, `/new-in`, `/best-sellers` return 200 after CRUD | `scripts/admin_test/tests/01-categories.mjs` |

---

## Coupon Active/Inactive Toggle

**Status: Already implemented — no change needed.**

`CouponManager.tsx` has an inline `is_active` toggle per coupon row (green dot = active, gray = inactive). Clicking the status badge toggles it without leaving the page. Verify at `/admin/coupons`.

---

## Sub-line Taxonomy (THE DRAPE / THE EDIT / THE ATELIER / THE VAULT)

**Status: Keep as-is (advisory only).**

Sub-lines are a product-collection taxonomy. They ARE surfaced as filter options on `/new-in` (`?sub_line=` param). The field is optional on products.

**Current use:** Filter on `/new-in` only.

**Future opportunities (backlog):**
- Add sub-line filter chips to `/best-sellers` page (same pattern as `/new-in`)
- Add sub-line badge/label on product cards (small label below product name on PDP)
- Create collection landing pages per sub-line (e.g. `/collection/the-drape`) for editorial SEO
- Add sub-line as a column filter in the admin products list

---

## Dashboard Audit — Improvement Backlog

**Implemented:** Active Coupons card (7th card).

**Advisory — future improvements (not yet implemented):**

| Improvement | Priority | Notes |
|-------------|----------|-------|
| Revenue This Month card | Medium | Add `month_revenue` metric (paid orders since 1st of month) |
| Period selector for revenue | Low | Today / Week / Month toggle on revenue/orders cards |
| Emphasise Pending Orders visually | Medium | Use amber/orange background on "Pending Orders" card — it's the admin action queue |
| Increase recent orders table to 15 | Low | Currently 10; bump `.limit(10)` to `.limit(15)` |
| Revenue sparkline (7d bar chart) | Low | Requires charting lib (recharts or victory); overkill for now |
| Refund / Return tracking | Medium | Add refunded orders count once refund flow exists |

---

## All Admin Pages Audit — Design, Access, Simplicity

### High Priority (implemented via Items 4 and 9 above)
- `/admin/orders` — Quick date presets added ✓
- `/admin/products/new` — Save/Publish at top for iOS ✓

### Medium Priority (backlog)
| Page | Issue | Fix idea |
|------|-------|----------|
| `/admin/journal` | No "preview on live site" link from article editor | Add an external link to `/journal/{slug}` next to the article title |
| `/admin/categories` | Table rows show hero image URL as raw text, no thumbnail | Add 40×40 img preview in table row |
| `/admin/products` | No bulk action (bulk deactivate, bulk tag, bulk delete) | Add checkbox column + bulk action toolbar |
| `/admin/reviews` | Full moderation flow not audited | Schedule separate review pass |

### Low Priority (backlog)
| Page | Issue | Fix idea |
|------|-------|----------|
| `/admin/media` | No folder organisation; all files in flat grid | Add folder tabs (products/, uploads/editorial/, etc.) |
| `/admin/orders` | No print/invoice button on order detail page | Add printable order summary |
| `/admin/settings` | No environment indicator (dev vs prod) | Show a banner when `NODE_ENV=development` |

---

## Article Suggestions (for /admin/journal)

Clean up any articles whose title/body contains "test", "sample", or "lorem". Suggested real article topics:

| # | Title | Category |
|---|-------|----------|
| 1 | How to Drape a Saree: 5 Regional Styles | Style |
| 2 | The Art of Chikankari: Lucknow's Living Heritage | Craft |
| 3 | What to Wear for a Sangeet: A Complete Guide | Occasions |
| 4 | Inside the Atelier: How a Made-to-Measure Saree is Born | Behind the Scenes |
| 5 | Building a Saree Wardrobe from Scratch | Style |
| 6 | The Women Behind Possah's Embroidery | Culture |

---

## Categories → Site Reflection

The admin categories API calls `revalidatePath('/', 'layout')` on every create/edit/delete mutation. This clears Next.js ISR cache and the next page load reflects the change.

The test script (`scripts/admin_test/tests/01-categories.mjs`) verifies:
1. CRUD operations return correct status codes
2. Created entries appear in admin list
3. Deleted entries are absent from admin list
4. `/women`, `/new-in`, `/best-sellers` return HTTP 200 after mutations (site reflection check)

---

## Testing Reference

```bash
npm run test           # Unit + integration (vitest) — must be green before push
npm run test:api       # Admin API CRUD tests (seed → run → cleanup)
npm run test:payment   # Razorpay webhook tests
npm run test:e2e       # Playwright: Desktop Chrome + Mobile Chrome
```

All four suites must pass before `git push origin main`.
