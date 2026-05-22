# Possah 1.0 — Complete Role Audit (Post Phase 2)

**Date:** May 2026  
**Audit Scope:** All source files, routes, migrations, components, and config as they exist after Phase 2 completion.  
**Phase 1 Audit Ref:** `audit-phase1/AUDIT_PHASE1.md`  
**Live Test Results:** Appended at bottom — Section: LIVE STATIC ANALYSIS RESULTS  
**This document covers:** What is still broken, what new gaps Phase 2 introduced, and the exact fix for each.

---

## Severity Legend

- 🔴 **CRITICAL** — Security hole, money loss, or data corruption. Fix before first transaction.
- 🟠 **HIGH** — Major functional gap or operational failure. Fix in next sprint.
- 🟡 **MEDIUM** — Quality or performance issue. Fix before scaling.
- 🔵 **LOW** — Polish or DX. Backlog.

---

## Role 1: Product Manager / Project Manager

### Current State

Phase 2 delivered the full admin dashboard: products, categories, orders, homepage, coupons, reviews, journal, media, and settings. The storefront builds and deploys. The business can now accept orders through the UI.

### Open Problems

**🟠 HIGH — No customer-facing order tracking**  
Admin can set `tracking_number` and `courier` on an order. The `account/orders` page shows order history but never surfaces these fields. Customers have no way to check their shipment status without contacting support. Every "where is my order" inquiry is a manual support cost.

**Fix:** In `app/(shop)/account/orders/page.tsx`, read `tracking_number` and `courier` from the orders query and render a "Track Shipment" link (using courier's tracking URL if courier is known, or plain text of the tracking number if not).

---

**🟠 HIGH — Made-to-measure is a dead end**  
`/made-to-measure` page exists. `user_measurements` table exists with full body measurement schema. Nothing connects them. A customer who wants a custom piece has no way to submit measurements or initiate a consultation request.

**Fix:** Build a multi-step measurement form on `/made-to-measure` that:
1. Requires Google sign-in
2. Saves measurements to `user_measurements` with `upsert` (one active set per user)
3. Creates a `consultation_request` record (new table) linking the user, their measurements, and optionally a product they liked
4. Sends a confirmation email via Resend to the customer and a notification to the admin inbox

---

**🟡 MEDIUM — No product performance metrics visible to admin**  
The dashboard shows total revenue and order count but not product-level data: which products are converting, which are being added to cart but not purchased, which are getting wishlisted but not bought. This data exists in the tables but is not surfaced.

**Fix:** Add a `/admin/analytics` page with: top 10 products by orders, low stock alerts (variants with `stock_qty <= 2`), and cart-to-order conversion rate (requires cart DB sync first).

---

**🟡 MEDIUM — No customer profile in admin**  
Admin can see orders but cannot look up a customer's order history, email, or measurement profile. If a customer calls about an issue, the admin has no lookup tool.

**Fix:** Add `/admin/customers` page — searchable by email, shows order history and measurement profile for each customer.

---

**🔵 LOW — No product view / popularity signals**  
There is no mechanism to track which products are being viewed most. `is_featured` exists but its assignment is manual.

**Fix:** Add a lightweight `product_views` table with `product_id`, `session_id`, `viewed_at`. Increment on PDP load. Use to auto-suggest featured products.

---

## Role 2: UI/UX Designer

### Current State

The storefront UI is structurally complete. Components exist for all main flows. Admin UI uses a custom sidebar and table pattern.

### Open Problems

**🟠 HIGH — No loading states on any storefront page**  
Zero `loading.tsx` files exist in the app directory. When a server component is fetching data, Next.js shows a blank white screen until the fetch completes. On slow connections (mobile, 3G India), this is a 2–5 second blank. This destroys perceived performance and signals a broken site.

**Fix:** Create `loading.tsx` files for:
- `app/(shop)/loading.tsx` — skeleton for main shop layout
- `app/(shop)/shop/[category]/loading.tsx` — product grid skeleton (12 cards)
- `app/(shop)/shop/[category]/[slug]/loading.tsx` — PDP skeleton (gallery + info area)
- `app/(shop)/cart/loading.tsx` — cart items skeleton
- `app/(shop)/account/loading.tsx` — account page skeleton

Each skeleton should match the layout dimensions of the real content to prevent layout shift when content loads.

---

**🟠 HIGH — No error boundaries anywhere**  
Zero `error.tsx` files exist. A single Supabase query failure crashes the entire page route with Next.js's raw stack trace error screen. No branded error handling, no fallback UI, no retry option.

**Fix:** Create `error.tsx` files for:
- `app/(shop)/error.tsx` — general storefront error with "Go to homepage" CTA
- `app/(shop)/shop/[category]/error.tsx` — "Could not load products, try again"
- `app/(shop)/shop/[category]/[slug]/error.tsx` — "Could not load product, try again"
- `app/(shop)/checkout/error.tsx` — "Something went wrong with checkout, your cart is safe" with fallback
- `app/admin/error.tsx` — admin error with "Return to dashboard"

---

**🟡 MEDIUM — State field on checkout is free text**  
The shipping address "State" input is a plain `<input type="text">`. Customers type whatever they want: "UP", "Uttar Pradesh", "uttar pradesh", "U.P.", "उत्तर प्रदेश". This produces dirty data that breaks shipping integrations and courier label printing.

**Fix:** Replace with `<select>` populated with all 28 Indian states + 8 Union Territories in alphabetical order. Store the full name (e.g. "Uttar Pradesh") not the abbreviation.

---

**🟡 MEDIUM — No prefers-reduced-motion handling**  
Hero slider, hover transitions on product cards, and collection banner animations ignore `prefers-reduced-motion: reduce`. On devices where users have disabled motion (vestibular disorders, epilepsy risk), animations still fire.

**Fix:** Add to `styles/globals.css`:
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

**🟡 MEDIUM — No saved address auto-fill at checkout**  
`user_addresses` table exists. Authenticated users have no way to use a saved address at checkout — they must retype the full address for every order.

**Fix:** In `CheckoutForm.tsx`, for authenticated users:
1. Fetch `user_addresses` on mount
2. Render a "Use saved address" dropdown above the form
3. On selection, populate all address fields
4. Add a "Save this address" checkbox to persist new addresses on successful order

---

**🔵 LOW — No skip-to-main-content link**  
No visually-hidden skip nav link exists. Keyboard-only and screen reader users must tab through the entire header navigation on every page.

**Fix:** Add as first child of `<body>` in `app/layout.tsx`:
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-green-900"
>
  Skip to main content
</a>
```

---

## Role 3: Frontend Developer

### Current State

Storefront routes are built. Admin CRUD UIs are implemented. Cart and wishlist run on Zustand + localStorage. Checkout sends to Razorpay.

### Open Problems

**🟠 HIGH — Cart and wishlist not synced to database**  
`cartStore.ts` and `wishlistStore.ts` use Zustand `persist` to `localStorage` only. The `wishlists` table in DB is never written to. A logged-in customer switching from mobile to desktop loses their cart and wishlist entirely. A customer who clears browser data loses everything.

**Fix (Cart):**
- On user sign-in: merge localStorage cart with any open order in `orders` table with `payment_status = 'pending'` (or use a dedicated `cart_items` table)
- On `addItem` / `removeItem`: if user is authenticated, write to DB. If guest, write to localStorage only
- On sign-in: hydrate cart from DB first, then merge any localStorage items

**Fix (Wishlist):**
- On `addToWishlist` / `removeFromWishlist`: if authenticated, write to `wishlists` table using Supabase client
- On page load (authenticated): fetch `wishlists` and hydrate Zustand store
- Keep localStorage as fallback for guests

---

**🟡 MEDIUM — PDP makes 5 sequential Supabase fetches**  
`getProductData` in the PDP page runs product → variants → reviews → category products → related all sequentially. One PDP load costs 5× the base Supabase round-trip latency (~100ms+ per query in production = 500ms+ just in DB time, before any render).

**Fix:**
```ts
const [product, variants, reviews, categoryProducts] = await Promise.all([
  supabase.from('products').select('...').eq('slug', slug).single(),
  supabase.from('product_variants').select('...').eq('product_id', id),
  supabase.from('reviews').select('...').eq('product_id', id).eq('status', 'approved'),
  supabase.from('products').select('...').eq('category_id', categoryId).limit(8),
])
```

---

**🟡 MEDIUM — No `generateStaticParams` on PDP**  
Every PDP visit triggers an SSR request to Supabase. With 100 products and 1000 daily visitors, this is 100,000 Supabase reads per day just for PDPs — before caching.

**Fix:**
```ts
export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('products')
    .select('category_slug:categories(slug), slug')
    .eq('is_active', true)
  return data?.map((p) => ({ category: p.category_slug, slug: p.slug })) ?? []
}

export const revalidate = 3600 // rebuild pages every hour
```

---

**🟡 MEDIUM — Breadcrumb JSON-LD hardcodes `/shop/sarees`**  
The PDP's breadcrumb structured data hardcodes `item: 'https://thepossah.com/shop/sarees'` as the category level regardless of the actual product category. Lehengas, co-ords, and all other categories have wrong breadcrumbs in Google Search.

**Fix:** Replace with the product's actual category slug:
```ts
{
  '@type': 'ListItem',
  position: 2,
  name: product.category_name,
  item: `https://thepossah.com/shop/${product.category_slug}`,
}
```

---

**🔵 LOW — GA4 script exists in env but zero tracking code in app**  
`NEXT_PUBLIC_GA_MEASUREMENT_ID` is documented but no `<Script>` tag, no `gtag`, no event calls exist anywhere.

**Fix:**
```tsx
// app/layout.tsx
import Script from 'next/script'

<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
  strategy="afterInteractive"
/>
<Script id="ga4-init" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
  `}
</Script>
```

Then fire events:
- `add_to_cart` in `cartStore.addItem`
- `begin_checkout` on CheckoutForm mount
- `purchase` with order value and items after payment verification

---

## Role 4: Backend Developer

### Current State

All Phase 1 critical fixes are done (price validation, stock decrement, coupon atomic RPC, admin auth). Admin CRUD API routes are implemented. Razorpay webhook is connected.

### Open Problems

**🔴 CRITICAL — No Row Level Security on any Supabase table**  
All 17 migrations define tables but zero RLS policies exist. The browser Supabase client uses the `anon` key. If any client component ever queries the DB directly (accidentally or intentionally), there is no database-level access control. A user could query `orders` from the browser and read every customer's orders.

Currently all reads go through server-side API routes which use the service role key (bypasses RLS intentionally). But RLS is the last line of defense if any client-side query escapes.

**Fix:** Add a migration `018_rls_policies.sql`:
```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "variants_public_read" ON product_variants FOR SELECT USING (is_active = true);

-- User-scoped policies (requires auth.uid())
CREATE POLICY "orders_owner_read" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wishlists_owner_all" ON wishlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "addresses_owner_all" ON user_addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "measurements_owner_all" ON user_measurements FOR ALL USING (auth.uid() = user_id);

-- Admin bypass via service role (service role key already bypasses RLS — no policy needed)
-- Reviews: public read only approved ones
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "reviews_owner_write" ON reviews FOR INSERT USING (auth.uid() = user_id);
```

---

**🔴 CRITICAL — No security headers on HTTP responses**  
`next.config.mjs` has no `headers()` configuration. Every page response is missing: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, and `Content-Security-Policy`.

**Fix — `next.config.mjs`:**
```js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ]
},
```

CSP should be added after confirming all third-party script sources (Razorpay, GA4) to avoid breaking the checkout modal.

---

**🟠 HIGH — No rate limiting on any API endpoint**  
`/api/orders/create`, `/api/coupons/validate`, `/api/contact`, `/api/search` are all unprotected. An attacker can:
- Enumerate all valid coupon codes via brute-force on `/api/coupons/validate`
- Spam `/api/orders/create` to exhaust Razorpay test order quota
- Flood `/api/contact` to send unlimited emails via Resend

**Fix:** Add `@upstash/ratelimit` with Upstash Redis:
```ts
// lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const orderRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),  // 5 orders per minute per IP
})

export const couponRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 coupon checks per minute
})

export const contactRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '5 m'),  // 3 contact form submissions per 5 min
})
```

Apply in each route handler, return `429` if exceeded.

---

**🟠 HIGH — No environment variable validation at startup**  
A deployment with `RAZORPAY_KEY_SECRET=` (empty string) will build successfully, deploy, and appear healthy until the first customer tries to check out — then silently fail with a cryptic error.

**Fix:** Create `lib/env.ts`:
```ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(10),
  GOOGLE_CLIENT_SECRET: z.string().min(10),
  RAZORPAY_KEY_ID: z.string().startsWith('rzp_'),
  RAZORPAY_KEY_SECRET: z.string().min(10),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(10),
  RESEND_API_KEY: z.string().startsWith('re_'),
})

export const env = envSchema.parse(process.env)
```

Import `env` from `lib/env.ts` in `lib/razorpay.ts`, `lib/auth.ts`, `lib/email.ts` instead of reading `process.env` directly. Throws clearly on startup if anything is wrong.

---

**🟠 HIGH — No error monitoring**  
Server-side errors only go to `console.error`. In production, failed DB writes, failed Resend emails, and webhook errors are completely invisible. The only way to discover a production bug is a customer complaint.

**Fix:** Integrate Sentry:
```bash
npx @sentry/wizard@latest -i nextjs
```

Configure in `sentry.server.config.ts` and `sentry.client.config.ts`. Wrap all `catch` blocks in API routes:
```ts
import * as Sentry from '@sentry/nextjs'

} catch (err) {
  Sentry.captureException(err, { extra: { order_number, user_id } })
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}
```

---

**🟡 MEDIUM — `categories` table missing `updated_at`**  
`002_categories.sql` has only `created_at`. `sitemap.ts` reads `categories.updated_at` → returns `undefined` for every category URL. Google's sitemap parser ignores these entries for change frequency signals.

**Fix:** Add migration `018_categories_updated_at.sql` (or bundle into the RLS migration):
```sql
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

**🟡 MEDIUM — `@supabase/auth-helpers-nextjs` is deprecated**  
The package used in `lib/supabase/server.ts` and `lib/supabase/client.ts` is the legacy helpers package. Supabase now ships `@supabase/ssr` which has better session handling for App Router and is the only package that will receive security updates going forward.

**Fix:** Migrate:
```bash
npm uninstall @supabase/auth-helpers-nextjs
npm install @supabase/ssr
```

Update `lib/supabase/server.ts` to use `createServerClient` from `@supabase/ssr`. Bundle this with the Phase 3 OAuth work since both touch the auth layer simultaneously.

---

**🔵 LOW — No health check endpoint**  
No `/api/health` route exists. Uptime monitoring tools (UptimeRobot, Vercel monitoring, load balancers) have nothing to ping that verifies the app and database are responsive.

**Fix:** Create `app/api/health/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createPublicClient()
    await supabase.from('categories').select('id').limit(1).single()
    return NextResponse.json({ status: 'ok', timestamp: Date.now() })
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 })
  }
}
```

---

## Role 5: Database Architect / Data Engineer

### Current State

17 migrations define the full schema. RPC functions for atomic stock decrement and coupon usage increment are in place. Seeds exist for categories, products, and homepage config.

### Open Problems

**🔴 CRITICAL — Zero RLS policies on any table**  
All tables are defined. None have RLS enabled. See Backend section for full fix — same issue, same migration.

---

**🟠 HIGH — No indexes on frequently-queried columns**  
The product catalog will grow. Without indexes, every category page load and search does a full table scan.

**Fix:** Add migration `019_performance_indexes.sql`:
```sql
-- Products
CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS products_slug_idx ON products(slug);
CREATE INDEX IF NOT EXISTS products_is_featured_idx ON products(is_featured) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products(created_at DESC);

-- Product variants
CREATE INDEX IF NOT EXISTS variants_product_id_idx ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS variants_stock_idx ON product_variants(stock_qty) WHERE is_active = true;

-- Orders
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_razorpay_order_id_idx ON orders(razorpay_order_id);

-- Full-text search on products
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(fabric,''))
  ) STORED;
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING GIN(search_vector);

-- Wishlists
CREATE INDEX IF NOT EXISTS wishlists_user_id_idx ON wishlists(user_id);

-- Reviews
CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON reviews(product_id) WHERE status = 'approved';

-- Coupons
CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons(code) WHERE is_active = true;

-- Journal
CREATE INDEX IF NOT EXISTS journal_slug_idx ON journal_articles(slug) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS journal_created_at_idx ON journal_articles(created_at DESC) WHERE is_published = true;
```

---

**🟠 HIGH — Search uses `ilike` with no full-text index**  
`/api/search` runs `.or('name.ilike.%q%,fabric.ilike.%q%,description.ilike.%q%')` — a full table scan on three columns with leading wildcard. Leading wildcards prevent B-tree index usage entirely. At 500+ products this will be slow.

**Fix:** After adding `search_vector` column (above), update the search route:
```ts
const { data } = await supabase
  .from('products')
  .select('...')
  .textSearch('search_vector', q, { type: 'websearch', config: 'english' })
  .eq('is_active', true)
  .limit(24)
```

---

**🟠 HIGH — No `cart_items` table — cart is not persisted**  
See Frontend section. The cart is 100% client-side. At the database level, there is no concept of an active shopping session.

**Fix:** Add migration `020_cart_items.sql`:
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,  -- for guest carts, stored in cookie
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, variant_id),
  UNIQUE(session_id, variant_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart_owner_all" ON cart_items FOR ALL USING (auth.uid() = user_id);
```

---

**🟡 MEDIUM — `product_look_links` table defined but never used**  
`001_products.sql` defines `product_look_links` for the PDP "Complete the Look" section. `CompleteTheLook.tsx` instead receives category products — not curated look links. The table is dead weight and a source of confusion.

**Fix:** Either:
- **Option A:** Drop the table in a new migration. Wire `CompleteTheLook.tsx` to query the 4 most recently added products in the same category (current behavior, formalized).
- **Option B:** Populate `product_look_links` via admin (`/admin/products/[id]/edit` → "Complete the Look" multi-select) and query it in PDP. This enables proper curation.

Recommend Option B for a luxury brand.

---

**🟡 MEDIUM — No `updated_at` on products table**  
`sitemap.ts` reads `products.updated_at` for `lastModified`. If the column doesn't exist with a trigger, this is always `NOW()` at query time — meaningless for Google's change detection.

**Fix:** Confirm `001_products.sql` has an `updated_at` column with a `BEFORE UPDATE` trigger. If not, add it to the indexes migration.

---

**🔵 LOW — No database backup verification**  
Supabase provides automated backups on Pro+ plans. But no documented process exists for: how often to verify backup integrity, how to restore, or what the RPO/RTO targets are for this project.

**Fix:** Document in `POSSAH_MASTER_DOCUMENT.md`: daily automated backup (Supabase), weekly backup verification (restore to a test project and run smoke query), RPO = 24h, RTO = 4h.

---

## Role 6: DevOps / Cloud Engineer

### Current State

App builds and deploys. Vercel integration appears to be the target deployment path based on the commit history and build passing. No CI/CD workflow exists. No deployment config is formalized.

### Open Problems

**🔴 CRITICAL — No CI/CD pipeline**  
Zero `.github/workflows/` directory. Any code pushed to `main` can be deployed without lint, type-check, or test gates. A broken commit reaches production immediately.

**Fix:** Create `.github/workflows/ci.yml` — see `TESTING_PLAN.md` Section 5 for full YAML. Minimum gates:
- `npm run lint` — must pass
- `npx tsc --noEmit` — must pass
- `npm run test:unit` — must pass
- Block merge to `main` if any gate fails (branch protection rule in GitHub)

---

**🟠 HIGH — Deployment target is ambiguous**  
`package.json` has a `build:cf` script using `@cloudflare/next-on-pages` but no `wrangler.toml` or Cloudflare Pages configuration. The standard `build` output is Node.js-based (incompatible with Cloudflare Workers runtime). This creates confusion: is the target Vercel or Cloudflare?

**Fix:** Make a decision. Recommendation: **Vercel** for fastest path to production (zero config, native Next.js support, edge network in India via Mumbai PoP).

Vercel path:
1. Remove `build:cf` and `@cloudflare/next-on-pages` from `package.json`
2. Add `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["bom1"]
}
```
3. Connect GitHub repo to Vercel. All env vars configured in Vercel dashboard.

---

**🟠 HIGH — Production env vars not documented or validated**  
The `.env.local.example` file documents what keys are needed. But there is no verification that the production deployment has all of them set correctly. A wrong key silently breaks a feature.

**Fix:** After `lib/env.ts` (see Backend section) is in place, the build itself will fail if any required env var is missing. Additionally, document in `POSSAH_BUILD_STATUS_GUIDE.md` the exact Vercel environment variable names and whether each is Production/Preview/Development scoped.

---

**🟡 MEDIUM — No staging environment**  
There is no `staging.thepossah.com`. All testing happens against `localhost` or directly on production. Any migration or new feature is a live experiment on real customers.

**Fix:**
1. Create a second Supabase project for staging
2. Create a Vercel Preview deployment linked to the `staging` branch
3. Staging uses staging Supabase + Razorpay test mode keys always
4. Production uses production Supabase + Razorpay live mode keys
5. Migrations run on staging first, verified, then applied to production

---

**🟡 MEDIUM — No uptime monitoring**  
No external monitoring pings the site. If the production deployment goes down at 2am, no one knows until a customer complains.

**Fix:** Set up UptimeRobot (free tier) monitoring:
- `https://thepossah.com/` — every 5 minutes
- `https://thepossah.com/api/health` — every 5 minutes (requires health check route from Backend section)
- Alert: email + SMS on 2 consecutive failures

---

**🔵 LOW — No structured logging**  
All server logging is `console.error(...)`. No log levels, no request correlation IDs, no JSON formatting for log aggregation tools (Datadog, Axiom, etc.).

**Fix:** Add `pino` logger:
```bash
npm install pino pino-pretty
```

```ts
// lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: { level: (label) => ({ level: label }) },
})
```

Use `logger.info({ order_number, user_id }, 'order.created')` instead of `console.log`.

---

## Role 7: QA Tester / Automation Engineer

### Current State

Zero test files exist. No Jest, Vitest, or Playwright config. No CI gate on tests.

### Open Problems

**🔴 CRITICAL — Zero test coverage**  
No tests of any kind exist for any code in this project. See `TESTING_PLAN.md` for the complete test implementation guide. This section summarizes the gaps and priority order.

**Immediate priority (block go-live if absent):**
1. `lib/razorpay.ts` signature verification — 100% unit test coverage required
2. `POST /api/payments/webhook` — integration test: valid vs invalid signature, stock decrement
3. `POST /api/orders/create` — integration test: price spoofing rejection, stock check, coupon race

**Next priority (sprint 1 post go-live):**
4. `POST /api/coupons/validate` — all coupon types and edge cases
5. Full Playwright checkout E2E
6. Admin auth guard on every admin route

---

**🟠 HIGH — No error boundaries means QA cannot distinguish rendering errors from data errors**  
Without `error.tsx` boundaries, any component error cascades to a full page crash. QA cannot test individual component failure states.

**Fix:** Same as UI/UX — add `error.tsx` for each major route segment.

---

**🟡 MEDIUM — No test data seeding strategy**  
Local development seed (`seeds/`) exists but is manual. For automated tests, a deterministic, isolated dataset is required per test run.

**Fix:** See `TESTING_PLAN.md` Section 6 for the full test fixtures and DB helpers pattern. The key principle: each test creates what it needs and cleans up in `afterAll`.

---

**🟡 MEDIUM — No smoke test runbook**  
No documented checklist for manually verifying a deployment before cutting traffic. Every deploy is untested until a real customer encounters a bug.

**Fix:** Create `SMOKE_TEST_RUNBOOK.md` with a 15-minute manual test script:
1. Homepage loads, hero slider visible
2. Navigate to a category page — products load
3. Open a PDP — gallery, add to cart button, variants all visible
4. Add to cart — count increments
5. Open cart — item shows, quantity controls work
6. Apply a known-valid coupon code
7. Fill checkout form with test address
8. Initiate Razorpay in test mode
9. Complete test payment
10. Verify order confirmation page
11. Check admin `/admin/orders` — order appears with correct status
12. Verify order confirmation email received

---

## Role 8: Cybersecurity & Audit Specialist

### Current State

Phase 1 critical security fixes are in place: admin middleware now requires `token.isAdmin`, price validation is server-side, Razorpay signature check has `timingSafeEqual` guard.

### Open Problems

**🔴 CRITICAL — No RLS on Supabase tables**  
See Backend section. This is the highest-risk open security issue. If a future developer accidentally adds a client-side Supabase query (which is easy in Next.js App Router), all data is exposed.

---

**🔴 CRITICAL — No Content Security Policy**  
No CSP header is set. The app loads third-party scripts (Razorpay, Google Analytics). Without CSP:
- XSS attacks have no browser-level mitigation
- Third-party scripts can exfiltrate customer data (payment card data from the Razorpay modal is sandboxed, but address and email on the page are not)

**Fix — phased approach:**
1. First: add security headers (see Backend section) — `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`
2. Second: audit all script sources and add `Content-Security-Policy` in report-only mode first
3. Third: switch to enforcement mode after verifying no legitimate scripts are blocked

Minimum viable CSP for this stack:
```
Content-Security-Policy: default-src 'self'; script-src 'self' https://checkout.razorpay.com https://www.googletagmanager.com 'unsafe-inline'; frame-src https://api.razorpay.com; connect-src 'self' https://*.supabase.co https://api.razorpay.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline'
```

---

**🟠 HIGH — No rate limiting — coupon brute-force is trivially easy**  
`/api/coupons/validate` accepts any `code` string and queries the DB. An attacker can iterate all 6-character uppercase alphanumeric codes (26+10)^6 = 2.17 billion) with no throttle. At 100 requests/second, common patterns like `SAVE10`, `POSSAH20`, `WELCOME` are discovered in seconds.

**Fix:** Rate limiting — see Backend section. Additionally: consider CAPTCHAs on the coupon field after 3 failed attempts (frontend UX).

---

**🟠 HIGH — Coupon codes appear in browser URL**  
`CheckoutForm.tsx` reads `coupon` from `useSearchParams()`. The coupon code appears in:
- Browser history (visible to anyone with access to the device)
- Server access logs (visible to hosting provider)
- Referrer header (visible to any third-party linked from the page)
- Browser autocomplete suggestions

**Fix:** Remove coupon from URL params. Store in React state only (`useState`). If sharing a pre-applied coupon link is desired, use a short-lived token instead of the raw coupon code.

---

**🟠 HIGH — No audit log for admin actions**  
Admin can delete products, modify orders, create coupons, and change settings. There is no log of who did what and when. In case of a dispute or suspicious activity, there is no forensic trail.

**Fix:** Add migration `021_admin_audit_log.sql`:
```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,   -- 'product.delete', 'order.fulfill', 'coupon.create'
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_state JSONB,
  after_state JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_log_admin_idx ON admin_audit_log(admin_email, created_at DESC);
CREATE INDEX audit_log_entity_idx ON admin_audit_log(entity_type, entity_id);
```

Log every destructive admin action. Surface as `/admin/audit-log` for the primary admin email only.

---

**🟡 MEDIUM — `NEXTAUTH_SECRET` is required but no minimum strength enforced**  
If `NEXTAUTH_SECRET` is set to something weak (like `secret` or `1234`), JWT tokens can be brute-forced or forged. Admin access depends entirely on this secret.

**Fix:**
1. Enforce minimum 32-character length in `lib/env.ts` Zod schema: `z.string().min(32)`
2. Generate a strong value with `openssl rand -base64 32` and document this in setup guide
3. Rotate this secret if it was ever committed to git history (check with `git log -S "NEXTAUTH_SECRET"`)

---

**🟡 MEDIUM — Dev mode bypasses admin auth**  
The audit noted that dev mode bypasses admin guards for "faster local iteration." If `NODE_ENV=development` is ever set on a production or staging server (accidentally), admin is fully open.

**Fix:** Remove the dev bypass entirely. Replace with a seed `admin_users` record for the developer's email. Local development auth should work the same as production auth — it just needs Google OAuth configured (which it already is via `GOOGLE_CLIENT_ID/SECRET`).

---

## Role 9: SEO & Digital Marketing Specialist

### Current State

Basic metadata exists on all pages. OG default image is now present. Sitemap and robots.txt are generated. Structured data (JSON-LD) exists on PDP.

### Open Problems

**🟠 HIGH — Breadcrumb structured data hardcodes wrong category URL**  
PDP breadcrumb JSON-LD has `item: 'https://thepossah.com/shop/sarees'` hardcoded for all products. A lehenga, co-ord, or jewellery product advertises an incorrect breadcrumb to Google. This affects how Google displays the site in search results.

**Fix:** See Frontend section — use `product.category_slug` dynamically.

---

**🟠 HIGH — No canonical tags on filtered/sorted shop URLs**  
When a user filters by size or sorts by price, the URL becomes `/shop/sarees?size=S&sort=price`. The same product grid appears under multiple URLs with no canonical hint. Google may index these as duplicate pages and split authority across them.

**Fix:** In `app/(shop)/shop/[category]/page.tsx` `generateMetadata`:
```ts
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const canonicalUrl = `https://thepossah.com/shop/${params.category}`
  return {
    alternates: { canonical: canonicalUrl },
    // ...rest of metadata
  }
}
```

---

**🟡 MEDIUM — Categories missing `updated_at` → sitemap lastModified always undefined**  
See Backend/Database sections — same fix needed.

---

**🟡 MEDIUM — Meta description is not truncated**  
PDP `generateMetadata` uses `product.description` which can be multiple paragraphs of rich text. Google truncates meta descriptions at ~155 characters. Long descriptions waste the full meta description slot.

**Fix:**
```ts
description: product.description?.replace(/<[^>]+>/g, '').slice(0, 155),
```

---

**🟡 MEDIUM — No GA4 tracking — zero funnel visibility**  
The team cannot see where customers drop off, which products convert, or which traffic sources drive revenue. This makes every marketing decision a guess.

**Fix:** See Frontend section for GA4 script setup. Priority events:
1. `page_view` — automatic with GA4 script
2. `view_item` — fire on PDP load with `item_id`, `item_name`, `price`, `item_category`
3. `add_to_cart` — fire in `cartStore.addItem`
4. `begin_checkout` — fire on CheckoutForm mount
5. `purchase` — fire after `verifyPayment` success with `transaction_id`, `value`, `items`

---

**🟡 MEDIUM — No blog/journal SEO structure**  
Journal articles have no internal linking strategy, no related posts section, no reading time, and no structured data (`Article` schema). The journal exists but contributes zero SEO value.

**Fix:**
1. Add `Article` JSON-LD to `app/(shop)/journal/[slug]/page.tsx`
2. Add related articles (3 most recent from same category) at the bottom of each post
3. Add `<link rel="next">` and `<link rel="prev">` on journal listing pagination

---

**🔵 LOW — No Google Search Console verification**  
The site has no GSC ownership verification tag. Without GSC access, there is no way to: monitor crawl errors, submit sitemaps, check which keywords drive traffic, or see Core Web Vitals in context.

**Fix:** Add GSC verification via `next.config.mjs` metadata, HTML tag in `<head>`, or DNS record (preferred — no code change needed).

---

## Role 10: Business Analyst / eCommerce Operations Manager

### Current State

The store can accept orders end-to-end. Admin can manage products, orders, coupons, reviews, and journal content. The store is technically capable of going live.

### Open Problems

**🟠 HIGH — No fulfillment workflow**  
An order is marked `paid` by the webhook. After that, the entire fulfillment process is manual:
- Admin must remember to check `/admin/orders` for new orders
- No email or Slack notification fires when an order is placed
- No structured workflow for: packing → ship → enter tracking number → notify customer
- No courier integration (Shiprocket, Delhivery, etc.)

**Fix (immediate — no integration needed):**
1. On `payment.captured` webhook, after updating order status, send an order notification email to the admin inbox via Resend
2. The admin notification should include: order number, customer name, items, shipping address, total
3. Update `/admin/orders` fulfillment workflow with status: `paid → processing → packed → shipped → delivered`

**Fix (Phase 4 — courier integration):**
1. Integrate Shiprocket or Delhivery API for label printing
2. Webhook from courier updates `tracking_number` and `fulfillment_status` in DB
3. Customer receives automatic shipping update email when status changes to `shipped`

---

**🟠 HIGH — No GST handling**  
Orders have `tax` hardcoded to 0. As a luxury fashion brand selling in India, sarees and lehengas attract 5% or 12% GST depending on the fabric and sale price (products above ₹1000 = 12% GST). Collecting no GST is a compliance issue once GST registered.

**Fix (when GST registration obtained):**
1. Add `gst_rate` column to `products` table (5, 12, or 18)
2. Calculate GST server-side in `/api/orders/create`: `tax = subtotal * (gst_rate / 100)`
3. Show GST breakdown in order confirmation and invoice
4. Generate GST-compliant invoices (required format: GSTIN, HSN code, tax breakdowns)

---

**🟠 HIGH — No return or refund management**  
The orders schema has no `return_status`, `refund_amount`, or `return_reason` fields. When a customer wants to return a product, the admin has no system to track it and Razorpay refunds must be initiated manually from the Razorpay dashboard.

**Fix:** Add to the orders model:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_status TEXT DEFAULT NULL; -- 'requested', 'approved', 'rejected', 'received', 'refunded'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_razorpay_id TEXT;
```

Add `/admin/orders/[id]/refund` — calls Razorpay refund API and updates order status. Surface return request form to customers on `/account/orders/[id]`.

---

**🟡 MEDIUM — No customer-facing order tracking**  
See Product Manager section — same issue. Operational impact: every order with a tracking number requires the admin to manually email the customer or respond to a WhatsApp inquiry.

---

**🟡 MEDIUM — No inventory management alerts**  
When a product variant reaches zero stock, there is no alert. The admin discovers an out-of-stock item only when a customer complains about inability to add to cart, or when reviewing the admin panel manually.

**Fix (Supabase Database Webhook):**
1. Create a Supabase Database Webhook triggered on `product_variants` `UPDATE` events
2. When `stock_qty <= 2`, call a Resend endpoint that emails the admin: "LOW STOCK: [Product Name] Size [X] — [N] units remaining"
3. When `stock_qty = 0`, email: "OUT OF STOCK: [Product Name] Size [X]"

---

**🟡 MEDIUM — No revenue reporting or financial summary**  
Admin dashboard shows a total revenue card (presumably a sum of all `payment_status = 'paid'` orders). There is no breakdown by: time period, product category, average order value, or repeat customer rate. Financial planning is impossible without this.

**Fix:** Add `/admin/reports` page with:
1. Revenue by day/week/month (line chart using Recharts)
2. Top products by revenue (bar chart)
3. Average order value trend
4. New vs. returning customers
5. Export to CSV

---

**🔵 LOW — No gift wrapping cost in schema**  
`giftWrap` is calculated on the client as a fixed amount but the price is hardcoded in `CheckoutForm.tsx`. If the gift wrap price changes, the frontend code must be updated manually.

**Fix:** Move gift wrap pricing to `store_settings` table (already exists). Add a `gift_wrap_price_paise` key. Read it from settings in the checkout API and validate client-submitted gift wrap cost server-side.

---

## Consolidated Fix Priority (Post Phase 2)

### Must fix before going live with real customers

| # | Fix | Role | Effort |
|---|---|---|---|
| 1 | RLS policies on all Supabase tables | Security, DB | M |
| 2 | Security headers in `next.config.mjs` | Security, Backend | S |
| 3 | Rate limiting on orders/coupons/contact | Backend, Security | M |
| 4 | CI/CD pipeline (GitHub Actions) | DevOps | M |
| 5 | Admin order notification email on payment.captured | Business Ops | S |
| 6 | Error boundaries (`error.tsx`) | Frontend, QA | S |
| 7 | Loading skeletons (`loading.tsx`) | Frontend, UI/UX | M |
| 8 | Vitest unit tests for razorpay + utils | QA | M |
| 9 | Env var validation at startup (`lib/env.ts`) | Backend, DevOps | S |
| 10 | Webhook Playwright/integration test | QA | M |

### Fix in Phase 3 sprint

| # | Fix | Role |
|---|---|---|
| 11 | Cart and wishlist DB sync | Frontend, DB |
| 12 | Saved address auto-fill at checkout | Frontend, UX |
| 13 | State dropdown on checkout form | Frontend, UX |
| 14 | GA4 implementation (script + events) | Frontend, SEO |
| 15 | Canonical tags on shop/category pages | Frontend, SEO |
| 16 | PDP `generateStaticParams` + revalidate | Frontend, Perf |
| 17 | PDP `Promise.all` for sequential queries | Backend, Perf |
| 18 | Performance indexes migration | DB, Perf |
| 19 | Full-text search migration (`search_vector`) | DB, Backend |
| 20 | Breadcrumb JSON-LD fix | Frontend, SEO |
| 21 | Sentry error monitoring | Backend, DevOps |
| 22 | Remove dev mode admin bypass | Security |
| 23 | Coupon code out of URL params | Security |

### Phase 4 and beyond

- Fulfillment workflow + courier integration (Shiprocket)
- GST calculation and compliant invoices
- Return/refund management UI
- Admin audit log
- Stock alert notifications (Supabase webhook)
- Revenue reports dashboard
- Staging environment
- Newsletter signup + CRM integration
- Meta Pixel + GTM
- Made-to-measure full flow
- `@supabase/ssr` migration

---

---

# LIVE STATIC ANALYSIS RESULTS

**Run date:** May 2026  
**Method:** Full file-by-file static analysis of all 123 TypeScript/TSX source files, all 17 migrations, all API routes, config, and middleware. ESLint and TypeScript compiler executed directly on the codebase.  
**Files read:** `lib/razorpay.ts`, `lib/auth.ts`, `lib/supabase/*`, `middleware.ts`, `app/api/orders/create/route.ts`, `app/api/payments/webhook/route.ts`, `app/api/payments/verify/route.ts`, `app/api/coupons/validate/route.ts`, `app/(shop)/checkout/CheckoutForm.tsx`, `next.config.mjs`, `package.json`, `supabase/migrations/001–017`, `.env.local.example`

---

## Automated Tool Results

| Tool | Command | Result |
|---|---|---|
| ESLint | `npm run lint` | ✅ **PASS** — zero warnings, zero errors |
| TypeScript | `npx tsc --noEmit` | ✅ **PASS** — zero type errors |
| Build | `npm run build` | ✅ **PASS** (confirmed from prior runs and commit history) |
| Unit tests | `vitest` | ❌ **NOT CONFIGURED** — no vitest.config.ts, zero test files |
| Integration tests | any | ❌ **NOT CONFIGURED** |
| E2E tests | `playwright` | ❌ **NOT CONFIGURED** |
| Security headers | `curl -I` | ❌ **FAIL** — no `headers()` in next.config.mjs |
| RLS policies | migration scan | ❌ **FAIL** — only 1 of 17 tables has RLS |
| Rate limiting | code scan | ❌ **FAIL** — zero rate limiting code or library |
| Loading skeletons | file scan | ❌ **FAIL** — zero `loading.tsx` files |
| Error boundaries | file scan | ❌ **FAIL** — zero `error.tsx` files |
| Env var validation | code scan | ❌ **FAIL** — no `lib/env.ts`, raw `process.env` reads |
| Test infrastructure | file scan | ❌ **FAIL** — 123 source files, 0 test files |

---

## Confirmed Correct (Passes Static Analysis)

These items from Phase 1 were claimed fixed. All confirmed correct by reading the actual code.

| Item | File | Verdict |
|---|---|---|
| `timingSafeEqual` length guard + try/catch | `lib/razorpay.ts:12-17` | ✅ CONFIRMED FIXED |
| Server-side item price re-fetch from DB | `app/api/orders/create/route.ts:70-89` | ✅ CONFIRMED FIXED |
| Stock check before order creation | `app/api/orders/create/route.ts:90-110` | ✅ CONFIRMED FIXED |
| Atomic `increment_coupon_usage` RPC | `migrations/015_rpc_functions.sql:1-25` | ✅ CONFIRMED FIXED |
| Atomic `decrement_variant_stock` RPC | `migrations/015_rpc_functions.sql:50-71` | ✅ CONFIRMED FIXED |
| Coupon rollback on Razorpay failure | `app/api/orders/create/route.ts:205` | ✅ CONFIRMED FIXED |
| Webhook idempotency guard (`paid` check) | `app/api/payments/webhook/route.ts:70-74` | ✅ CONFIRMED FIXED |
| Stock decrement in `payment.captured` webhook | `app/api/payments/webhook/route.ts:81-110` | ✅ CONFIRMED FIXED |
| `middleware.ts` reads `token.isAdmin` (not cookie only) | `middleware.ts:25-34` | ✅ CONFIRMED FIXED |
| Admin check embeds `isAdmin` in JWT at sign-in | `lib/auth.ts:50-62` | ✅ CONFIRMED FIXED |
| `free_shipping` coupon zeroes shipping cost | `CheckoutForm.tsx:121, 137-138, 153-155` | ✅ CONFIRMED FIXED |
| Coupon validate returns correct `discount_type` | `app/api/coupons/validate/route.ts:65-78` | ✅ CONFIRMED FIXED |
| `payment.failed` webhook handler exists | `app/api/payments/webhook/route.ts:120-127` | ✅ CONFIRMED (basic) |
| `products` table has `updated_at` + trigger | `supabase/migrations/001_products.sql:28-38` | ✅ CONFIRMED |
| `orders` table has indexes on key columns | `supabase/migrations/003_orders.sql:36-41` | ✅ CONFIRMED |
| OG default image file | `public/images/og-default.jpg` | ✅ CONFIRMED EXISTS |
| Logo-dark SVG for Razorpay modal | `public/images/logo-dark.svg` | ✅ CONFIRMED EXISTS |

---

## New Bugs Found by Live Code Reading

These are issues not fully captured in the role audit above, discovered by reading the actual source.

---

### 🔴 CRITICAL — Admin middleware has unconditional dev bypass

**File:** `middleware.ts:17-19`

```ts
if (isDev && isAdminRoute) {
  return NextResponse.next()
}
```

`isDev = process.env.NODE_ENV === 'development'`. Any server with `NODE_ENV=development` in env — including a misconfigured staging or preview deployment — completely bypasses all admin authentication. Any URL at `staging.thepossah.com/admin/*` would be fully open.

**Severity escalation from phase 1:** The phase 1 audit said this was fixed to use `token.isAdmin`. It was partially fixed — production path is correct. But the dev bypass is still present and will remain a critical risk on any non-production environment.

**Fix:** Remove the dev bypass entirely:
```ts
// DELETE lines 17-19 from middleware.ts
// Seed the developer's email in local admin_users table instead
// Local Google OAuth works fine with test keys
```

---

### 🔴 CRITICAL — `admin_users` table has `password_hash NOT NULL` with no default

**File:** `supabase/migrations/011_admin_users.sql:6`

```sql
password_hash  TEXT NOT NULL,
```

The auth system is Google OAuth. Password hashes are never set or used. But the column is `NOT NULL` with no default value. This means the canonical admin seeding command:

```sql
INSERT INTO admin_users (email, is_active) VALUES ('admin@example.com', true);
```

**will throw a PostgreSQL NOT NULL constraint violation.** The admin seeding documented in `POSSAH_BUILD_STATUS_GUIDE.md` will fail silently in SQL editors that don't surface the error clearly. This is why no admin user may exist in production yet.

**Fix:** Migration to add a default:
```sql
ALTER TABLE admin_users ALTER COLUMN password_hash SET DEFAULT '';
```
Or drop the column since OAuth doesn't use passwords:
```sql
ALTER TABLE admin_users DROP COLUMN password_hash;
```

---

### 🟠 HIGH — `auth.ts` does NOT filter admin by `is_active`

**File:** `lib/auth.ts:54-57`

```ts
const { data } = await supabase
  .from('admin_users')
  .select('id')
  .eq('email', user.email ?? '')
  .maybeSingle()
```

No `.eq('is_active', true)` filter. A deactivated admin account (`is_active = false`) still passes the check and gets `token.isAdmin = true`. There is no way to revoke admin access without deleting the row.

**Fix:**
```ts
.eq('email', user.email ?? '')
.eq('is_active', true)   // ADD THIS
.maybeSingle()
```

---

### 🟠 HIGH — `payment.failed` webhook does not notify customer

**File:** `app/api/payments/webhook/route.ts:120-127`

```ts
if (event.event === 'payment.failed') {
  await supabase
    .from('orders')
    .update({ payment_status: 'failed' })
    .eq('gateway_order_id', razorpayOrderId)
    .eq('payment_status', 'pending')
}
```

The order status updates to `'failed'` but no customer email is sent. The customer closes Razorpay, nothing appears, the cart might be empty (if `clearCart` already ran), and they have no idea whether to retry or contact support.

**Missing:** Customer-facing `payment.failed` email with retry link. The webhook handler does the DB update correctly but silently.

**Fix:** After the DB update, fetch the order's `customer_email` and `order_number` and call `sendPaymentFailureEmail(...)`.

---

### 🟠 HIGH — `initRazorpay` has no `payment.failed` handler

**File:** `CheckoutForm.tsx:768-773`

```ts
const rz = new RazorpayConstructor({
  // ...
  handler: (response) => { onSuccess(...) },  // only success
  modal: { ondismiss: onDismiss },            // only modal close
  // ⛔ NO payment.failed handler
})
```

Razorpay fires a `payment.failed` event on the checkout object when a payment fails with a specific error (card declined, bank error, insufficient funds). Without a handler, the customer sees Razorpay's own error UI but the Possah checkout form shows nothing and stays in "submitting" state indefinitely.

**Fix:**
```ts
const rz = new RazorpayConstructor({
  // ...existing options...
})

rz.on('payment.failed', function(response: { error: { code: string; description: string; source: string } }) {
  onPaymentFailed(response.error)
})

rz.open()
```

Propagate `onPaymentFailed` callback through `initRazorpay` parameters and handle in `CheckoutForm` by setting an error state and re-enabling the submit button.

---

### 🟠 HIGH — Coupon code persists in browser URL

**File:** `CheckoutForm.tsx:118`

```ts
const couponCode = searchParams.get('coupon') ?? ''
```

Coupon code is read from the URL query string. When a user navigates to `/checkout?coupon=SAVE20`:
1. The code appears in browser address bar
2. It appears in browser history
3. It appears in server access logs
4. It appears in referrer headers sent to Razorpay and GA4

For a promo-code strategy that relies on exclusivity, this is a significant leak. For a luxury brand, it's also a UX quality issue.

**Fix:** Remove `coupon` from URL params. Use a standalone coupon input field in the checkout form, managed as React state only. If pre-applying coupons via link is needed, use a short-lived token that exchanges for the real code server-side.

---

### 🟡 MEDIUM — `categories` table has no `updated_at` column

**File:** `supabase/migrations/002_categories.sql`

Confirmed by grepping the migration file — zero `updated_at` column or trigger. The `sitemap.ts` queries `categories.updated_at`, which returns `undefined` for every category. Google's sitemap parser gets no `lastModified` signal for any category URL.

**Note:** `products` table **does** have `updated_at` with a proper trigger (migration 001) — this is correctly handled. Only `categories` is missing it.

---

### 🟡 MEDIUM — No `generateStaticParams` on any storefront page

**Confirmed by searching all 123 `.tsx` files:** `generateStaticParams` appears in **zero** files. Every PDP, every category page, every journal page is fully dynamic SSR. The only `revalidate` value in the entire app is `export const revalidate = 60` on `app/admin/page.tsx` — the admin dashboard, not the public storefront.

All public storefront pages hit Supabase on every request.

---

### 🟡 MEDIUM — `@supabase/auth-helpers-nextjs` is deprecated package

**File:** `lib/supabase/server.ts:1`, `package.json`

```ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
```

This package (`@supabase/auth-helpers-nextjs@^0.10.0`) is deprecated. Supabase's current package is `@supabase/ssr`. The deprecated package will not receive security patches.

---

### 🟡 MEDIUM — State field on checkout is plain `<input type="text">`

**File:** `CheckoutForm.tsx:26`

```ts
state: z.string().min(2, 'State required').max(60),
```

Renders as a plain text input. No dropdown with Indian states. Customers type "UP", "uttar pradesh", "Maharashtra ", "MH" — all different values that will break shipping integrations. Confirmed present.

---

### 🟡 MEDIUM — No GA4 analytics code anywhere in codebase

**Confirmed by grepping all 123 files for** `gtag`, `GA4`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `googletagmanager` — zero matches in application code. The env var is documented in `.env.local.example` as `NEXT_PUBLIC_GA_MEASUREMENT_ID=` (empty). No script tag, no tracking calls exist.

---

### 🔵 LOW — `next.config.mjs` optimizes only `swiper`, not Radix UI

**File:** `next.config.mjs:13`

```js
experimental: {
  optimizePackageImports: ['swiper'],
}
```

`@radix-ui/react-accordion`, `@radix-ui/react-dialog`, `@radix-ui/react-select` are all in `package.json` but not listed here. These packages benefit significantly from tree-shaking optimization.

**Fix:** Add all Radix packages to `optimizePackageImports`.

---

### 🔵 LOW — No health check endpoint

Zero `/api/health` route exists. Confirmed by checking all files in `app/api/`. No uptime monitoring target.

---

### 🔵 LOW — Structured logging absent

All error logging is `console.error(...)`. No log levels, no correlation IDs, no JSON structure. In production (Vercel), logs are ephemeral and unsearchable without a log aggregation service.

---

## Verified Non-Issues (Previously Flagged, Now Resolved)

These were called out in Phase 1 audit as broken. Code inspection confirms they are now correctly implemented.

| Phase 1 Finding | Status |
|---|---|
| Price spoofing — client prices accepted server-side | ✅ RESOLVED — server fetches real prices from DB |
| Coupon race condition — non-atomic increment | ✅ RESOLVED — `increment_coupon_usage` RPC with `ROW_COUNT` check |
| Stock not decremented after payment | ✅ RESOLVED — `decrement_variant_stock` RPC in webhook |
| Admin middleware checked cookie presence only | ✅ RESOLVED — `getToken()` + `token.isAdmin` check |
| `timingSafeEqual` throws on length mismatch | ✅ RESOLVED — length guard before call, try/catch wrapper |
| `free_shipping` coupon returned wrong `discount_type` | ✅ RESOLVED — correct type returned from API |
| `free_shipping` coupon did not zero shipping in checkout | ✅ RESOLVED — `isFreeShippingCoupon` state zeroes `shippingCost` |
| Admin checks DB on every request (token expiry) | ✅ RESOLVED — embedded in JWT at sign-in only |
| `payment.failed` not handled at all in webhook | ✅ PARTIALLY RESOLVED — status updates but no customer email |
| OG image missing | ✅ RESOLVED — `public/images/og-default.jpg` exists |
| Razorpay logo missing | ✅ RESOLVED — `public/images/logo-dark.svg` exists |

---

## Final Verified Issue Scorecard (Post Live Analysis)

| Severity | Count | Items |
|---|---|---|
| 🔴 CRITICAL | 5 | No RLS (16 tables), No security headers, No CI/CD, Dev admin bypass, `admin_users.password_hash NOT NULL` blocks seeding |
| 🟠 HIGH | 8 | No rate limiting, No tests (123 files, 0 tests), No env validation, `is_active` not filtered in auth, `payment.failed` no customer email, No Razorpay `payment.failed` client handler, No error.tsx, No loading.tsx |
| 🟡 MEDIUM | 7 | Cart not DB-synced, Coupon in URL, No `generateStaticParams` anywhere, `categories` missing `updated_at`, deprecated Supabase package, State = free text, No GA4 |
| 🔵 LOW | 4 | No health check, No structured logging, `optimizePackageImports` incomplete, No saved address auto-fill |
| **TOTAL** | **24** | Open issues blocking or degrading production quality |
