# Admin Panel Audit — June 2026

> **Last updated:** 2026-06-19  
> All items in the "Implemented" table are live on `main`. Backlog items are tracked below.

This document captures audit findings, improvement backlog, and advisory notes from the June 2026 admin improvement pass. High-priority items were implemented directly. Medium/low items are tracked here for future sprints.

---

## Implemented in This Pass

| Item | Status | Description | Files |
|------|--------|-------------|-------|
| HomepageEditor sections reordered | ✅ Live | Admin editor now matches actual homepage visual order | `HomepageEditor.tsx` |
| TOC jump nav | ✅ Live | Sticky pill bar — click to scroll to any section | `HomepageEditor.tsx` |
| Page hero images (editorial) | ✅ Live | Women, New In, Best Sellers, Festive, Bridal heroes admin-configurable; DB migration 033 | `HomepageEditor.tsx`, 5 shop pages, `033_*.sql` |
| Placeholder SVG guard | ✅ Live | Admin form silently rejects `placeholder.svg` as a hero URL — prevents accidental saves | `HomepageEditor.tsx` |
| Orders quick date buttons | ✅ Live | Today / This Week / This Month preset buttons | `DateQuickFilters.tsx` |
| Active Coupons dashboard card | ✅ Live | 7th stat card — count of `is_active=true` coupons | `app/admin/page.tsx` |
| Product form top save buttons | ✅ Live | iOS fix — Save/Publish visible at top without scrolling | `ProductForm.tsx` |
| Categories test site reflection | ✅ Live | `01-categories.mjs` verifies HTTP 200 on shop pages after CRUD | `scripts/admin_test/tests/01-categories.mjs` |
| Footer email link a11y | ✅ Live | Added `text-decoration: underline` — fixes WCAG link-in-text-block on Mobile | `Footer.tsx` |
| E2E test suite repair | ✅ Live | 48 failing E2E tests fixed across 8 spec files + playwright config | `tests/e2e/*.spec.ts`, `playwright.config.ts` |

### Known gotcha — Page Heroes & placeholder.svg
If the admin opens `/admin/homepage` → Page Heroes and the URL text box shows `https://cdn.thepossah.com/ui/placeholder.svg`, do NOT save — that value is the system placeholder, not a real image. The form guard will reject it, but it's clearer to leave the field empty until a real image is uploaded.

Debug scripts (in `scripts/`):
- `node scripts/check_page_heroes.mjs` — prints current `page_heroes` from DB (both anon + admin client)
- `node scripts/clear_placeholder_heroes.mjs` — resets any `placeholder.svg` entries to `null`

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
