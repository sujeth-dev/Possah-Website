# The Possah — Master Project Document

**Last Updated:** 26 May 2026
**Project:** `thepossah.com`
**Stack:** Next.js 14 App Router · Supabase (PostgreSQL) · NextAuth · Razorpay · Resend · Zustand · TypeScript

This is the single source of truth for the live codebase. Read this before touching anything.

---

## 1. Build Status

| Phase | Status | Scope |
|---|---|---|
| Phase 1 — Foundation + Frontend | ✅ Complete | All 21 public storefront pages |
| Phase 2 — Admin Dashboard | ✅ Complete | All 10 admin sections, CRUD, deploy-ready |
| Sprint 1 — Critical Security + Payment | ✅ Complete | Bypass removed, headers, payment.failed, CI |
| Sprint 2 — DB + Test Scaffolding | ✅ Complete | Migration 022 run, payment test suite written |
| Sprint 3 — Frontend Quality + SEO | ⚠️ Partial | ISR/OG/JSON-LD done, GA4 events + Supabase SSR pending |
| Sprint 4 — Infrastructure + Go-Live | ⏳ Not started | Sentry, Vercel, type gen, k6 |

**Current build (verified 26 May 2026):**
- `tsc --noEmit` → **0 errors** (clean)
- `npm run lint` → passing
- CI pipeline exists (`.github/workflows/ci.yml`)
- Security headers on all routes
- Dev admin bypass removed
- payment.captured + payment.failed both handled in webhook
- Coupon expiry DATE comparison bug fixed in both `coupons/validate` and `orders/create`
- Payment test suite complete: `npm run test:payment`
- Admin test suite: `npm run test:api`

**What is NOT done yet** — all tracked in `SPRINT.md`:
- Zero Vitest/Playwright test files written (scaffolding exists; `__tests__/` and `e2e/` are empty)
- Supabase client still on deprecated `@supabase/auth-helpers-nextjs` — must migrate to `@supabase/ssr`
- GA4 events not wired: view_item, add_to_cart, begin_checkout, purchase (base script in layout.tsx only)
- Missing loading.tsx: `admin/orders/`, `admin/products/`
- Missing error.tsx: `cart/`, `account/`, `admin/orders/`, `admin/products/`
- Sentry not installed
- Supabase Database type generic not generated (`database.types.ts`)
- k6 load test script not written

**Schema drift — resolved:**
- `reviews.is_approved BOOLEAN` — code was already correct. No migration needed. See `docs/reviews-schema-plan.md`.
- `coupons.expiry_date DATE` — was comparing against ISO timestamp (bug). Fixed. Both routes now use date-only comparison.
- Migration 022 (`updated_at` triggers on 7 tables) — **run this in Supabase before Sprint 3 work touches updated_at**.

---

## 2. Project Summary

The Possah is a custom luxury Indian fashion storefront with an integrated admin dashboard.

**Storefront:** Editorial landing pages, category listing, PDP with audio/craft story, cart, checkout, order confirmation, wishlist, account, journal, lookbook, and brand pages.

**Admin:** Full CRUD for products (with variants, images, audio), categories, orders (fulfilment + tracking), homepage config, coupons, reviews, journal articles, media library, and store settings.

**Payments:** Razorpay — server-side order creation with price validation (server always re-fetches DB price, never trusts client), client modal, HMAC signature verification, webhook handler for `payment.captured` and `payment.failed`. Full idempotency guard: paid orders cannot be downgraded by late webhooks.

**Auth:** NextAuth Google sign-in. Admin access gated by `admin_users` table allowlist + `isAdmin` JWT flag.

---

## 3. Repository Structure

```
Possah_1.0/
├── app/
│   ├── (shop)/                        ← all public storefront routes
│   │   ├── page.tsx                   ← / homepage
│   │   ├── layout.tsx
│   │   ├── women/ bridal/ festive/ new-in/ ready-to-ship/
│   │   ├── shop/[category]/page.tsx   ← category listing
│   │   ├── shop/[category]/[slug]/    ← PDP
│   │   ├── cart/
│   │   ├── checkout/
│   │   │   └── CheckoutForm.tsx       ← Razorpay modal + payment.failed fix needed
│   │   ├── order/confirmation/
│   │   ├── account/ + account/orders/
│   │   ├── search/ wishlist/ about/ faq/ contact/ size-guide/
│   │   ├── journal/ + journal/[slug]/
│   │   └── lookbook/
│   ├── admin/                         ← protected dashboard
│   │   ├── page.tsx                   ← /admin home
│   │   ├── products/ categories/ orders/ homepage/
│   │   ├── coupons/ reviews/ journal/ media/ settings/
│   │   └── layout.tsx + AdminLayoutClient.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/        ← NextAuth Google OAuth
│   │   ├── orders/create/             ← server-side order + price validation
│   │   ├── payments/webhook/          ← Razorpay webhook
│   │   ├── payments/verify/           ← HMAC signature check
│   │   ├── coupons/validate/
│   │   ├── reviews/
│   │   ├── wishlist/
│   │   ├── search/
│   │   └── admin/
│   │       ├── products/ categories/ orders/ coupons/
│   │       └── reviews/ journal/ settings/ homepage/ media/
│   └── auth/signin/                   ← Google sign-in entry point
│
├── components/
│   ├── layout/        Header · Footer · AnnouncementBar · MobileNav
│   ├── ui/            Button · Input · Accordion · Badge · AudioPlayer · Modal
│   ├── shop/          ProductCard · ProductGrid · FilterSidebar · ProductGallery · SizeSelector
│   ├── cart/          CartDrawer · CartItem
│   └── admin/         AdminLayoutClient · AdminSidebar · AdminStatCard · FulfillmentBadge
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts   ← cookie-aware client (session-dependent flows only)
│   │   ├── public.ts   ← anon server client (public reads, build-safe)
│   │   └── admin.ts    ← service-role client (privileged ops only)
│   ├── auth.ts         ← NextAuth config + admin_users allowlist + isAdmin JWT
│   ├── razorpay.ts     ← order creation + HMAC signature verification
│   ├── email.ts        ← Resend transactional email helpers
│   └── utils.ts
│
├── middleware.ts        ← admin route guards (⚠️ dev bypass present — FIX-SEC-01)
├── styles/globals.css  ← brand CSS tokens — never hardcode values in components
│
├── supabase/
│   └── migrations/     ← 001–017 (see Section 5)
│
└── scripts/
    ├── admin_test/     ← admin API test suite (see GUIDE.md) — 8 modules, ~60 cases
    └── payment_test/   ← payment flow test suite (see GUIDE.md) — 5 modules, ~56 cases
```

---

## 4. Route Map

### Storefront (public)

| Route | Page |
|---|---|
| `/` | Homepage — hero slider, categories, new arrivals, occasion grid |
| `/women` `/bridal` `/festive` `/new-in` `/ready-to-ship` | Editorial landing pages |
| `/shop/[category]` | Category listing with filters and sort |
| `/shop/[category]/[slug]` | PDP — gallery, variants, audio, craft story, reviews |
| `/cart` | Cart with coupon, gift toggle, order summary |
| `/checkout` | Shipping form + Razorpay payment modal |
| `/order/confirmation` | Post-payment confirmation |
| `/account` | Account home |
| `/account/orders` | Order history |
| `/wishlist` | Saved items |
| `/search` | Full-text product search |
| `/journal` | Blog index |
| `/journal/[slug]` | Blog article |
| `/lookbook` | Collection lookbook |
| `/about` `/faq` `/contact` `/size-guide` | Brand + help pages |

### Auth

| Route | Purpose |
|---|---|
| `/auth/signin` | Google sign-in entry point |
| `/api/auth/[...nextauth]` | NextAuth OAuth callback handler |

### Admin (protected — requires `isAdmin` in JWT)

| Route | Purpose |
|---|---|
| `/admin` | Dashboard — stat cards, recent orders |
| `/admin/products` | Product list, new, edit |
| `/admin/categories` | Category list + drag reorder |
| `/admin/orders` | Order list + detail + fulfilment + tracking |
| `/admin/homepage` | Hero, tiles, new arrivals config |
| `/admin/coupons` | Coupon CRUD |
| `/admin/reviews` | Review moderation (pending / approve / reject) |
| `/admin/journal` | Journal articles |
| `/admin/media` | Media library + upload |
| `/admin/settings` | Store settings + admin user management |

### API

| Route | Method | Purpose |
|---|---|---|
| `/api/orders/create` | POST | Validate cart server-side, check stock, create order + Razorpay order |
| `/api/payments/verify` | POST | Verify HMAC signature post-payment, mark order paid |
| `/api/payments/webhook` | POST | Razorpay webhook — `payment.captured` / `payment.failed` |
| `/api/coupons/validate` | POST | Validate coupon, return discount amount |
| `/api/reviews` | POST | Submit review (defaults to pending) |
| `/api/wishlist` | GET/POST/DELETE | Wishlist CRUD (auth required) |
| `/api/search` | GET | Full-text product search |
| `/api/health` | GET | DB health check (to be created — FIX-INFRA-04) |
| `/api/admin/*` | * | All admin CRUD endpoints |

---

## 5. Database Schema

**Live DB verified 2026-05-26.** 22 migrations applied. 21 tables in public schema.

### ⚠️ Schema Discrepancies — Code Must Match These, Not the Old Docs

| Table | Old Doc Said | **Actual Column** | Files to Audit |
|---|---|---|---|
| `reviews` | `status TEXT` (pending/approved/rejected) | **`is_approved BOOLEAN`** | `app/api/admin/reviews/`, `app/admin/reviews/ReviewManager.tsx` |
| `coupons` | `expires_at TIMESTAMPTZ` | **`expiry_date DATE`** | `app/api/coupons/validate/route.ts`, `app/admin/coupons/CouponManager.tsx` |
| `orders` | has `user_id` | **no `user_id` — email-keyed** | Any query using `.eq('user_id', ...)` on orders is broken |

If code references `status`, `expires_at`, or `user_id` on these tables, it is silently failing.

---

### Migration History (applied)

| Migration | What it did |
|---|---|
| `001_products.sql` | `products` table — core product fields |
| `002_categories.sql` | `categories` table |
| `003_orders.sql` | `orders` table — NO user_id, keyed by customer_email |
| `004_users.sql` | `users` table |
| `005_user_measurements.sql` | `user_measurements` table |
| `006_user_addresses.sql` | `user_addresses` table |
| `007_wishlists.sql` | `wishlists` table |
| `008_coupons.sql` | `coupons` table — expiry field is `expiry_date DATE` (not expires_at) |
| `009_reviews.sql` | `reviews` table — moderation via `is_approved BOOLEAN` (not status text) |
| `010_homepage_config.sql` | `homepage_config` table |
| `011_admin_users.sql` | `admin_users` table — no password_hash (dropped in 018b) |
| `012_gift_sets.sql` | `gift_sets` table |
| `013_journal_articles.sql` | `journal_articles` table — no updated_at yet (added in 022) |
| `014_lookbooks.sql` | `lookbooks` + `lookbook_looks` tables |
| `015_rpc_functions.sql` | RPCs: `decrement_variant_stock`, `decrement_coupon_usage`, `increment_coupon_usage`, `update_updated_at`, `update_updated_at_column` |
| `016_add_ready_to_ship.sql` | `products.is_ready_to_ship BOOLEAN` |
| `017_store_settings.sql` | `store_settings` table |
| `018_rls_policies.sql` | RLS policies (intentionally off for most tables at current scale) |
| `018b_admin_users_fix.sql` | Dropped `password_hash` from admin_users |
| `019_categories_updated_at.sql` | `updated_at` + trigger on categories |
| `020_performance_indexes.sql` | Composite indexes + FTS `search_vector` column on products |
| `021_cart_items.sql` | `cart_items` table (server-side cart persistence) |
| `022_missing_updated_at.sql` | `updated_at` + trigger on orders, coupons, journal_articles, reviews, users, user_addresses, product_variants |

### Tables in Public Schema (21)

`admin_users` · `cart_items` · `categories` · `coupons` · `gift_sets` · `homepage_config` · `journal_articles` · `lookbook_looks` · `lookbooks` · `orders` · `product_images` · `product_look_links` · `product_tags` · `product_variants` · `products` · `reviews` · `store_settings` · `user_addresses` · `user_measurements` · `users` · `wishlists`

### Key Column Reference (exact — use these, not the old docs)

**products** — id, slug, name, description, fabric, craft_description, care_instructions, drape_guide, price, compare_price, category_id, sub_line, stock_qty, is_featured, is_new_arrival, is_top_selling, is_active, is_ready_to_ship, meta_title, meta_description, audio_url, craft_story_title, craft_story_body, craft_story_image, search_vector (tsvector generated), created_at, updated_at

**orders** — id, order_number, customer_name, customer_email, customer_phone, shipping_address (jsonb), line_items (jsonb), subtotal, shipping_fee, discount_amount, coupon_code, tax, total, payment_status, fulfillment_status, payment_gateway, gateway_order_id, gateway_payment_id, tracking_number, courier, internal_notes, is_gift, gift_message, created_at, updated_at (added 022)

**coupons** — id, code, type, value, min_order_value, **expiry_date DATE**, usage_limit, usage_count, is_active, created_at, updated_at (added 022)

**reviews** — id, product_id, **is_approved BOOLEAN**, created_at, updated_at (added 022) — *(verify remaining columns directly)*

**admin_users** — id, email, role, is_active, created_at — **no password_hash**

### RLS State

`lookbook_looks` and `users` have RLS enabled. All other tables have RLS off. Intentional — Vercel CDN + Razorpay handle perimeter security at current scale.

### RPCs

| Function | Purpose |
|---|---|
| `decrement_variant_stock(p_variant_id, p_qty)` | Atomic stock decrement — returns FALSE if oversell |
| `decrement_coupon_usage(code)` | Decrements usage_count |
| `increment_coupon_usage(code)` | Increments usage_count |
| `update_updated_at()` / `update_updated_at_column()` | Trigger functions for updated_at automation |

---

## 6. Auth + Security Model

### Admin access flow (production)

1. Request hits any `/admin/*` route
2. `middleware.ts` reads JWT from `next-auth.session-token` cookie via `getToken()`
3. `token.isAdmin` checked
4. `token.isAdmin` is set during sign-in: `lib/auth.ts` JWT callback queries `admin_users` WHERE `email = userEmail AND is_active = true`
5. Not admin → redirect to `/auth/signin`

### ⚠️ Dev bypass in middleware.ts (lines 17–19)

Present intentionally for local development. **Must be removed before any production deploy.** See `SPRINT.md → FIX-SEC-01`.

### Supabase client rules

| Client | File | Use when |
|---|---|---|
| `createServerClient()` | `lib/supabase/server.ts` | Request cookies or session state are needed |
| `createPublicClient()` | `lib/supabase/public.ts` | Public reads in pages, metadata, sitemap (build-safe) |
| `createAdminClient()` | `lib/supabase/admin.ts` | Privileged server-only ops — auth callbacks, webhooks |

Wrong client = broken builds or security gaps.

---

## 7. Payment Flow

```
User submits checkout form
  ↓
POST /api/orders/create
  → Validate all item prices server-side (never trust client total)
  → Check variant stock quantities
  → Apply + validate coupon via RPC
  → Create order row with payment_status: 'pending'
  → Call Razorpay Orders API → get razorpay_order_id
  → Return { razorpay_order_id, amount, currency, key_id }
  ↓
Client opens Razorpay modal
  → User pays via UPI / Card / Wallet / Net Banking
  → Razorpay returns { payment_id, order_id, signature }
  ↓
POST /api/payments/verify
  → Verify HMAC signature with timingSafeEqual
  → Update order: payment_status = 'paid', gateway_payment_id
  → Send confirmation email via Resend
  → Decrement variant stock via RPC
  ↓
Redirect to /order/confirmation?order=PSH-XXXX

Webhook backup (handles dropped client redirects):
POST /api/payments/webhook
  → Verify Razorpay webhook signature
  → payment.captured → update order if not already paid, send email if not sent
  → payment.failed → ⚠️ not yet handled — see SPRINT.md FIX-PAY-01
```

---

## 8. Local Development Setup

### 1. Environment file

```bash
cp .env.local.example .env.local
```

```env
NODE_ENV=development

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXTAUTH_SECRET=any_random_string_for_dev
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

RESEND_API_KEY=

NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

### 2. App

```bash
npm install
npm run dev       # :3000
npm run lint      # must pass before commit
npm run build     # must pass before deploy
```

### 3. Supabase (Docker required — run as Admin on Windows)

```bash
supabase start
supabase db reset    # applies all 17 migrations + seeds
supabase status      # copy URL + keys → paste into .env.local
```

---

## 9. CSS Design Tokens

All brand values live in `styles/globals.css`. Never hardcode in components.

```css
--color-bg:         #F4ECDF;   /* Warm Ivory — default background */
--color-green:      #1F3A2D;   /* Deep Forest Green */
--color-rose:       #C99A99;   /* Dusty Rose */
--color-orange:     #B35A2B;   /* Burnt Orange */
--color-gold:       #C8973A;   /* Mustard Gold */
--color-text:       #1A1A1A;
--color-text-muted: #6B6B6B;
--color-border:     #E2D9CC;

--font-display: 'Possah Sans', 'Playfair Display', serif;
--font-body:    'Neue Haas Grotesk', 'Inter', sans-serif;
--font-mono:    'GT America Mono', 'JetBrains Mono', monospace;
```

Full reference → `docs/archive/POSSAH_CREATIVE_DIRECTION.md` → Sections 2 + 3.

---

## 10. Canonical Documents

| Document | Purpose |
|---|---|
| `POSSAH_MASTER_DOCUMENT.md` ← this | What the system is. Architecture, routes, schema, auth. |
| `SPRINT.md` | What remains before go-live. Every fix with exact code. Go-live gate checklist. |
| `docs/archive/POSSAH_CREATIVE_DIRECTION.md` | Brand bible. Colours, fonts, voice, logo, layout. Read before any UI work. |
| `docs/archive/POSSAH_BUILD_GUIDE.md` | Original build guide. Phase 1+2 implementation detail + test checklists. |
| `TESTING_PLAN.md` | Test strategy and Vitest/Playwright config reference. |
| `scripts/admin_test/GUIDE.md` | Admin API test suite runner. |
