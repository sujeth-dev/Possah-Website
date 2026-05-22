# The Possah — Master Project Document

**Last Updated:** May 2026
**Project:** `thepossah.com`
**Stack:** Next.js 14 App Router · Supabase (PostgreSQL) · NextAuth · Razorpay · Resend · Zustand · TypeScript

This is the single source of truth for the live codebase. Read this before touching anything.

---

## 1. Build Status

| Phase | Status | Scope |
|---|---|---|
| Phase 1 — Foundation + Frontend | ✅ Complete | All 21 public storefront pages |
| Phase 2 — Admin Dashboard | ✅ Complete | All 10 admin sections, CRUD, deploy-ready |
| Phase 3 — Go-Live Sprint | ⏳ In progress | See `SPRINT.md` |

**Current build:**
- `npm run lint` → passing
- `npm run build` → passing
- Public pages use dedicated public Supabase client — no cookie-bound reads during build
- Sitemap generates cleanly
- Admin auth routes correctly to `/auth/signin`

**What is NOT done yet** — all tracked in `SPRINT.md`:
- Dev admin bypass still in `middleware.ts` (🔴 must remove before production)
- No CI/CD pipeline
- No test suite (zero test files)
- No loading.tsx / error.tsx on any route
- No Sentry error tracking
- Supabase client on deprecated `@supabase/auth-helpers-nextjs`
- `payment.failed` not handled in CheckoutForm or webhook
- No ISR / `generateStaticParams` on product/category pages
- No GA4 event calls wired

---

## 2. Project Summary

The Possah is a custom luxury Indian fashion storefront with an integrated admin dashboard.

**Storefront:** Editorial landing pages, category listing, PDP with audio/craft story, cart, checkout, order confirmation, wishlist, account, journal, lookbook, and brand pages.

**Admin:** Full CRUD for products (with variants, images, audio), categories, orders (fulfilment + tracking), homepage config, coupons, reviews, journal articles, media library, and store settings.

**Payments:** Razorpay — server-side order creation with price validation, client modal, HMAC signature verification, webhook handler for `payment.captured`.

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
    └── admin_test/     ← admin API test suite (see GUIDE.md)
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

17 migrations in `supabase/migrations/`:

| Migration | Table | Key fields |
|---|---|---|
| `001_products.sql` | `products` | slug, name, price, fabric, is_active, is_new_arrival, is_top_selling, audio_url |
| `002_categories.sql` | `categories` | slug, name, parent_id, nav_section, position, banner_image |
| `003_orders.sql` | `orders` | order_number, customer_email, line_items (jsonb), total, payment_status, fulfillment_status, tracking_number, courier |
| `004_users.sql` | `users` | email, name, google_id |
| `005_user_measurements.sql` | `user_measurements` | user_id, bust_cm, waist_cm, hips_cm, height_cm |
| `006_user_addresses.sql` | `user_addresses` | user_id, full_name, phone, line1, city, state, pincode, is_default |
| `007_wishlists.sql` | `wishlists` | user_id, product_id |
| `008_coupons.sql` | `coupons` | code, type (percent/flat/free_shipping), value, min_order_value, usage_limit, usage_count, expires_at, is_active |
| `009_reviews.sql` | `reviews` | product_id, reviewer_name, rating, body, status (pending/approved/rejected) |
| `010_homepage_config.sql` | `homepage_config` | hero_slides (jsonb), collection_banner, occasion_tiles (jsonb) |
| `011_admin_users.sql` | `admin_users` | email, is_active, role |
| `012_gift_sets.sql` | `gift_sets` | name, items (jsonb), price |
| `013_journal_articles.sql` | `journal_articles` | slug, title, body, category, author, featured_image, is_published, published_at |
| `014_lookbooks.sql` | `lookbooks` | season, images (jsonb) |
| `015_rpc_functions.sql` | RPCs | `decrement_variant_stock`, `validate_and_apply_coupon` |
| `016_add_ready_to_ship.sql` | `products` | adds `is_ready_to_ship` column |
| `017_store_settings.sql` | `store_settings` | announcement_bar_text, store_email, whatsapp_number, free_shipping_threshold, express_delivery_fee |

**Pending migrations** (Sprint):
- `018_fix_admin_users.sql` — drop `password_hash NOT NULL` from admin_users
- `019_categories_timestamps.sql` — `updated_at` + trigger on categories
- `020_missing_timestamps.sql` — `updated_at` triggers on all remaining tables without it
- `021_indexes.sql` — composite indexes for common query patterns

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
