# Changelog — The Possah

All notable changes to this project, newest first.

---

## [Phase 8] — 2026-06-16 — SEO & Social Shareability

### Summary
Full SEO sweep: structured data on every key page, dynamic OG image per product, social Share Drawer on PDP, admin/email bug fixes, live verification against thepossah.com.

### Bug Fixes
- **Admin coupons silent empty list** — `getCoupons()` now returns `{ coupons, dbError }`. Red error banner renders above the table when the DB call fails instead of silently showing zero coupons.
- **Admin homepage images blank** — `getHomepageConfig()` now normalises both `image_url`/`image` and `sub_headline`/`subheadline` key variants from the DB. Occasion tiles always padded to 8 (was requiring exactly 8, defaulted the whole array if count was off).
- **Order email links generic** — "Track Your Order" (shipped) and "View Your Order" (delivered) CTAs now link to `/account/orders/:orderNumber` (was `/account/orders`).

### New Features

#### Structured Data (JSON-LD) — all verified live on thepossah.com
| Page | Schema added |
|------|-------------|
| Homepage | `WebSite` + `SearchAction` (Google Sitelinks Searchbox) |
| Homepage | `ClothingStore.sameAs` expanded — Pinterest + YouTube added alongside Instagram |
| FAQ | `FAQPage` — 12 Q&A pairs auto-generated from `FAQ_SECTIONS` constant |
| Journal articles | `NewsArticle` — headline, datePublished, author, publisher logo |

#### Open Graph & Twitter Cards
- **PDP** — explicit `og:type: 'website'` set; `twitter:card: summary_large_image` confirmed
- **Category pages** — `og:image` from `category.image_url` in Supabase (conditional)

#### Dynamic OG Image for PDP
`app/(shop)/[gender]/[category]/[slug]/opengraph-image.tsx`

Auto-generated 1200×630 PNG for every product page. Layout: product photo left (55%), brand wordmark + product name + price on dark green (`#1F3A2D`) right panel. Served at `/:gender/:category/:slug/opengraph-image` by Next.js.

Implementation notes:
- Uses direct `fetch` to Supabase REST API — the JS client (`@supabase/supabase-js`) uses browser globals that crash the `next/og` sandbox
- `formatINR()` is a manual regex formatter — `toLocaleString('en-IN')` is not available in the OG image runtime
- Fully graceful on data-fetch failure — falls back to "The Possah" branding without the product photo

#### Share Drawer on PDP
`components/pdp/ShareDrawer.tsx`

"Share" button inserted below the wishlist button on every product page.
- **Mobile** — calls `navigator.share()` immediately (native OS share sheet)
- **Desktop / fallback** — opens a popover with: Copy Link (clipboard + "Copied!" feedback), WhatsApp deep-link, Pinterest pin creator
- Click-outside closes the popover; `useEffect` cleanup removes event listener

#### Performance
- `ProductCard` hover image now respects the `priority` prop — above-the-fold hover images are preloaded
- `NewArrivals` grid passes `priority={i < 4}` for first 4 cards

### Documentation
- `docs/seo-guide.md` — full SEO reference: every structured data block, every OG image touchpoint, live verification status, action items (category images, journal images, PWA manifest)
- `README.md` — Phase 8 section added; docs table updated

### Files Changed
```
Modified:
  app/(shop)/[gender]/[category]/[slug]/page.tsx   og:type website
  app/(shop)/[gender]/[category]/page.tsx           og:image from category.image_url
  app/(shop)/faq/page.tsx                           FAQPage schema
  app/(shop)/journal/[slug]/page.tsx                NewsArticle schema
  app/(shop)/page.tsx                               WebSite schema, sameAs expansion
  app/admin/coupons/page.tsx                        error surface
  app/admin/homepage/page.tsx                       key normalisation
  components/homepage/NewArrivals.tsx               priority prop
  components/pdp/ProductInfo.tsx                    ShareDrawer insertion
  components/shop/ProductCard.tsx                   hover image priority
  lib/email.ts                                      order-specific links

New:
  app/(shop)/[gender]/[category]/[slug]/opengraph-image.tsx
  components/pdp/ShareDrawer.tsx
  docs/seo-guide.md
  CHANGELOG.md
```

### Live Verification — 2026-06-16
Verified by fetching thepossah.com HTML via curl with real browser UA:

| Check | Result |
|-------|--------|
| Homepage ClothingStore schema | ✅ Live — sameAs includes Instagram, Pinterest, YouTube |
| Homepage WebSite + SearchAction | ✅ Live |
| PDP Product schema | ✅ Live — name, images, price, InStock, brand |
| PDP BreadcrumbList | ✅ Live — 4-level breadcrumb |
| PDP og:image (product photo) | ✅ Live — CDN image at 1200×630 |
| PDP twitter:card | ✅ Live — summary_large_image |
| FAQPage schema (12 questions) | ✅ Live |
| Journal NewsArticle schema | ✅ Live — publisher logo CDN URL confirmed |
| Dynamic OG image route | ✅ Fixed (was 404) — redeployed 2026-06-16 |
| Category og:image | ⚠️ Code live; no category has `image_url` in DB yet |

### Pending Actions (needs DB data)
1. **Category OG images** — set `image_url` in Supabase → categories for each category (upload 1200×630 image to CDN first)
2. **Journal article OG images** — set `featured_image` in Supabase → journal_articles
3. **PWA manifest** — blocked on icon files (`public/icons/icon-192.png`, `icon-512.png`); create `app/manifest.ts` once ready

---

## [Phase 7] — 2026-06-14 — Routing Restructure

Canonical URL change: `/shop/:cat/:slug` → `/[gender]/:cat/:slug` (e.g. `/women/sarees/product-slug`).
`notFound()` guard on all gender routes. Migration `030` adds `categories.gender` column.
See `README.md` Phase 7 for full detail.

---

## [Phase 6] — 2026-06-14 — Routing, Image Polish & CDN

`/shop` → `/women` redirect. All `placehold.co` refs replaced with CDN placeholder.
R2 custom domain `cdn.thepossah.com` live. CSP widened for Razorpay subdomains.

---

## [Phase 5] — 2026-06-13 — SEO Foundations & DB Audit

Sitemap, robots.txt, PDP `generateMetadata`, Product + BreadcrumbList JSON-LD, canonical URLs.
Speed audit: font swap, image sizes, hero priority. All correct, no changes needed.

---

## [Phase 4] — 2026-06-13 — Order Management & PDP Enhancements

Order status history (migration 028). Shipped/delivered emails auto-fired on status change.
Admin email preview tool. PDP hover magnifier. Cart size swap.
E2E Playwright suite: 50 tests.

---

## [Phase 3] — 2026-06-13 — Production-Readiness Audit

Security: email injection (S-1), search injection (S-2), admin dev bypass (S-3), CSP (S-4).
Reliability: stock decrement idempotency (H-1), webhook/verify race (H-2), migration 029.
Validation: pagination clamp (U-1), checkout network failure (U-2).
Tests: 81 Vitest unit tests, 104 payment flow tests.

---

## [Phase 2] — 2026-06-12 — Order Management

Order progress bar, order detail page, retry payment, paid/incomplete split, order deduplication.

---

## [Phase 1] — 2026-06-11 — Brand & UX Polish

Bengaluru sweep. Favicon. Footer redesign. Festive smooth scroll. Size guide mobile. Orders header link.
