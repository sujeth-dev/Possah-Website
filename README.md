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
npm test             # Vitest unit tests
npm run test:api     # admin API test suite
npm run test:payment # payment flow test suite
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
supabase/migrations/001 → 025   run once each, in order
seeds/seed_categories.sql       run after migrations
seeds/seed_homepage_config.sql  run after seed_categories
```

Real product data (42 products) is managed by the pipeline — not SQL seeds.
See [`Possah_Data_Operations_Plan.md`](./Possah_Data_Operations_Plan.md).

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

