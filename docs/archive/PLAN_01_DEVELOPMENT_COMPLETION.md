# Possah 1.0 — Plan 01: Development Completion

**Type:** Development Roadmap  
**Scope:** All remaining code work from current state → production-ready codebase  
**Based on:** Current codebase state (post Phase 2), `ROLE_AUDIT_PHASE2.md`, `POSSAH_BUILD_STATUS_GUIDE.md`  
**Last Updated:** May 2026

---

## Current State Summary

What is done:
- Full Next.js 14 storefront with all routes
- Supabase schema (17 migrations), seeds, RPC functions
- Admin dashboard (all 10 admin sections)
- NextAuth Google sign-in with `admin_users` allowlist
- Razorpay checkout with server-side price validation and stock decrement webhook
- Build passing, lint passing, publicly deployable

What is NOT done (code must be written):
- Tests (zero coverage)
- Security hardening (no RLS, no headers, no rate limiting)
- Performance optimizations (no caching, sequential queries)
- Database migrations for missing indexes and cart table
- Error boundaries and loading skeletons
- Cart/wishlist DB sync
- GA4 analytics
- Admin notification emails
- Env var validation

---

## Sprint 1 — Security & Infrastructure (Do This Before Any Real Traffic)

**Estimated effort:** 3–5 days  
**Blocker:** Nothing ships live without these. A security gap costs more to fix post-breach than pre-launch.

### S1.1 — Security Headers

**File:** `next.config.mjs`

Add `headers()` export with: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

Do NOT add CSP yet — audit all third-party script origins first (Razorpay, GA4) and add CSP in report-only mode via S1.4.

**Verification:** `curl -I https://staging.thepossah.com | grep X-Frame` must show the header.

---

### S1.2 — Row Level Security

**File:** `supabase/migrations/018_rls_policies.sql`

Enable RLS on all 17 tables. Write policies:
- `products`, `categories`, `product_variants`: public anon read (where `is_active = true`)
- `orders`, `wishlists`, `user_addresses`, `user_measurements`: owner-only (auth.uid() = user_id)
- `reviews`: public read for `status = 'approved'`, authenticated write for `auth.uid() = user_id`
- `coupons`: no direct anon or user read (validate only through server API)
- Admin tables (`admin_users`, `homepage_config`, `store_settings`): no user-level access

**Verification:** Use a fresh Supabase anon key client (no service role) to attempt reading `orders`. Must return empty or error, not all orders.

---

### S1.3 — Rate Limiting

**Files:** `lib/ratelimit.ts`, update `app/api/orders/create/route.ts`, `app/api/coupons/validate/route.ts`, `app/api/contact/route.ts`

Use `@upstash/ratelimit` + `@upstash/redis`. Set up a free Upstash Redis instance (50MB free tier is enough). Rate limits:
- Orders: 5 per minute per IP
- Coupon validate: 10 per minute per IP
- Contact: 3 per 5 minutes per IP

Return `429 Too Many Requests` with `Retry-After` header when limit exceeded.

**Verification:** Write a shell loop hitting `/api/coupons/validate` 15 times. Requests 11-15 must return 429.

---

### S1.4 — Env Var Validation

**File:** `lib/env.ts`

Zod schema validating all 14 required env vars at import time. Import in `lib/razorpay.ts`, `lib/email.ts`, `lib/auth.ts`. If any var is missing or malformed, the import throws with a clear message: `"Missing required env var: RAZORPAY_KEY_SECRET"`.

**Verification:** Set `RAZORPAY_KEY_SECRET=` (empty) in `.env.local`, run `npm run dev`. Must crash at startup with a clear error, not silently fail later.

---

### S1.5 — Remove Dev Admin Bypass

**File:** `middleware.ts`, `app/admin/layout.tsx`

Find and remove any `if (process.env.NODE_ENV === 'development') return NextResponse.next()` in admin protection logic. Instead, seed the developer's email into `admin_users` table locally. Local auth should work identically to production.

**Verification:** Start dev server. Navigate to `/admin` without being signed in. Must redirect to `/auth/signin`.

---

### S1.6 — Admin Order Notification Email

**File:** `app/api/payments/webhook/route.ts`

After the `payment.captured` block updates order status to `paid`, call `lib/email.ts` to send an admin notification email via Resend to the configured admin email address. Email should include: order number, customer name, items ordered with quantities, shipping address, and total.

**Verification:** Process a Razorpay test payment. Admin email receives notification within 30 seconds.

---

## Sprint 2 — Testing Infrastructure

**Estimated effort:** 3–4 days  
**Goal:** Unit and integration tests for all money-touching code. E2E for the checkout flow.

### S2.1 — Install Test Stack

```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event jsdom
npm install -D @playwright/test
npx playwright install chromium
```

Create `vitest.config.ts` and `playwright.config.ts` as specified in `TESTING_PLAN.md` Section 1.

Add to `package.json`:
```json
"test:unit": "vitest run tests/unit",
"test:integration": "vitest run tests/integration",
"test:e2e": "playwright test",
"test:coverage": "vitest run --coverage"
```

---

### S2.2 — Unit Tests

Write the following test files (full specs in `TESTING_PLAN.md`):
- `tests/unit/razorpay.test.ts` — all signature verification edge cases
- `tests/unit/utils.test.ts` — `formatPrice`, `generateOrderNumber`
- `tests/unit/coupon-calc.test.ts` — extract calculation logic from `CheckoutForm` into `lib/coupon.ts`, test all discount types

**Pass criteria:** 100% line coverage on `lib/razorpay.ts`, 100% on `lib/utils.ts`.

---

### S2.3 — Integration Tests

Write against local Supabase (`supabase start` + `supabase db reset`):
- `tests/integration/orders-create.test.ts` — price spoofing, out-of-stock, valid order
- `tests/integration/payment-webhook.test.ts` — invalid sig, valid payment.captured, stock decrement, idempotency
- `tests/integration/coupons.test.ts` — all coupon types, edge cases
- `tests/integration/admin-auth.test.ts` — all admin routes return 401/403 without proper auth

---

### S2.4 — E2E Tests (Playwright)

Write:
- `tests/e2e/homepage.spec.ts` — hero, nav, mobile menu
- `tests/e2e/shop.spec.ts` — category list, PDP, add to cart
- `tests/e2e/checkout.spec.ts` — full flow with mocked Razorpay + payment verify
- `tests/e2e/auth.spec.ts` — unauthenticated redirect to signin
- `tests/e2e/seo.spec.ts` — OG image, sitemap, robots.txt, meta descriptions

**Pass criteria:** All E2E tests pass on `chromium`. Checkout flow test must succeed end-to-end.

---

### S2.5 — CI/CD Pipeline

**File:** `.github/workflows/ci.yml`

Gates on every PR to `main`:
1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run test:unit`
4. `npm run test:integration` (with local Supabase service container in CI)

Enable branch protection on `main` — no merge without green CI.

---

## Sprint 3 — Performance & Database

**Estimated effort:** 2–3 days

### S3.1 — Database Indexes

**File:** `supabase/migrations/019_performance_indexes.sql`

Add indexes on:
- `products(category_id)` where `is_active = true`
- `products(slug)`
- `product_variants(product_id)`
- `product_variants(stock_qty)` where `is_active = true`
- `orders(user_id)`, `orders(payment_status)`, `orders(created_at DESC)`, `orders(razorpay_order_id)`
- `wishlists(user_id)`
- `reviews(product_id)` where `status = 'approved'`
- `coupons(code)` where `is_active = true`

Add `search_vector` tsvector generated column on `products` with GIN index. Update `/api/search` to use `textSearch()` on this column instead of `ilike`.

---

### S3.2 — PDP Performance

**File:** `app/(shop)/shop/[category]/[slug]/page.tsx`

Parallelize the 5 sequential Supabase queries with `Promise.all`. Add `generateStaticParams` fetching all active product slugs. Set `export const revalidate = 3600`.

---

### S3.3 — Shop/Category Caching

**Files:** `app/(shop)/shop/[category]/page.tsx`, `app/(shop)/page.tsx`

Set `export const revalidate = 60` on category listing pages. Use `unstable_cache` on the homepage config query — this query runs on every homepage load and its data changes rarely.

---

### S3.4 — Categories `updated_at`

**File:** `supabase/migrations/020_categories_updated_at.sql`

Add `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` column to `categories`. Add a `BEFORE UPDATE` trigger. This fixes sitemap `lastModified` for all category URLs.

---

### S3.5 — Cart Items Table

**File:** `supabase/migrations/021_cart_items.sql`

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart_owner_all" ON cart_items FOR ALL USING (auth.uid() = user_id);
```

---

## Sprint 4 — UX Completion

**Estimated effort:** 3–4 days

### S4.1 — Loading Skeletons

Create `loading.tsx` for:
- `app/(shop)/loading.tsx`
- `app/(shop)/shop/[category]/loading.tsx` — 12-card product grid skeleton
- `app/(shop)/shop/[category]/[slug]/loading.tsx` — gallery + info skeleton
- `app/(shop)/cart/loading.tsx`
- `app/(shop)/account/loading.tsx`

Each skeleton must match the real content's layout dimensions to prevent CLS on load.

---

### S4.2 — Error Boundaries

Create `error.tsx` for:
- `app/(shop)/error.tsx`
- `app/(shop)/shop/[category]/error.tsx`
- `app/(shop)/shop/[category]/[slug]/error.tsx`
- `app/(shop)/checkout/error.tsx`
- `app/admin/error.tsx`

Each must render a branded error page with a clear action (retry, go home) and NOT expose stack traces.

---

### S4.3 — Cart + Wishlist DB Sync

**Files:** `lib/store/cartStore.ts`, `lib/store/wishlistStore.ts`

Cart sync:
1. On `addItem`/`removeItem`/`updateQty`: if user is authenticated, call `POST /api/cart` (new route) to write to `cart_items`
2. On store initialization: if authenticated, fetch cart from DB and merge with localStorage items
3. Create `app/api/cart/route.ts` — GET (fetch items) and POST (add/update/remove)

Wishlist sync:
1. On `addToWishlist`: if authenticated, insert to `wishlists` table
2. On `removeFromWishlist`: if authenticated, delete from `wishlists`
3. On store init: if authenticated, fetch `wishlists` from DB

---

### S4.4 — State Dropdown on Checkout

**File:** `app/(shop)/checkout/CheckoutForm.tsx`

Replace `<input type="text" name="state">` with `<select name="state">` containing all 28 Indian states + 8 Union Territories in alphabetical order. Store full names. Validate non-empty on form submit.

---

### S4.5 — Saved Address Auto-Fill

**File:** `app/(shop)/checkout/CheckoutForm.tsx`

For authenticated users:
1. On mount, call `/api/user/addresses` (new route) to fetch saved addresses
2. If addresses exist, show a `<select>` above the form: "Use a saved address"
3. On selection, populate all address fields
4. Add "Save this address for next time" checkbox — on form submit (before payment), POST to `/api/user/addresses`

---

### S4.6 — Customer Order Tracking

**File:** `app/(shop)/account/orders/page.tsx`

Read `tracking_number` and `courier` from the orders query. Render:
- If `tracking_number` and `courier` are set: a "Track Shipment" button/link
- If only `tracking_number`: display the number as plain text with a copy button
- If neither: "Tracking not yet available"

Build a courier URL map:
```ts
const courierUrls: Record<string, string> = {
  'Delhivery': 'https://www.delhivery.com/track/package/',
  'Bluedart': 'https://www.bluedart.com/tracking',
  'DTDC': 'https://www.dtdc.in/tracking.asp',
  // etc.
}
```

---

### S4.7 — Reduced Motion CSS

**File:** `styles/globals.css`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Sprint 5 — Analytics & SEO Fixes

**Estimated effort:** 2 days

### S5.1 — GA4 Script + Events

**Files:** `app/layout.tsx`, `lib/store/cartStore.ts`, `app/(shop)/checkout/CheckoutForm.tsx`

Install GA4 script in `app/layout.tsx` using `next/script` with `strategy="afterInteractive"`.

Fire events:
- `view_item` — on PDP load
- `add_to_cart` — in `cartStore.addItem`
- `begin_checkout` — on CheckoutForm mount
- `purchase` — after successful `verifyPayment` with `transaction_id`, `value`, `currency: 'INR'`, `items`

---

### S5.2 — Canonical Tags on Shop Pages

**File:** `app/(shop)/shop/[category]/page.tsx`

In `generateMetadata`, add:
```ts
alternates: { canonical: `https://thepossah.com/shop/${params.category}` }
```

---

### S5.3 — Breadcrumb JSON-LD Fix

**File:** `app/(shop)/shop/[category]/[slug]/page.tsx`

Replace hardcoded `/shop/sarees` in the breadcrumb JSON-LD with the actual `product.category_slug` value.

---

### S5.4 — Meta Description Truncation

**File:** `app/(shop)/shop/[category]/[slug]/page.tsx`

```ts
description: product.description?.replace(/<[^>]+>/g, '').slice(0, 155)
```

---

## Sprint 6 — Error Monitoring

**Estimated effort:** 1 day

### S6.1 — Sentry Integration

```bash
npx @sentry/wizard@latest -i nextjs
```

Configure:
- `sentry.server.config.ts`
- `sentry.client.config.ts`
- `sentry.edge.config.ts`

Add `Sentry.captureException(err, { extra: context })` to every `catch` block in API routes. Set `SENTRY_DSN` env var on Vercel. Verify: trigger a deliberate error in a test API call, confirm it appears in Sentry dashboard.

---

## Sprint 7 — Health Check + Smoke Tests

**Estimated effort:** 1 day

### S7.1 — Health Check Endpoint

**File:** `app/api/health/route.ts`

```ts
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createPublicClient()
    await supabase.from('categories').select('id').limit(1)
    return NextResponse.json({ status: 'ok', timestamp: Date.now(), version: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local' })
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 })
  }
}
```

### S7.2 — Smoke Test Runbook

Create `SMOKE_TEST_RUNBOOK.md` with the 15-step manual verification checklist for every deployment. See `ROLE_AUDIT_PHASE2.md` QA section for the full checklist.

---

## Development Completion Checklist

### Security (must complete before any live transactions)
- [ ] Security headers in `next.config.mjs`
- [ ] RLS policies migration (`018_rls_policies.sql`)
- [ ] Rate limiting on orders, coupons, contact
- [ ] Env var validation (`lib/env.ts`)
- [ ] Dev admin bypass removed
- [ ] Coupon code removed from URL params

### Testing (must complete before go-live)
- [ ] Vitest installed and configured
- [ ] Unit tests for `lib/razorpay.ts` — 100% coverage
- [ ] Unit tests for `lib/utils.ts` — 100% coverage
- [ ] Integration test for `POST /api/payments/webhook`
- [ ] Integration test for `POST /api/orders/create`
- [ ] Playwright checkout E2E passing
- [ ] CI/CD `.github/workflows/ci.yml` active

### Operations
- [ ] Admin order notification email on payment.captured
- [ ] Health check endpoint (`/api/health`)
- [ ] Uptime monitoring configured (UptimeRobot)

### Performance
- [ ] Database indexes migration (`019_performance_indexes.sql`)
- [ ] PDP `Promise.all` + `generateStaticParams`
- [ ] Shop/category page `revalidate = 60`
- [ ] Full-text search using `search_vector`

### UX
- [ ] `loading.tsx` for all major routes
- [ ] `error.tsx` for all major routes
- [ ] State `<select>` on checkout
- [ ] Saved address auto-fill
- [ ] Cart + wishlist DB sync
- [ ] Customer order tracking on `/account/orders`
- [ ] Reduced motion CSS

### Analytics & SEO
- [ ] GA4 script + 4 events
- [ ] Canonical tags on shop pages
- [ ] Breadcrumb JSON-LD dynamic category
- [ ] Meta description truncation

### Monitoring
- [ ] Sentry installed and capturing exceptions
