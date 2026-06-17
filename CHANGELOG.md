# Changelog — The Possah

All notable changes to this project, newest first.

---

## [Unreleased] — 2026-06-17 — Mobile Order Detail: Vertical Progress Tracker

### Summary
Order detail page on mobile was congested — 5 circles across a 375px screen left ~75px per column, making labels and the placed-date sub-label too cramped. Switched the order progress bar to a vertical step list on mobile (circle + label/desc per row), keeping the horizontal layout on desktop. Also increased padding on the progress section container and reduced the payment summary padding on mobile.

### Bug Fixes

#### Mobile Order Progress Bar — vertical layout
- **< md breakpoint**: new `MobileFullBar` vertical tracker. Each step is a row: 28px circle (left) + label, optional placed date (step 1), optional status description (active step) on the right. A 1.5px connector line between circles fills the height dynamically.
- **md+ breakpoint**: existing horizontal bar unchanged (`DesktopFullBar`).
- Visual states carried over: active step ring, completed step 72% opacity, green connector for reached steps.
- Progress bar container padding: `px-2` → `px-4` (more breathing room).
- Payment summary padding: fixed `24px` → `p-4 sm:p-6` (16px mobile, 24px sm+).

### Files Changed
- `components/account/OrderProgressBar.tsx` — `MobileFullBar` + `DesktopFullBar` split from `FullBar`
- `app/(shop)/account/orders/[orderNumber]/page.tsx` — padding tweaks
- `scripts/verify/task2-mobile-ui.js` — updated checks (14/14)

---

## [Unreleased] — 2026-06-17 — Post-Smoke-Test Round 2: Order Progress + Toast + Admin Error

### Summary
Three follow-up fixes after smoke testing: order progress bar now clearly shows completed/current/pending states with all labels visible and a status description; cart toast relocated to bottom-right on desktop and persists 6s; admin save failures now surface as an unmissable red banner.

### Bug Fixes

#### Order Progress Bar — visual clarity
- **Before/after states**: Active step gets a soft halo (`box-shadow` ring); completed steps are 72% opacity — users can now clearly tell "done" vs "now" vs "upcoming"
- **All labels visible at all screen sizes**: Removed `hidden sm:block` from non-active labels; non-active labels use 8px font (down from 10px) to fit even on 280px screens
- **Status description**: One-line contextual message added below the circles (e.g. "Your order has been shipped and is on its way.")
- **Placed date**: Order creation date shown as a sub-label under the "Placed" circle
- `components/account/OrderProgressBar.tsx` — ring, opacity, always-visible labels, `STATUS_DESC` map, `placedAt` prop, `formatShortDate` helper
- `app/(shop)/account/orders/[orderNumber]/page.tsx` — passes `placedAt={order.created_at}`

#### Cart Toast — desktop position + persistence
- Desktop: repositioned from top-right to **bottom-right** (`bottom: 80px; right: 32px`) — near the "Add to Bag" button area
- Desktop animation: new `toastSlideUpRight` keyframe (slides up from below, no translateX)
- Duration: 4s → **6s** auto-dismiss
- `components/ui/AddedToBagToast.tsx` — `AUTO_DISMISS_MS` 4000 → 6000
- `styles/globals.css` — `toastSlideUpRight` keyframe + desktop media query override

#### Admin Homepage — prominent save-error banner
When a save fails (e.g. DB columns missing, network error), a full-width red banner now appears above the save button — previously the error was a small inline span that was easy to miss.
- `app/admin/homepage/HomepageEditor.tsx` — `SaveRow` upgraded to full banner

### Files Changed
- `components/account/OrderProgressBar.tsx`
- `app/(shop)/account/orders/[orderNumber]/page.tsx`
- `components/ui/AddedToBagToast.tsx`
- `styles/globals.css`
- `app/admin/homepage/HomepageEditor.tsx`
- `scripts/verify/task2-mobile-ui.js` *(updated checks)*
- `scripts/verify/task4-cart-toast.js` *(updated checks)*

---

## [Unreleased] — 2026-06-17 — Admin Image CRUD + Mobile Fixes + Cart Toast

### Summary
Three independent improvements: full admin control over all homepage section images, mobile layout fixes for the filter bar and order progress tracker, and an "Added to Bag" toast with a "Go to Bag" CTA after add-to-cart.

### New Features

#### Task 1 — Admin Homepage Complete Image CRUD
Three homepage sections previously had hardcoded placeholder images with no admin access. All three are now fully configurable from `/admin/homepage`.

| Section | Admin field | Upload path |
|---|---|---|
| Category Split (Ethnic / Western) | `category_split` | `uploads/homepage/category-split` |
| Category Circles (6 categories) | `category_circles` | `uploads/homepage/circles` |
| Made-to-Measure CTA | `mtm_cta` | `uploads/homepage/mtm` |

- **DB migration** `032_homepage_config_image_sections.sql` — adds `category_split`, `category_circles`, `mtm_cta` JSONB columns to `homepage_config`
- **API** — new Zod schemas + PATCH handler fields for all three sections
- **Admin editor** — three new form sections with `ImageUploadField` components, save handlers, and saved/error state (consistent with existing sections)
- **Homepage components** — `CategorySplit`, `CategoryCircles`, `MtmCta` now accept optional image props; fall back to placeholder when empty

#### Task 4 — Add-to-Cart "Go to Bag" Toast
After adding a product to the bag, a toast notification now appears showing the product thumbnail, name, price, and a "Go to Bag →" link to `/cart`.

- `lib/store/cartToastStore.ts` — new ephemeral Zustand store (no persistence)
- `components/ui/AddedToBagToast.tsx` — toast component: green brand colours, `role="status"` / `aria-live="polite"`, auto-dismisses at 4s, timer resets on rapid re-adds
- Mounted in `app/(shop)/layout.tsx`
- CSS: `@keyframes toastSlideUp` + `.toast-position` responsive class in `globals.css` (bottom-centre on mobile, top-right on desktop ≥768px)

### Bug Fixes / Mobile Fixes

#### Task 2a — SortBar mobile layout
The filter button (10px mono uppercase) previously sat inline with "Showing X pieces" (13px body font), creating visual mismatch. Replaced with a two-row mobile layout:
- Row 1: Filters button (left) + Sort dropdown (right)
- Row 2: Piece count in matching mono style
- Desktop layout unchanged.

#### Task 2b — OrderProgressBar on mobile
- **Connecting line** — replaced fragile `margin: '-22px auto 0'` negative-margin hack with `position: absolute` anchored at `top: CIRCLE_SIZE / 2`. Line now correctly centres on circles at all screen widths.
- **Label overflow** — step labels (`"Confirmed"`, etc.) at 10px + letter-spacing overflowed on 280–320px screens. Non-active labels now hidden below `sm` breakpoint; only the active step label shows. All 5 circles remain visible for progress context.

### Files Changed
- `supabase/migrations/032_homepage_config_image_sections.sql` *(new)*
- `lib/store/cartToastStore.ts` *(new)*
- `components/ui/AddedToBagToast.tsx` *(new)*
- `scripts/verify/task1-homepage-images.js` *(new)*
- `scripts/verify/task2-mobile-ui.js` *(new)*
- `scripts/verify/task4-cart-toast.js` *(new)*
- `app/api/admin/homepage/route.ts`
- `app/admin/homepage/HomepageEditor.tsx`
- `app/admin/homepage/page.tsx`
- `components/homepage/CategorySplit.tsx`
- `components/homepage/CategoryCircles.tsx`
- `components/homepage/MtmCta.tsx`
- `app/(shop)/page.tsx`
- `app/(shop)/layout.tsx`
- `components/pdp/ProductInfo.tsx`
- `components/shop/SortBar.tsx`
- `components/account/OrderProgressBar.tsx`
- `styles/globals.css`

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
