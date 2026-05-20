# Possah 1.0 — Phase 1 Audit Report
**Date:** 2026-05-20  
**Stack:** Next.js 14 App Router · Supabase · Razorpay · Resend · Zustand · TypeScript  
**Audited by:** Full role-by-role sweep of all source files, migrations, config, and API routes.

---

## Severity Legend
- 🔴 **CRITICAL** — Security vulnerability or data integrity bug. Fix before going live.
- 🟠 **HIGH** — Major functional gap or overselling risk. Fix in immediate sprint.
- 🟡 **MEDIUM** — Quality/performance issue. Fix before scaling.
- 🔵 **LOW** — Polish, DX, or future-proofing. Backlog.
- ⚪ **DEFERRED** — Role / feature not needed yet. Park for later phase.

---

## Fix Tracker — Pre-Phase 2 Sprint (2026-05-20)

All 8 "Fix BEFORE Phase 2" items resolved. Files changed:

| File | Change |
|------|--------|
| `app/api/orders/create/route.ts` | Full rewrite — server-side price validation, stock check, atomic coupon RPC |
| `app/api/coupons/validate/route.ts` | Fixed `free_shipping` discount type in response |
| `app/api/payments/webhook/route.ts` | Added `decrement_variant_stock` RPC calls after `payment.captured` |
| `app/(shop)/checkout/CheckoutForm.tsx` | Handle `free_shipping` coupon type — zero shipping cost client-side |
| `lib/razorpay.ts` | `timingSafeEqual` length check + try/catch in both verify functions |
| `lib/auth.ts` | JWT callback queries `admin_users` on sign-in, embeds `isAdmin` in token |
| `lib/supabase/admin.ts` | New — service-role Supabase client for auth callbacks |
| `middleware.ts` | Uses `getToken()` + `token.isAdmin` — cookie presence no longer sufficient |
| `supabase/migrations/015_rpc_functions.sql` | New — `increment_coupon_usage` + `decrement_variant_stock` atomic RPCs |
| `public/images/og-default.jpg` | New — 1200×630 branded OG image |
| `public/images/logo-dark.svg` | New — ivory wordmark for Razorpay modal |

**Remaining open items from this audit:** see individual role sections. Next batch scheduled for Phase 2 (see Execution Sequence table below).

---

## 1. Frontend Developer

### Problems

**🔴 CRITICAL — Price spoofing at checkout** ✅ FIXED  
`CheckoutForm.tsx` sends client-calculated `subtotal` to `/api/orders/create`. The server only checks that `total = subtotal + shipping + gift - coupon`. It never validates individual item prices against the database. A user can POST `items: [{ price: 1, ... }]` with `subtotal: 1` and place an order for ₹1 on any product.  
**Fix:** Server must fetch real prices from `product_variants` by `variant_id` and recalculate subtotal itself.  
**Applied:** `app/api/orders/create/route.ts` fully rewritten — fetches real prices via `product_variants JOIN products`, calculates all totals server-side, stores DB prices in `line_items`, ignores all client-submitted prices.

**🟠 HIGH — Cart and Wishlist not synced to database**  
Both `cartStore.ts` and `wishlistStore.ts` use Zustand `persist` to `localStorage` only. The `wishlists` DB table exists but is never written to. A logged-in customer switching devices loses their cart and wishlist entirely.  
**Fix:** On login, merge localStorage state with DB. On add/remove, write to DB for authenticated users.

**🟠 HIGH — No inventory re-check at checkout** ✅ FIXED  
Cart items are added based on variant `stock_qty > 0` at the time of PDP load. By checkout, that variant may be out of stock. `/api/orders/create` never queries `product_variants.stock_qty` before accepting the order.  
**Fix:** In `orders/create`, query variant stock for each cart item and reject if any is 0.  
**Applied:** `orders/create` rewrite now validates `is_active` and `stock_qty >= item.qty` for every variant before proceeding.

**🟡 MEDIUM — No `generateStaticParams` on PDP**  
`app/(shop)/shop/[category]/[slug]/page.tsx` is fully dynamic (SSR on every request). Every first visit hits Supabase. With 100+ products this puts unnecessary load on the DB and increases TTFB.  
**Fix:** Add `generateStaticParams` fetching all active product slugs + `export const revalidate = 3600`.

**🟡 MEDIUM — No Suspense / loading skeletons**  
No `loading.tsx` files or `<Suspense>` boundaries exist anywhere in the route tree. Users see a blank screen while server components fetch data.  
**Fix:** Add `loading.tsx` for shop, PDP, cart, and account routes.

**🔵 LOW — Razorpay logo path is wrong** ✅ FIXED  
`initRazorpay` in `CheckoutForm.tsx` (line 758) passes `image: '/images/logo-dark.svg'`. This file does not exist in `public/images/` (only `logo-gradient.png` and `logo-symbol.png` exist). The Razorpay modal will show a broken logo.  
**Fix:** Change path to `/images/logo-gradient.png` or add the SVG.  
**Applied:** `public/images/logo-dark.svg` created — ivory serif wordmark on transparent background, sized for the Razorpay modal.

**🔵 LOW — `void formatPrice` hack in PDP**  
`app/(shop)/shop/[category]/[slug]/page.tsx` line 15 has `void formatPrice` to suppress an unused import warning. The import should either be used or removed.

**🔵 LOW — State field is free-text**  
The shipping address "State" field in `CheckoutForm.tsx` is a plain `<input type="text">`. Should be a `<select>` with all Indian states/UTs to prevent typos and ensure clean shipping data.

---

## 2. Backend Developer

### Problems

**🔴 CRITICAL — No item price validation server-side** ✅ FIXED  
Repeat of #1 above. `/api/orders/create` accepts `items[].price` from the client and uses client-sent `subtotal` directly. The entire price integrity of the platform relies on the client being honest.  
**Fix:** After parsing the order body, fetch `product_variants` prices from DB by `variant_id`, recalculate subtotal server-side, reject if mismatch > ₹1.  
**Applied:** See Frontend fix #1 — same rewrite covers this.

**🔴 CRITICAL — No stock decrement on order creation** ✅ FIXED  
`/api/orders/create` inserts the order and charges via Razorpay but never decrements `product_variants.stock_qty`. Overselling is unbounded — 1000 customers can all "buy" the last unit.  
**Fix:** After payment confirmation (in webhook `payment.captured`), run `UPDATE product_variants SET stock_qty = stock_qty - qty WHERE id = $variant_id AND stock_qty >= qty` in a transaction. Reject if any variant comes back with 0 rows updated.  
**Applied:** `supabase/migrations/015_rpc_functions.sql` — `decrement_variant_stock(p_variant_id, p_qty)` atomic RPC. Called in `app/api/payments/webhook/route.ts` via `Promise.all` after `payment_status = 'paid'` update succeeds. Oversells logged for manual reconciliation.

**🟠 HIGH — Coupon usage race condition** ✅ FIXED  
In `/api/orders/create` (lines ~90–105), coupon usage increment is non-atomic: read `usage_count`, then write `usage_count + 1`. Under concurrent requests, `usage_limit = 1` coupons can be claimed by multiple users simultaneously.  
**Fix:** Use a single SQL statement: `UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $id AND (usage_limit IS NULL OR usage_count < usage_limit) RETURNING id`. If 0 rows returned, reject the order.  
**Applied:** `supabase/migrations/015_rpc_functions.sql` — `increment_coupon_usage(p_coupon_id)` RPC. Called in `orders/create` via `supabase.rpc(...)` — returns `false` if limit already reached, order is rejected immediately.

**🟠 HIGH — No rate limiting on any API route**  
`/api/coupons/validate`, `/api/orders/create`, `/api/contact`, and `/api/search` have no rate limiting. Coupon codes can be brute-forced, contact form can be spammed, and order endpoint can be hammered.  
**Fix:** Add rate limiting middleware (e.g. `@upstash/ratelimit` + Upstash Redis, or Cloudflare WAF rules).

**🟠 HIGH — Admin access not tied to `admin_users` table** ✅ FIXED  
`middleware.ts` checks for the presence of a `next-auth.session-token` cookie but never verifies the user is in `admin_users`. Any Google account that completes OAuth can access `/admin` in production.  
**Fix:** In middleware (or a shared admin layout), after session cookie check, verify `session.user.email` exists in `admin_users` with `is_active = true`. Redirect to 403 if not.  
**Applied:** `lib/supabase/admin.ts` created (service-role client). `lib/auth.ts` JWT callback queries `admin_users` on sign-in, embeds `isAdmin` in the JWT. `middleware.ts` uses `getToken()` to decode JWT and rejects if `!token.isAdmin`.

**🟡 MEDIUM — `categories` table has no `updated_at` column**  
`sitemap.ts` queries `categories.updated_at` but `002_categories.sql` only has `created_at`. This means every category entry in the sitemap has `lastModified: undefined`.  
**Fix:** Add `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` and a trigger to `002_categories.sql` (or a new migration).

**🟡 MEDIUM — No pagination on search**  
`/api/search` hardcodes `.limit(24)` with no pagination support. Fine for now, not for scale.

**🔵 LOW — `createServerClient` has no Database generic**  
`lib/supabase/server.ts` calls `createServerComponentClient({ cookies })` without the `Database` type generic, losing all type safety on server-side queries. Every joined query casts through `as unknown`.  
**Fix:** `createServerComponentClient<Database>({ cookies })`.

---

## 3. Full Stack Developer

### Problems

**🟠 HIGH — No error monitoring**  
No Sentry, no LogRocket, no Axiom. Server errors are only `console.error`. In production, silent failures (failed DB writes, failed emails) go completely unnoticed.  
**Fix:** Integrate Sentry (`@sentry/nextjs`) with source maps. Instrument all `catch` blocks and the webhook handler.

**🟠 HIGH — No server-side caching**  
All server components fetch directly from Supabase on every request with no `revalidate`, no `unstable_cache`, no Redis layer. Homepage, shop pages, and PDP all re-query on every hit.  
**Fix:** Add `export const revalidate = 60` to shop/category pages. Use `unstable_cache` for homepage config and new arrivals.

**🟡 MEDIUM — `@supabase/auth-helpers-nextjs` is deprecated**  
The package used in `lib/supabase/server.ts` and `lib/supabase/client.ts` is the legacy helpers package. Supabase now ships `@supabase/ssr`.  
**Fix:** Migrate to `@supabase/ssr` — different client creation API, better session handling in App Router.

**🟡 MEDIUM — No environment variable validation at startup**  
Missing or wrong env vars (e.g. empty `RAZORPAY_KEY_SECRET`) only fail at the point of use, not at boot. This makes misconfigured deployments hard to debug.  
**Fix:** Add a `lib/env.ts` using `zod` to validate all required env vars at import time. Throw clearly if any are missing.

**🔵 LOW — No analytics implementation**  
`NEXT_PUBLIC_GA_MEASUREMENT_ID` is in `.env.local.example` but no `<Script>` tag, no `gtag`, no GA4 event calls exist anywhere in the codebase.  
**Fix:** Add Next.js `<Script>` with GA4 snippet in `app/layout.tsx`. Fire `purchase` event from `CheckoutForm` on successful payment.

---

## 4. UI/UX Designer

### Problems

**🟡 MEDIUM — No skip-to-main-content link**  
`<main id="main-content">` exists in `layout.tsx` but there is no visually-hidden skip nav link at the top of the page. Screen reader and keyboard-only users must tab through the full header on every page.  
**Fix:** Add `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>` as the first child of `<body>`.

**🟡 MEDIUM — No `prefers-reduced-motion` handling**  
Swiper sliders, hover transitions, and any scroll-triggered animations do not respect the OS-level `prefers-reduced-motion: reduce` media query. This can trigger vestibular issues.  
**Fix:** Add `@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; } }` to `globals.css`.

**🟡 MEDIUM — State field should be a dropdown**  
Free-text state input leads to dirty data (e.g. "UP" vs "Uttar Pradesh" vs "uttar pradesh") that breaks shipping integrations.  
**Fix:** `<select>` with all 28 states + 8 UTs.

**🔵 LOW — No saved address auto-fill at checkout**  
`user_addresses` DB table exists with full address schema. Logged-in users are never offered their saved addresses at checkout. Every order requires re-typing the full address.  
**Fix:** On checkout load (for authenticated users), fetch `user_addresses` and show a "Use saved address" selector.

---

## 5. Brand / Graphic Designer

### Problems

**🔴 CRITICAL — OG default image missing** ✅ FIXED  
`app/layout.tsx` references `/images/og-default.jpg` in `openGraph.images`. This file does not exist in `public/images/`. Every page without a product-specific OG image will render a broken image on social share — a severe brand impression failure.  
**Fix:** Create and add `public/images/og-default.jpg` (1200×630px) in brand style.  
**Applied:** `public/images/og-default.jpg` generated — 1200×630, deep green `#1F3A2D` background, ivory `#F4ECDF` serif wordmark, thin rule, tagline.

**🟠 HIGH — Razorpay modal logo missing** ✅ FIXED  
`/images/logo-dark.svg` referenced in `CheckoutForm.tsx` `initRazorpay` does not exist. The payment modal shows no brand logo.  
**Fix:** Export and add `public/images/logo-dark.svg`.  
**Applied:** `public/images/logo-dark.svg` created — ivory serif wordmark on transparent background.

---

## 6. QA Tester

### Problems

**🔴 CRITICAL — Zero test coverage**  
Not a single `.test.ts` / `.spec.ts` / `.test.tsx` file exists anywhere in the project. No Jest, Vitest, or Playwright config exists. There is no way to catch regressions.  
**Fix (immediate):** At minimum, add unit tests for `lib/razorpay.ts` signature verification, `lib/utils.ts` `generateOrderNumber` / `formatPrice`, and the coupon validation logic.  
**Fix (next sprint):** Add Playwright E2E tests for: add-to-cart → checkout → payment success flow.

**🟠 HIGH — `free_shipping` coupon type is silently broken** ✅ FIXED  
`/api/coupons/validate` maps `type === 'free_shipping'` to `discount_type: 'fixed'` with `discount_value: coupon.value`. But `free_shipping` coupons likely have `value = 0`. `CheckoutForm.tsx` applies a fixed discount of `0` — shipping is never zeroed. The coupon validates but does nothing.  
**Fix:** Add `discount_type: 'free_shipping'` to the API response and handle it explicitly in `CheckoutForm` by zeroing `shippingCost`.  
**Applied:** `app/api/coupons/validate/route.ts` returns correct `discount_type: 'free_shipping'` with proper message. `CheckoutForm.tsx` now sets `isFreeShippingCoupon = true` for this type, which feeds into the `freeShipping` boolean that zeroes shipping cost.

**🟠 HIGH — No error boundaries**  
No `error.tsx` files in any route segment. An unhandled render error in any server component crashes the entire page with Next.js's default error UI.  
**Fix:** Add `error.tsx` files for `app/(shop)`, `app/(shop)/shop/[category]`, and `app/(shop)/checkout`.

**🟡 MEDIUM — No testing framework configured**  
**Fix:** Add `vitest` + `@testing-library/react` for unit/component tests. Add `playwright` for E2E.

---

## 7. Automation Tester

### Problems

**🟠 HIGH — No CI/CD pipeline**  
No `.github/workflows/` directory. No automated build, lint, type-check, or test runs on push/PR. Broken code can be committed and deployed without any gate.  
**Fix:** Add `.github/workflows/ci.yml` running: `npm ci` → `tsc --noEmit` → `eslint` → `vitest` on every PR to `main`.

**🟠 HIGH — No automated deployment config**  
No `vercel.json`, no Cloudflare Workers `wrangler.toml` (despite `build:cf` script in `package.json`). Deployment is manual.  
**Fix:** Decide on deployment target (Vercel vs Cloudflare Pages) and add the appropriate config + deploy workflow.

---

## 8. Security Engineer

### Problems

**🔴 CRITICAL — Admin middleware checks cookie presence only, no role verification** ✅ FIXED  
`middleware.ts` redirects to `/admin/login` only if the NextAuth session cookie is absent. It does not verify: (a) the cookie is a valid JWT, (b) the decoded user email is in `admin_users` with `is_active = true`. Any valid Google account can access `/admin` after signing in through NextAuth.  
**Fix:** In middleware or admin layout, decode the session and cross-check `email` against `admin_users` table using the service role client.  
**Applied:** See Backend fix — `middleware.ts` + `lib/auth.ts` + `lib/supabase/admin.ts`.

**🔴 CRITICAL — Item price not validated server-side (price spoofing)**  
Already noted. An attacker inspecting the API can submit arbitrary item prices. This is a direct revenue loss vulnerability.

**🔴 CRITICAL — No Content Security Policy** *(open — Fix DURING Phase 2, Step 2.10)*  
`next.config.mjs` has no security headers. No `Content-Security-Policy`, no `X-Frame-Options`, no `X-Content-Type-Options`, no `Strict-Transport-Security`.  
**Fix:** Add `headers()` to `next.config.mjs`:
```js
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    ],
  }]
}
```

**🔴 CRITICAL — No RLS policies on Supabase**  
All 14 migrations define tables but zero Row Level Security policies. The `createServerClient` uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) which is intentional for server routes — but the browser client (`createClient`) uses the anon key. If any client component queries the DB directly, there is no RLS to restrict data access.  
**Fix:** Enable RLS on all tables. Add policies: `products` / `categories` readable by anon; `orders` / `users` / `user_addresses` readable only by the owning auth user.

**🟠 HIGH — No rate limiting**  
As noted in Backend section. Coupon brute-force, order spam.

**🟡 MEDIUM — `timingSafeEqual` will throw if signature lengths differ** ✅ FIXED  
In `lib/razorpay.ts`, `verifyRazorpayWebhookSignature` and `verifyRazorpayPaymentSignature` call `crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))`. If `b` is not a valid hex string of the same length, this throws a `RangeError` instead of returning `false`.  
**Fix:** Wrap in a try/catch that returns `false` on any error.  
**Applied:** `lib/razorpay.ts` — both functions now check `a.length !== b.length` before calling `timingSafeEqual`, and wrap the full body in try/catch returning `false`.

**🟡 MEDIUM — Coupon code stored in URL query param**  
`CheckoutForm.tsx` reads `coupon` from `useSearchParams()`. Coupon codes appear in browser history, server logs, and referrer headers.  
**Fix:** Store coupon state in sessionStorage or React state instead of URL.

---

## 9. Performance Engineer

### Problems

**🟠 HIGH — PDP makes 5 sequential Supabase queries**  
`getProductData` in the PDP page runs: product, variants, reviews, categoryProducts, related — all sequentially with `await`. A single product page load takes 5× the Supabase latency.  
**Fix:**
```ts
const [product, variants, reviews, categoryProducts, related] = await Promise.all([
  supabase.from('products')...,
  supabase.from('product_variants')...,
  supabase.from('reviews')...,
  // etc.
])
```

**🟠 HIGH — No static generation, no caching**  
All pages are fully dynamic SSR. Every request hits Supabase. At launch with any traffic spike, this will cause latency and Supabase connection exhaustion.  
**Fix:** `generateStaticParams` + `revalidate = 3600` on PDP. `revalidate = 60` on shop/category pages. `unstable_cache` on homepage config.

**🟡 MEDIUM — Full-text search uses `ilike` with no index**  
`/api/search` runs `.or('name.ilike.%q%,fabric.ilike.%q%,description.ilike.%q%')`. This is a full table scan on every keystroke. At 1000+ products, this will be slow and expensive.  
**Fix:** Add a Postgres `tsvector` full-text search column on products, or use Supabase's `textSearch()` with a GIN index.

**🟡 MEDIUM — Sitemap fetches all products in memory**  
`sitemap.ts` queries all active products with no pagination or streaming. At 10,000 SKUs this becomes a memory issue.  
**Fix:** Either paginate the sitemap into multiple files, or use Supabase's streaming API.

**🔵 LOW — `optimizePackageImports` only on swiper**  
`next.config.mjs` has `experimental.optimizePackageImports: ['swiper']`. Radix UI packages should also be listed here.

---

## 10. DevOps / Cloud Engineer

### Problems

**🟠 HIGH — No CI/CD pipeline**  
No automated build or deploy workflow. Any commit to `main` requires manual deploy.  
**Fix:** Add GitHub Actions workflow (see Automation Tester section).

**🟠 HIGH — No health check endpoint**  
No `/api/health` route. Load balancers, uptime monitors, and deployment health checks have nothing to ping.  
**Fix:** Add `app/api/health/route.ts` returning `{ status: 'ok', timestamp: Date.now() }`.

**🟠 HIGH — No env var validation at startup**  
A deployment with a missing `RAZORPAY_KEY_SECRET` will appear healthy until the first order attempt. Silent misconfiguration.  
**Fix:** `lib/env.ts` with Zod schema — throws at import if any required var is missing.

**🟡 MEDIUM — Unclear deployment target**  
`package.json` has `build:cf` using `@cloudflare/next-on-pages` but no `wrangler.toml`. Standard `build` produces a Node.js output incompatible with Cloudflare Workers.  
**Fix:** Decide: Vercel (remove `build:cf`, add `vercel.json`) or Cloudflare Pages (add `wrangler.toml`, test CF-compatible APIs).

**🔵 LOW — No structured logging**  
All server logging is `console.error(...)`. No log levels, no correlation IDs, no structured JSON for aggregation.  
**Fix:** Add `pino` or similar. Prefix logs with `[route][operation]` and include `order_number` / `user_id` as structured fields.

---

## 11. SEO Specialist

### Problems

**🔴 CRITICAL — Default OG image missing** ✅ FIXED  
`/images/og-default.jpg` does not exist. Every page share on social media shows a broken image. This alone can tank click-through rates from social.  
**Fix:** See Brand section. This is the same fix.  
**Applied:** `public/images/og-default.jpg` — 1200×630 branded image now exists.

**🟠 HIGH — Breadcrumb structured data hardcodes `/shop/sarees` for all categories**  
In `app/(shop)/shop/[category]/[slug]/page.tsx` (line 215–216), the breadcrumb JSON-LD hardcodes `item: 'https://thepossah.com/shop/sarees'` as the "Shop" level regardless of the product's actual category. Google sees incorrect breadcrumbs for lehengas, co-ords, etc.  
**Fix:** Replace the hardcoded sarees URL with a dynamic Shop landing page URL or simply use the product's `category_slug`.

**🟡 MEDIUM — Categories missing `updated_at` → sitemap `lastModified` always undefined**  
Already noted in Backend section. Google's sitemap parser ignores entries without `lastModified` for change frequency signals.

**🟡 MEDIUM — No canonical tags on filtered/sorted shop URLs**  
If the shop URL adds query params (`?sort=price&tag=Wedding`), the same page appears under multiple URLs without canonical hints.  
**Fix:** Add `alternates: { canonical: baseUrl }` in each shop page's `generateMetadata`.

**🔵 LOW — `meta_description` fallback for PDP**  
PDP `generateMetadata` uses `product.description` which can be long rich text (not truncated to 155 chars). Meta descriptions over 155 chars get truncated by Google.  
**Fix:** Truncate to 155 chars: `product.description?.slice(0, 155)`.

---

## 12. CRO & Analytics Specialist

### Problems

**🟠 HIGH — No analytics events implemented**  
GA4 ID exists in env template but zero tracking code exists in the app. No way to measure conversion funnel, add-to-cart rate, checkout abandonment, or revenue.  
**Fix (priority order):**  
1. Add GA4 script to `app/layout.tsx`  
2. Fire `add_to_cart` from cart store's `addItem`  
3. Fire `begin_checkout` when CheckoutForm renders  
4. Fire `purchase` event (with value and items) after successful payment verify  

**🟡 MEDIUM — No checkout abandonment recovery**  
Orders are created in DB as `payment_status: 'pending'` before payment. There is no mechanism to identify or follow up on abandoned checkouts.  
**Fix:** Scheduled job (cron) to find `pending` orders older than 2 hours and trigger an abandonment email.

**🟡 MEDIUM — No add-to-cart / wishlist data in analytics**  
Cart and wishlist are 100% localStorage. Even after adding analytics, behavioral signals are invisible.

---

## 13. Digital Marketing Specialist

### Problems

**🟡 MEDIUM — No email capture / newsletter signup**  
No newsletter opt-in component anywhere in the site. No Klaviyo, Mailchimp, or similar integration.  
**Fix:** Add a newsletter signup form (footer or popup) connected to an email platform.

**🟡 MEDIUM — No Meta Pixel or Google Tag Manager**  
No retargeting infrastructure. Cannot run Facebook/Instagram ads with conversion tracking.  
**Fix:** Add GTM container and fire standard ecommerce events.

**🔵 LOW — No referral / affiliate tracking**  
No UTM persistence, no affiliate parameter handling.

---

## 14. Payment Gateway Specialist

### Problems

**🔴 CRITICAL — No stock decrement after payment** ✅ FIXED  
`payment.captured` webhook updates order status but never touches `product_variants.stock_qty`. This is the correct place to decrement (after confirmed payment, not before).  
**Fix:** In the `payment.captured` block of `app/api/payments/webhook/route.ts`, loop through `order.line_items` and decrement each variant's stock using an atomic SQL update. If any decrement fails (stock went negative), log it as an oversell event for manual reconciliation.  
**Applied:** See Backend fix #2 — same `decrement_variant_stock` RPC + webhook `Promise.all`.

**🔴 CRITICAL — No per-item price verification** ✅ FIXED  
Same as Frontend/Backend section. Direct revenue loss vector.  
**Applied:** See Frontend fix #1.

**🟠 HIGH — `free_shipping` coupon type broken in checkout** ✅ FIXED  
`/api/coupons/validate` returns `discount_type: 'fixed'` with `discount_value: coupon.value` for `free_shipping` type coupons. In `CheckoutForm.tsx`, `data.discount_type === 'percent' ? ... : data.discount_value ?? 0`. If `coupon.value` is 0 (as expected for a free-shipping coupon), discount is ₹0. Shipping is not waived.  
**Fix:** Return `discount_type: 'free_shipping'` from the API. Handle in CheckoutForm to set `shippingCost = 0`.  
**Applied:** See QA fix — both API and CheckoutForm fixed.

**🟠 HIGH — No GST calculation**  
`tax` is hardcoded to `0` in every order. As a registered Indian business selling taxable goods (sarees, lehengas are taxable), this is a compliance issue.  
**Fix (deferred if not GST registered yet):** When GST registration is obtained, add `tax_rate` to products and calculate GST server-side.

**🟡 MEDIUM — No stock reservation between add-to-cart and payment**  
Between a user adding an item to cart and completing payment (could be 30 minutes), there is no hold on the stock. Two users can simultaneously buy the last unit; only the webhook decrement (if implemented) would catch the oversell.  
**Fix (phase 2):** Implement a `cart_reservations` table with a TTL (e.g. 30 min). On cart add, reserve. On payment confirm, convert to permanent decrement. On TTL expiry, release.

---

## 15. CRM / Automation Specialist

### Problems

**🟡 MEDIUM — No post-purchase email sequence**  
Only an order confirmation email exists. No:
- Shipping update email (when `fulfillment_status` changes to `shipped`)
- Delivery confirmation email
- Review request email (7 days post-delivery)
- Re-engagement / repurchase nudge (60 days)  
**Fix:** Build email triggers on `fulfillment_status` change (webhook from fulfillment system or admin action).

**🟡 MEDIUM — No abandoned checkout recovery email**  
As noted in CRO section.

**🟡 MEDIUM — No welcome email on signup**  
Google OAuth creates/finds a user but no welcome email is sent.  
**Fix:** In NextAuth `signIn` callback, check if the user is new (no prior login) and send a welcome email via Resend.

**🔵 LOW — No CRM integration**  
Customer data lives only in Supabase. No Klaviyo, HubSpot, or similar for segmentation or lifecycle marketing.

---

## 16. Inventory & Order Management Specialist

### Problems

**🔴 CRITICAL — No stock decrement** ✅ FIXED  
`product_variants.stock_qty` is never decremented anywhere in the codebase. Every order created (paid or pending) leaves the displayed stock unchanged. All stock numbers are permanently wrong after the first sale.  
**Applied:** See Backend fix #2 — atomic `decrement_variant_stock` RPC called in webhook after `payment.captured`.

**🟠 HIGH — No stock reservation**  
See Payment section. Between cart and payment, no stock is held.

**🟠 HIGH — No admin interface for order management**  
Orders are stored in DB but there is no UI to view, update, or fulfill them. Business operations are blind until an admin panel is built.  
**Fix:** This is the #1 admin panel feature to build in Phase 2.

**🟠 HIGH — No low-stock alerts**  
No mechanism to notify when `stock_qty` drops to 0 or below a threshold.  
**Fix:** Supabase Database Webhook on `product_variants` updates → trigger email/Slack alert when `stock_qty <= 2`.

**🟡 MEDIUM — `product_look_links` table unused**  
`001_products.sql` defines `product_look_links` for PDP "Complete the Look" but `CompleteTheLook.tsx` receives category products instead — not curated look links.  
**Fix:** Either populate `product_look_links` and query it in PDP, or drop the table.

---

## 17. Product Manager / Business Analyst

### Problems

**🟠 HIGH — No admin panel exists**  
`middleware.ts` protects `/admin/*` routes but zero admin pages are implemented. There is no way for the business to: view orders, update fulfillment status, manage products, edit homepage content, or moderate reviews. The entire back-office is missing.  
**Fix (Phase 2 priority list):**
1. `/admin/orders` — list + fulfillment status update
2. `/admin/products` — list + toggle active/featured
3. `/admin/homepage` — edit `homepage_config` table
4. `/admin/reviews` — approve/reject moderation queue

**🟠 HIGH — Made-to-measure flow is a stub**  
`app/(shop)/made-to-measure/page.tsx` exists but is presumably a placeholder. There is no measurement-to-order data path — `user_measurements` table exists but nothing connects it to an order or consultation request.  
**Fix (Phase 2):** Build a measurement form that saves to `user_measurements` and creates a consultation request order type.

**🟡 MEDIUM — No order tracking for customers**  
Order confirmation email has a "Track Your Order" CTA linking to `/account` but the account orders page only shows order history. There is no tracking number display, courier link, or shipment status visible to customers.  
**Fix:** Surface `tracking_number` and `courier` fields on `/account/orders` and in the order confirmation email.

**🟡 MEDIUM — `homepage_config` table has no admin UI**  
The CMS table exists with hero slides, collection banner, and new arrival IDs. Updating the homepage requires direct SQL in the Supabase dashboard.

---

## Summary Scorecard

| Role | Critical | High | Medium | Low |
|---|---|---|---|---|
| Frontend Developer | 1 | 2 | 2 | 3 |
| Backend Developer | 2 | 3 | 2 | 1 |
| Full Stack Developer | 0 | 2 | 2 | 1 |
| UI/UX Designer | 0 | 0 | 3 | 1 |
| Brand / Graphic Designer | 1 | 1 | 0 | 0 |
| QA Tester | 1 | 2 | 1 | 0 |
| Automation Tester | 0 | 2 | 0 | 0 |
| Security Engineer | 4 | 1 | 2 | 0 |
| Performance Engineer | 0 | 2 | 2 | 1 |
| DevOps / Cloud Engineer | 0 | 3 | 1 | 1 |
| SEO Specialist | 1 | 1 | 2 | 1 |
| CRO & Analytics | 0 | 1 | 2 | 0 |
| Digital Marketing | 0 | 0 | 2 | 1 |
| Payment Gateway | 2 | 2 | 1 | 0 |
| CRM / Automation | 0 | 0 | 3 | 1 |
| Inventory & Order Mgmt | 1 | 3 | 1 | 0 |
| Product Manager | 0 | 2 | 2 | 0 |
| **TOTAL** | **13** | **27** | **30** | **11** |

---

## Immediate Blockers Before Go-Live (Critical + High priority)

These must be resolved before accepting real money:

1. **🔴 Server-side item price validation** — price spoofing vulnerability
2. **🔴 Stock decrement in payment webhook** — overselling
3. **🔴 Admin role check in middleware** — any Google account can access admin
4. **🔴 OG default image** — broken social share
5. **🔴 No RLS on Supabase tables** — data exposure risk
6. **🔴 Content Security headers** — basic security hygiene
7. **🔴 Zero test coverage** — no regression safety net
8. **🟠 Coupon race condition** — atomic increment
9. **🟠 Rate limiting on orders/coupons** — abuse prevention
10. **🟠 Cart not synced to DB for logged-in users** — customer experience failure
11. **🟠 `free_shipping` coupon broken** — product bug
12. **🟠 CI/CD pipeline** — no deploy safety gate
13. **🟠 Error monitoring (Sentry)** — blind in production
14. **🟠 No caching strategy** — Supabase overload on launch day traffic

---

## Deferred (Not Needed Yet / Phase 2+)

- GST calculation (until GST registration)
- Stock reservation / `cart_reservations` table
- CRM integration (Klaviyo etc.)
- Meta Pixel / GTM (once marketing budget allocated)
- Email sequence automation (welcome, shipping update, review request)
- Full-text search with GIN index (until product catalog > 500 SKUs)
- Newsletter signup
- Referral / affiliate tracking
- Made-to-measure full flow
- Multi-image sitemap

---

## Execution Sequence — Mapped to Build Plan Phases

> Reference: `POSSAH_BUILD_GUIDE.md` + `POSSAH_PROJECT_PLAN.md` Section 12

---

### Fix BEFORE Starting Phase 2

These are not in the original plan but were uncovered by audit. They will silently corrupt the admin data Phase 2 is built on top of. Do these first, before writing a single admin page.

| # | Fix | Where | Why it can't wait | Status |
|---|-----|--------|-------------------|--------|
| 1 | 🔴 **Server-side item price validation** | `app/api/orders/create/route.ts` | Admin order revenue figures will be wrong/spoofed from day one | ✅ Done |
| 2 | 🔴 **Stock decrement after payment** | `app/api/payments/webhook/route.ts` (`payment.captured` block) | Admin "Low Stock" dashboard card (Step 2.2) will always show wrong numbers | ✅ Done |
| 3 | 🔴 **Admin middleware role check** | `middleware.ts` | Any Google account can access every admin page you're about to build | ✅ Done |
| 4 | 🔴 **Add `public/images/og-default.jpg`** | `public/images/` | Social share broken on every page before content even goes live | ✅ Done |
| 5 | 🔴 **Add `public/images/logo-dark.svg`** | `public/images/` | Razorpay payment modal shows no brand logo | ✅ Done |
| 6 | 🟠 **`free_shipping` coupon API fix** | `app/api/coupons/validate/route.ts` | You're building coupon admin in Step 2.7 — fix the validate response first so new coupons actually work | ✅ Done |
| 7 | 🟠 **Coupon usage atomic increment** | `app/api/orders/create/route.ts` | Admin usage count display in Step 2.7 will be inaccurate under any concurrent load | ✅ Done |
| 8 | 🟡 **`timingSafeEqual` crash fix** | `lib/razorpay.ts` | Throws `RangeError` instead of returning `false` on malformed signature — silent crash in payment flow | ✅ Done |

---

### Fix DURING Phase 2 (alongside the relevant admin step)

Bundle each fix with the Step it naturally belongs to. No separate sprints needed.

| Build Plan Step | Fix to bundle in | Notes |
|---|---|---|
| **Step 2.2** — Dashboard home | Add Sentry error monitoring (`@sentry/nextjs`) | You need error visibility the moment real admin actions start running |
| **Step 2.4** — Category management | Add migration `015_categories_updated_at.sql` — `updated_at` column + trigger | You're touching categories already; fixes sitemap `lastModified` for all category URLs |
| **Step 2.5** — Order management | Surface `tracking_number` + `courier` on public `/account/orders` | Admin sets tracking → customer should see it immediately; same PR |
| **Step 2.7** — Coupon management | Fix `free_shipping` coupon in `CheckoutForm.tsx` (zero `shippingCost` when type is `free_shipping`) | Already fixed the API above; finish the client side here |
| **Step 2.10** — Settings | Add security headers to `next.config.mjs` (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`) | 10 lines; natural moment to touch config |
| **Any step** | Fix `createServerClient` generic → `createServerComponentClient<Database>({ cookies })` in `lib/supabase/server.ts` | Low-risk, improves type safety across all admin queries you're about to write |

---

### Phase 3 — Per Build Plan (OAuth · Measurements · Wishlist Sync · SEO · Performance)

These slot cleanly into their existing plan steps. No new sprints — just bundle the audit fix into the step.

| Build Plan Step | Audit fix to bundle in |
|---|---|
| **Step 3.1** — Google OAuth | Migrate `@supabase/auth-helpers-nextjs` → `@supabase/ssr` while touching auth layer |
| **Step 3.3** — Wishlist sync | Also sync cart to DB for logged-in users — same pattern, same PR, `wishlists` table already exists |
| **Step 3.2** — Measurements | Wire up saved address auto-fill at checkout (`user_addresses` table already exists, addresses already saved) |
| **Step 3.1–3.3** — Auth/account work | Add State → `<select>` with Indian states on checkout form |
| **Step 3.6** — SEO implementation | Fix breadcrumb JSON-LD hardcoded `/shop/sarees` for all categories; truncate meta descriptions to 155 chars |
| **Step 3.7** — Performance audit | `Promise.all` on PDP 5 sequential Supabase queries; `generateStaticParams` + `revalidate` on PDP; `revalidate = 60` on shop/category pages; GA4 script + `purchase` event in `CheckoutForm`; `optimizePackageImports` extend to Radix UI packages |

---

### Phase 4 — Launch Hardening (Already in Build Plan Pre-Launch Checklist)

The build plan already lists these. Audit confirmed they're real requirements.

| Item | Plan reference | Audit finding |
|---|---|---|
| **Supabase RLS policies on all tables** | Plan Section 12 explicitly deferred to Phase 4 | Confirmed — zero RLS policies exist in any migration |
| **Rate limiting on orders + coupons endpoints** | Plan Section 12 explicitly deferred to Phase 4 | Confirmed — add `@upstash/ratelimit` on `/api/orders/create` and `/api/coupons/validate` |
| **Env var validation at startup** | Pre-launch environment step | Add `lib/env.ts` with Zod schema — throws clearly if any required var is missing |
| **CI/CD pipeline** | Pre-launch before DNS cutover | Add `.github/workflows/ci.yml`: `npm ci` → `tsc --noEmit` → `eslint` → `vitest` on every PR |
| **Health check endpoint** | Pre-launch monitoring setup | Add `app/api/health/route.ts` → `{ status: 'ok', timestamp }` |
| **Vitest unit tests** | Phase 4 QA step | At minimum: `lib/razorpay.ts` signature verification, `lib/utils.ts`, coupon validation logic |

---

### Items That Remain Fully Deferred (Post-Launch)

These have no dependency on Phase 2, 3, or 4 and should not block launch.

- Stock reservation system (`cart_reservations` table + TTL) — Phase 5 or when oversell becomes a real problem
- Full-text search with Postgres GIN index — not until catalog > 500 SKUs
- GST calculation — when GST registration is obtained
- Email sequences (welcome, shipping update, review request, abandoned cart) — post-launch
- Newsletter signup + CRM (Klaviyo) — when marketing budget allocated
- Meta Pixel + GTM — when running paid ads
- Made-to-measure full measurement-to-order flow — Phase 5
- Referral / affiliate tracking — Phase 5
- `product_look_links` — either populate and query, or drop the table in Phase 4 cleanup
- Sitemap pagination — not until 5,000+ products
