# The Possah

Luxury Indian fashion e-commerce — handcrafted pieces, bespoke tailoring, editorial brand.

**Stack:** Next.js 14 App Router · Supabase (PostgreSQL) · NextAuth · Razorpay · Resend · TypeScript

---

## Quick start

```bash
cp .env.local.example .env.local   # fill in values — see docs/env-setup.md
npm install
npm run dev                         # localhost:3000
```

Admin panel: `localhost:3000/admin`

---

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest unit tests (81 tests)
npm run test:api     # admin API test suite
npm run test:payment # payment flow test suite (104 tests)
npm run test:e2e     # Playwright E2E (50 tests — needs dev server running)
```

**Test loop before every deploy (in order):**
```
1. npm run typecheck   → 0 errors
2. npm run lint        → 0 errors (1 pre-existing warning OK)
3. npm test            → 81/81
4. npm run test:payment → 104/104
5. npm run build       → 0 errors
6. npm run test:e2e    → 50/50
```

---

## Where everything lives

| What you need | Go to |
|---|---|
| **Start here — architecture, schema, routes** | [`POSSAH_MASTER_DOCUMENT.md`](./POSSAH_MASTER_DOCUMENT.md) |
| **Project folder map** | [`docs/project-structure.md`](./docs/project-structure.md) |
| **Making any kind of change** | [`docs/change-flow.md`](./docs/change-flow.md) |
| **Managing products / categories / data** | [`docs/data-manager-guide.md`](./docs/data-manager-guide.md) |
| **SQL to run in Supabase** | [`docs/supabase-sql-actions.md`](./docs/supabase-sql-actions.md) |
| **QA checklist after deploy** | [`docs/qa-checklist.md`](./docs/qa-checklist.md) |
| **42-product pipeline** | [`Possah_Data_Operations_Plan.md`](./Possah_Data_Operations_Plan.md) |
| **Local env setup** | [`docs/env-setup.md`](./docs/env-setup.md) |
| **Sprint + open fixes** | [`SPRINT.md`](./SPRINT.md) |
| **Test setup** | [`TESTING_PLAN.md`](./TESTING_PLAN.md) |
| **Admin test suite** | [`scripts/admin_test/GUIDE.md`](./scripts/admin_test/GUIDE.md) |
| **Creative direction, colours, fonts** | [`docs/archive/POSSAH_CREATIVE_DIRECTION.md`](./docs/archive/POSSAH_CREATIVE_DIRECTION.md) |

---

## Database

Run all migrations in order, then seeds:

```
supabase/migrations/001 → 029   run once each, in order
seeds/seed_categories.sql       run after migrations
seeds/seed_homepage_config.sql  run after seed_categories
```

Key migrations:
- `025` — pending order dedupe + confirmation email idempotency guard
- `026` — addresses default + unique constraint
- `028` — order status history table (audit trail for shipped/delivered emails)
- `029` — stock decrement guard (atomic, runs exactly once per paid order)

Real product data (42 products) is managed by the pipeline — not SQL seeds.
See [`Possah_Data_Operations_Plan.md`](./Possah_Data_Operations_Plan.md).

---

## Images

CDN: `https://cdn.thepossah.com` (Cloudflare R2 custom domain — `possah-media` bucket).
All placeholder slots across the site are wired to `cdn.thepossah.com/ui/placeholder.svg` until real photography is ready.

For upload paths, dimensions, and per-page replacement locations → **[`docs/image-guide.md`](./docs/image-guide.md)**

---

## Current state (June 2026)

- 42 products live — 16 dresses, 13 tops, 4 co-ords, 1 kurta set, 4 sarees, 4 lehengas
- 13 categories active (8 original + 5 new: dress-material, fabrics, blouses, tops, bottoms)
- Admin: full CRUD — products, orders, categories, coupons, reviews, journal, homepage, settings
- Payments: Razorpay — captured + failed webhooks handled
- Taxonomy: occasion (9 tags incl. Cocktail), fabric (14 options), size (XS–3XL + Free Size + MtM)
- Festive + Bridal pages: editorially curated via `is_festive` / `is_bridal` product flags
- Product gallery: click-to-zoom fullscreen lightbox with swipe + keyboard nav
- Coupons: applied in cart persist into checkout via Zustand store (no re-entry needed)
- Logo: header reads `public/images/logo.png` + `public/images/name.png` side-by-side — drop files to activate

### Phase 1 shipped (2026-06-11)

- **Bengaluru sweep** — all Lucknow references replaced in every user-facing file; email template + footer now show Horamavu atelier address
- **Favicon** — `app/favicon.ico` (16/32/48 multi-res), `app/icon.png` (512px), `app/apple-icon.png` (180px); Next.js auto-injects, no layout edit needed
- **Footer redesign** — desktop 5-col grid: SHOP | CATEGORIES (Ethnic + Western sub-cols) | HELP | ABOUT; mobile 2-col with CATEGORIES spanning full row; tagline changed to `HAUTE COUTURE · BENGALURU`
- **Festive smooth scroll** — global `scroll-behavior: smooth`; `#products` section has `scroll-margin-top: 112px` for sticky-header offset; reduced-motion override in place
- **Size guide mobile** — SIZE column sticky-left on horizontal scroll; swipe hint on mobile; tighter padding + smaller font under 640px
- **Orders link** — desktop header account icon has hover/focus dropdown (My Account / My Orders / Wishlist); mobile drawer footer gets My Orders link with icon

### Phase 2 shipped (2026-06-12)

- **Order progress bar** — 5-step mini bar on `/account/orders` list; full labelled bar on `/account/orders/[orderNumber]` detail page
- **Order detail page** — `/account/orders/[orderNumber]` with line items, shipping address, payment breakdown, tracking
- **Retry payment** — `/api/orders/[orderNumber]/retry-payment` re-creates Razorpay order; CTA shown on failed/pending orders
- **Paid vs incomplete split** — customer `/account/orders` shows paid orders and a "Payment incomplete" section separately
- **Order deduplication** — pending order idempotency key; abandoned checkout TTL (lazy expiry in create route)
- **Spacing tightened** — `/account/orders`, confirmation page, order detail page all audited and tightened

### QA fixes shipped (2026-06-12)

- **Confirmation page** — async server component; fetches order from Supabase; shows line items, totals, address
- **Checkout form validation** — Zod schema hardened: first_name min 2 + letter required, last_name letter required, city letters-only, pincode first digit 1–9 (rejects 000000), all fields `.trim()`
- **Required field asterisks** — `*` shown on all 8 required checkout fields
- **Size error visibility** — "Please select a size" error is a separate `<p>` below size buttons, not inline with label
- **Payment status labels** — "pending" → "Awaiting payment", "failed" → "Payment failed" in order detail
- **Image fallbacks** — `ImageWithFallback` client component for about/bridal/festive hero images
- **Privacy + Terms pages** — `/privacy` and `/terms` created; footer anchors fixed
- **Razorpay modal** — `handleback: true`, `confirm_close: true` to prevent viewport takeover on browser back

### Phase 3 — Production-readiness audit (2026-06-13)

Security, reliability, and validation hardening across the full stack.

**Security (S-series):**
- **S-1: Email injection closed** — user input (name, notes) HTML-escaped before it reaches Resend email templates; `escapeHtml()` in `lib/email.ts`
- **S-2: Search injection closed** — `/api/search` now uses parameterised Supabase `.or()` builder, not raw string interpolation; invalid characters stripped before query
- **S-3: Admin dev bypass removed** — `middleware.ts` no longer has a `NODE_ENV === 'development'` bypass for `/admin`; unauthenticated requests always redirect
- **S-4: CSP header added** — `Content-Security-Policy` in `next.config.mjs` headers; scopes scripts, frames, images, and connect-src to known origins (Razorpay, Supabase, R2)

**Reliability (H-series):**
- **H-1: Stock decrement idempotency** — `lib/stock.ts` shared helper uses an atomic `UPDATE … WHERE stock_decremented_at IS NULL` claim; runs exactly once per paid order regardless of whether `/verify` or the Razorpay webhook fires first (or both)
- **H-2: Webhook/verify race** — webhook now reconciles by `gateway_order_id` when the row's `gateway_order_id` no longer matches (retry scenario); order always flips to `paid`
- **Migration 029** — adds `stock_decremented_at TIMESTAMPTZ` column + partial index to `orders` table; backfills existing paid orders

**Validation (U-series):**
- **U-1: Pagination hardened** — `/api/products` clamps `page` to a safe integer; `page=abc`, `page=-1`, `page=0` all behave as page 1
- **U-2: Checkout network failure** — `CheckoutForm` now surfaces a retryable error if Razorpay script fails to load or the modal errors out; cart stays full, user is never sent to confirmation on failure

**Test suite (new):**
- 81 Vitest unit tests across 8 files: `razorpay.test.ts`, `coupons.test.ts`, `stock.test.ts`, `html-escape.test.ts`, `ProductGallery.test.tsx`, plus integration tests for orders-create, payment-webhook, payments-verify
- Payment flow test suite: 104/104 (in `scripts/payment_test/`)
- Next.js bumped to 14.2.35 (latest patched 14.2.x)
- `ImageWithFallback` alt prop made required (closes `jsx-a11y/alt-text` lint warning)
- Razorpay client consolidated — `CheckoutForm` now uses shared `openRazorpayCheckout` from `lib/razorpay-client.ts`

### Phase 4 — Order management + PDP enhancements (2026-06-13)

**Order status history + emails:**
- **Migration 028** — `order_status_history` audit table; every fulfillment status change logged with `from_status`, `to_status`, `changed_by`, timestamp
- Shipped/delivered emails fire automatically when admin updates status; de-duped: same `to_status` within 1 hour is skipped
- **Resend confirmation** — button on admin order detail page; server-side rate-limited to once per 60s; every resend logged to history
- **Email preview tool** — `/admin/email-preview`; pick any recent order + override recipient email; sends tagged `test=true` in Resend with no DB side-effects
- Status timeline visible on admin order detail: dot + from→to + relative time + changed_by

**PDP improvements:**
- **Hover magnifier** — `MagnifierLens` component wraps main gallery image; desktop-only (detects `(hover: hover) and (pointer: fine)`); crosshair cursor, 300×400px zoom panel via `createPortal` to `document.body` (avoids overflow clipping); rAF-throttled mousemove
- Mobile/touch: click → lightbox unchanged

**Cart size swap:**
- `availableVariants` stored on `CartItem` at `addToCart` time (same colour group)
- Cart shows `<select>` dropdown for items with 2+ size options; out-of-stock options disabled
- `updateVariant` action: merges qty if target variant already in cart, otherwise swaps in-place

**E2E test expansion (Tier 4):**
- 5 new Playwright spec files: `storefront.spec.ts`, `pdp.spec.ts`, `account.spec.ts`, `admin.spec.ts`, `search.spec.ts`
- 50 tests total (25 chromium + 25 Mobile Chrome)
- API mocking with `page.route()` for search and checkout flows

### Phase 5 — SEO + speed + DB audit (2026-06-13)

**SEO (already in place, verified in Phase 5 audit):**
- `app/sitemap.ts` — dynamic sitemap; includes all active products, all categories, journal articles, static pages; changeFrequency + priority set per route type
- `app/robots.ts` — disallows `/admin`, `/api`, `/account`, `/cart`, `/checkout`, `/order`; sitemap pointer to `https://thepossah.com/sitemap.xml`
- PDP `generateMetadata` — uses admin-set `meta_title`/`meta_description` from DB with fallback to `product.name`/`product.description`; description trimmed to 160 chars; `og:title` + `og:description` included in openGraph block
- Category pages — `generateMetadata` with canonical URL
- PDP JSON-LD — `Product` schema + `BreadcrumbList` schema in `<script type="application/ld+json">` blocks
- Category JSON-LD — `BreadcrumbList` schema on category listing pages

**Speed (audited, all already correct):**
- Hero slider: `priority={i === 0}` on first slide only; other slides lazy-loaded
- Fonts: `next/font/google` with `display: 'swap'` for Inter, Playfair Display, JetBrains Mono — no `@import` from Google Fonts
- Image `sizes` props: all `100vw` usages on genuinely full-width hero/banner images; product cards use `(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw`

**DB audit:**
- All columns on `orders` and `products` tables confirmed active in code — no deprecated columns to rename or drop

### Phase 6 — Routing, image polish + CDN (2026-06-14)

**Routing:**
- `/shop` → `/women` permanent redirect added to `next.config.mjs` (was a 404)
- All generic "Shop Collection" CTAs (CategorySplit, NewArrivals, AnnouncementBar, empty cart, About, 404 page, error pages) now point to `/women` instead of `/shop/sarees`

**Images — zero `placehold.co` remaining:**
- Women page hero + 10 category cards: null fallback swapped from plain grey `<div>` to CDN placeholder `Image`
- `/shop/[category]` hero banner: `placehold.co` fallback → CDN placeholder
- ProductGallery, ProductInfo, ProductCard: product image fallback → CDN placeholder
- `seeds/seed_homepage_config.sql`: all `/images/placeholder-*.jpg` → CDN placeholder; `/lookbook/spring-26` → `/festive`; hero slide CTA → `/women`

**CSP + CDN (previous session):**
- Razorpay `connect-src` widened to `*.razorpay.com` (fixes `lumberjack.razorpay.com` console error)
- R2 custom domain `cdn.thepossah.com` live; all hardcoded `r2.dev` URLs replaced; `NEXT_PUBLIC_R2_PUBLIC_URL` updated in Vercel

**Copy:**
- Made-to-Measure intro: single dense paragraph split into 4 separate prop-style lines with `gap-6` spacing

### Phase 7 — Routing restructure: `/[gender]/[category]/[slug]` (2026-06-14)

Complete routing overhaul for consistent URL namespace and future Men/Kids scaling.

**What changed:**
- New canonical URL structure: `/women/sarees/product-slug` (was `/shop/sarees/product-slug`)
- `app/(shop)/[gender]/` dynamic segment replaces static `women/` folder; `[gender]/[category]/` replaces `shop/[category]/`
- `notFound()` guard on all new routes — unrecognised gender values (e.g. `/sarees`) return 404
- DB migration `030`: `ALTER TABLE categories ADD COLUMN gender TEXT NOT NULL DEFAULT 'women'`; all 13 existing categories automatically get `'women'`
- `/shop/:path*` → `/women/:path*` permanent (308) wildcard redirect in `next.config.mjs`; preserves link equity and works for bookmarks/old search engine entries
- `ProductCard.tsx` URL builder: `/${category_gender}/${category_slug}/${slug}` (was `/shop/...`)
- `WishlistView`, `CartView`, `ProductInfo`: slug stored as full URL path; no prefix prepended
- `revalidatePath` in admin product APIs updated to new path pattern
- `sitemap.ts` emits `/${gender}/${slug}` for categories and `/${gender}/${category}/${slug}` for products
- All hardcoded `/shop/` links removed from Header, Footer, CategoryCircles, CategorySplit, YouMightAlsoLike, journal, account/orders, order confirmation, HomepageEditor defaults, admin product list
- `generateStaticParams` on all three new route levels; routes build as SSG (`●`)

**Scaling to Men/Kids:** Create category in admin → set gender = Men → routes work automatically. No new files needed.

**Test scripts:** `scripts/routing-check.sh` (typecheck + lint + build after each step), `scripts/route-audit.sh` (curl-based route existence audit against a running server)

---

**Key migrations pending (run in Supabase):**
- `030_categories_gender.sql` — adds `gender` column to `categories`
- `031_homepage_config_links.sql` — updates live `homepage_config` occasion tile links from `/shop/` to `/women/`

