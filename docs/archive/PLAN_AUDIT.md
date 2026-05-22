# Possah 1.0 — Plan Audit: Every Fix, Every File, Every Migration

**Type:** Detailed Implementation Audit — what exactly needs to be done before this site can take real money  
**Derived from:** Live static analysis of 123 source files + 17 migrations + config  
**Companion to:** `MASTER_PLAN.md` (execution sequence)  
**Last Updated:** May 2026

---

## How to Use This Document

This document is the **reference** — every bug, every fix, every file name, every line number, every SQL statement needed. It is not a sprint plan. It is the source of truth that `MASTER_PLAN.md` executes against. When a developer picks up a task from `MASTER_PLAN.md`, they come here for the exact implementation details.

Severity grades:
- 🔴 **CRITICAL** — Blocks go-live. Real money loss or data exposure if shipped.
- 🟠 **HIGH** — Functional failure visible to customers or operations.
- 🟡 **MEDIUM** — Quality degradation. Fix before first month.
- 🔵 **LOW** — Improvement. Fix before scaling.

---

## Section 1: Security Fixes

### FIX-SEC-01 — Remove Dev Admin Bypass
**Severity:** 🔴 CRITICAL  
**File:** `middleware.ts`  
**Lines:** 17–19

**Current code (DELETE THIS):**
```ts
if (isDev && isAdminRoute) {
  return NextResponse.next()
}
```

**Why dangerous:** Any server with `NODE_ENV=development` — including a misconfigured Vercel preview deployment — bypasses all admin auth. `/admin` becomes fully public.

**Fix:** Delete lines 17–19. Add the developer's email to `admin_users` locally instead:
```sql
INSERT INTO admin_users (email, is_active, password_hash) VALUES ('dev@email.com', true, '');
```

**Also remove** the `isDev` variable on line 14 if it's only used for this bypass.

**Verify:** Run `npm run dev` locally. Navigate to `/admin` without being signed in. Must redirect to `/auth/signin`.

---

### FIX-SEC-02 — Add Security Response Headers
**Severity:** 🔴 CRITICAL  
**File:** `next.config.mjs`

**Current state:** Zero security headers. No `headers()` function exists.

**Fix — add to `next.config.mjs`:**
```js
const nextConfig = {
  // ...existing config...
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}
```

**Do NOT add CSP yet** — Razorpay's checkout modal and GA4 both require script-src, frame-src, and connect-src allowlists. Add CSP in report-only mode after cataloguing all third-party origins.

**Verify:** `curl -I https://staging.thepossah.com | grep -E "X-Frame|X-Content|Strict|Referrer"` — all four headers must appear.

---

### FIX-SEC-03 — Row Level Security on All Tables
**Severity:** 🔴 CRITICAL  
**File:** New migration `supabase/migrations/018_rls_policies.sql`

**Current state:** Only `store_settings` (migration 017) has RLS. All 16 other tables are unprotected at the database level.

**Full migration:**
```sql
-- Enable RLS on all unprotected tables
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_look_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_articles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbooks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_sets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users       ENABLE ROW LEVEL SECURITY;

-- Public anon readable (storefront catalog)
CREATE POLICY "products_anon_read"    ON products          FOR SELECT USING (is_active = true);
CREATE POLICY "images_anon_read"      ON product_images    FOR SELECT USING (true);
CREATE POLICY "variants_anon_read"    ON product_variants  FOR SELECT USING (true);
CREATE POLICY "tags_anon_read"        ON product_tags      FOR SELECT USING (true);
CREATE POLICY "look_links_anon_read"  ON product_look_links FOR SELECT USING (true);
CREATE POLICY "categories_anon_read"  ON categories        FOR SELECT USING (true);
CREATE POLICY "homepage_anon_read"    ON homepage_config   FOR SELECT USING (true);
CREATE POLICY "journal_anon_read"     ON journal_articles  FOR SELECT USING (is_published = true);
CREATE POLICY "lookbooks_anon_read"   ON lookbooks         FOR SELECT USING (true);
CREATE POLICY "gift_sets_anon_read"   ON gift_sets         FOR SELECT USING (true);

-- Reviews: approved only for public read; authenticated users can insert their own
CREATE POLICY "reviews_anon_read"   ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "reviews_user_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- User-scoped data: only the owning user can read/write
CREATE POLICY "orders_owner_read"       ON orders           FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wishlists_owner_all"     ON wishlists        FOR ALL   USING (auth.uid() = user_id);
CREATE POLICY "addresses_owner_all"     ON user_addresses   FOR ALL   USING (auth.uid() = user_id);
CREATE POLICY "measurements_owner_all"  ON user_measurements FOR ALL  USING (auth.uid() = user_id);

-- Coupons: no direct client read (validate only through /api/coupons/validate)
-- admin_users: no client read at all (admin auth is JWT-based, not DB query from browser)
-- Service role key bypasses RLS on all server-side admin operations — no policy needed for those
```

**Verify:** Using a new Supabase client with the anon key only (no service role), attempt:
```ts
const { data } = await anonClient.from('orders').select('*')
// Must return [] or RLS error, NOT all orders
```

---

### FIX-SEC-04 — Fix `admin_users.password_hash NOT NULL` Constraint
**Severity:** 🔴 CRITICAL  
**File:** New migration `supabase/migrations/018b_admin_users_fix.sql` (or bundle with FIX-SEC-03)

**Current state:** `admin_users.password_hash TEXT NOT NULL` — no default value. Inserting an admin email fails:
```sql
INSERT INTO admin_users (email, is_active) VALUES ('admin@x.com', true);
-- ERROR: null value in column "password_hash" violates not-null constraint
```

This means no admin user has likely been seeded in production.

**Fix:**
```sql
-- Option A: Give it a safe default (column kept but unused)
ALTER TABLE admin_users ALTER COLUMN password_hash SET DEFAULT '';

-- Option B: Drop the column entirely (OAuth doesn't use it)
ALTER TABLE admin_users DROP COLUMN IF EXISTS password_hash;
```

Recommend Option B — dead columns create confusion. After this, admin seeding works:
```sql
INSERT INTO admin_users (email, is_active) VALUES ('thedenn0007@gmail.com', true);
```

---

### FIX-SEC-05 — Add `is_active` Filter to Admin Auth Query
**Severity:** 🟠 HIGH  
**File:** `lib/auth.ts:54-57`

**Current code:**
```ts
const { data } = await supabase
  .from('admin_users')
  .select('id')
  .eq('email', user.email ?? '')
  .maybeSingle()
```

**Problem:** No `is_active` check. A deactivated admin still gets `token.isAdmin = true`. There is no way to block a compromised admin account without deleting the row.

**Fix:**
```ts
const { data } = await supabase
  .from('admin_users')
  .select('id')
  .eq('email', user.email ?? '')
  .eq('is_active', true)      // ADD THIS LINE
  .maybeSingle()
```

**Verify:** Set an admin user's `is_active = false` in DB. Sign out, sign back in with that account. Must NOT get admin access.

---

### FIX-SEC-06 — Rate Limiting on Public API Endpoints — REMOVED
**Decision:** Removed. Not needed at current scale. Upstash Redis adds operational overhead without meaningful benefit for a low-traffic boutique. Vercel DDoS protection + Razorpay fraud controls are sufficient.  
**Files affected:** `lib/ratelimit.ts` deleted, rate limit blocks removed from 3 routes, `@upstash/ratelimit` and `@upstash/redis` uninstalled.

**Install:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**New file: `lib/ratelimit.ts`**
```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()  // reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN

export const orderRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'rl_orders',
})

export const couponRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'rl_coupons',
})

export const contactRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '5 m'),
  analytics: true,
  prefix: 'rl_contact',
})
```

**Usage pattern (add to each route at the top of the handler):**
```ts
import { orderRatelimit } from '@/lib/ratelimit'
import { NextRequest } from 'next/server'

const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
const { success, reset } = await orderRatelimit.limit(ip)

if (!success) {
  return NextResponse.json(
    { message: 'Too many requests. Please wait before trying again.' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) },
    }
  )
}
```

**Add to env:**
```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

**Verify:** Shell loop: `for i in {1..15}; do curl -s -o /dev/null -w "%{http_code}\n" -X POST https://staging.thepossah.com/api/coupons/validate -H 'Content-Type: application/json' -d '{"code":"TEST","subtotal":1000}'; done` — requests 11-15 must return 429.

---

### FIX-SEC-07 — Move Coupon Code Out of URL
**Severity:** 🟡 MEDIUM  
**File:** `app/(shop)/checkout/CheckoutForm.tsx:118`

**Current code:**
```ts
const couponCode = searchParams.get('coupon') ?? ''
```

**Fix:** Replace with a coupon input field in the checkout form itself, managed as `useState`:
```ts
const [couponCode, setCouponCode] = useState('')
const [couponInput, setCouponInput] = useState('')
```

Add a coupon input row to the form UI between the delivery options and the order summary. Apply button calls `/api/coupons/validate` and updates state. The coupon code never appears in the URL.

---

### FIX-SEC-08 — Env Var Validation at Startup
**Severity:** 🟠 HIGH  
**File:** New `lib/env.ts`

```ts
import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:    z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY:   z.string().min(20),
  NEXTAUTH_SECRET:             z.string().min(32),
  NEXTAUTH_URL:                z.string().url(),
  GOOGLE_CLIENT_ID:            z.string().min(10),
  GOOGLE_CLIENT_SECRET:        z.string().min(10),
  RAZORPAY_KEY_ID:             z.string().startsWith('rzp_'),
  RAZORPAY_KEY_SECRET:         z.string().min(10),
  RAZORPAY_WEBHOOK_SECRET:     z.string().min(10),
  RESEND_API_KEY:              z.string().startsWith('re_'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ')
  throw new Error(`[env] Missing or invalid environment variables: ${missing}`)
}

export const env = parsed.data
```

Import `env` at the top of `lib/razorpay.ts`, `lib/email.ts`, `lib/auth.ts`, `lib/supabase/admin.ts` to trigger validation at module load time.

---

## Section 2: Payment & Checkout Fixes

### FIX-PAY-01 — Add `payment.failed` Razorpay Client Handler
**Severity:** 🟠 HIGH  
**File:** `app/(shop)/checkout/CheckoutForm.tsx:753-773` (inside `initRazorpay`)

**Current:** The `initRazorpay` function creates a `new RazorpayConstructor(options)` and calls `.open()`. Options include `handler` (success) and `modal.ondismiss` (dismissed) but no `payment.failed` listener.

**Fix — update `initRazorpay` function signature and body:**
```ts
function initRazorpay({
  // ...existing params...
  onPaymentFailed,
}: {
  // ...existing types...
  onPaymentFailed: (errorCode: string, errorDescription: string) => void
}) {
  // ...existing options...
  const rz = new RazorpayConstructor(options)

  // Add explicit payment failure listener
  rz.on('payment.failed', function(response: {
    error: { code: string; description: string; source: string }
  }) {
    onPaymentFailed(response.error.code, response.error.description)
  })

  rz.open()
}
```

In `CheckoutForm`, pass `onPaymentFailed`:
```ts
initRazorpay({
  // ...existing args...
  onPaymentFailed: (code, desc) => {
    setServerError(
      code === 'BAD_REQUEST_ERROR'
        ? 'Payment failed due to a technical issue. Please try again.'
        : 'Payment declined. Please try a different payment method.'
    )
    setSubmitting(false)
    // Do NOT clear cart — customer should retry
  },
})
```

---

### FIX-PAY-02 — Send Customer Email on `payment.failed` Webhook
**Severity:** 🟠 HIGH  
**File:** `app/api/payments/webhook/route.ts:120-127`

**Current:**
```ts
if (event.event === 'payment.failed') {
  await supabase
    .from('orders')
    .update({ payment_status: 'failed' })
    .eq('gateway_order_id', razorpayOrderId)
    .eq('payment_status', 'pending')
}
```

**Fix — add email after the DB update:**
```ts
if (event.event === 'payment.failed') {
  const errorDescription = event.payload.payment.entity.error_description ?? 'Payment could not be processed'

  const { data: updatedOrder } = await supabase
    .from('orders')
    .update({ payment_status: 'failed' })
    .eq('gateway_order_id', razorpayOrderId)
    .eq('payment_status', 'pending')
    .select('customer_email, customer_name, order_number')
    .single()

  if (updatedOrder) {
    try {
      await sendPaymentFailureEmail({
        to: updatedOrder.customer_email,
        customerName: updatedOrder.customer_name,
        orderNumber: updatedOrder.order_number,
        errorMessage: errorDescription,
        retryUrl: 'https://thepossah.com/checkout',
      })
    } catch (emailErr) {
      console.error('[webhook] Payment failure email failed:', emailErr)
    }
  }
}
```

**Add `sendPaymentFailureEmail` to `lib/email.ts`** — Resend template similar to order confirmation but with failure message and retry CTA.

---

### FIX-PAY-03 — Admin Order Notification on Payment Captured
**Severity:** 🟠 HIGH  
**File:** `app/api/payments/webhook/route.ts` — in the `payment.captured` block, after stock decrement

**After the `Promise.all` stock decrement section, before the confirmation email:**
```ts
// Admin notification — non-blocking, never fail the webhook for this
try {
  await sendAdminOrderNotification({
    to: process.env.ADMIN_EMAIL ?? 'thedenn0007@gmail.com',
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    items: lineItemsRaw,
    total: order.total,
    shippingAddress: order.shipping_address,
  })
} catch {
  // non-fatal
}
```

**Add to env:**
```env
ADMIN_EMAIL=thedenn0007@gmail.com
```

**Add `sendAdminOrderNotification` to `lib/email.ts`.**

---

## Section 3: Database Fixes

### FIX-DB-01 — Add `updated_at` to Categories
**Severity:** 🟡 MEDIUM  
**File:** New migration `supabase/migrations/019_categories_updated_at.sql`

```sql
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at_trigger
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_categories_updated_at();
```

---

### FIX-DB-02 — Add Performance Indexes
**Severity:** 🟡 MEDIUM  
**File:** New migration `supabase/migrations/020_performance_indexes.sql`

```sql
-- Product variants (for stock checks and cart lookups)
CREATE INDEX IF NOT EXISTS idx_variants_product_active
  ON product_variants(product_id)
  WHERE stock_qty > 0;

-- Wishlists
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved
  ON reviews(product_id)
  WHERE status = 'approved';

-- Coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code_active
  ON coupons(code)
  WHERE is_active = true;

-- Journal
CREATE INDEX IF NOT EXISTS idx_journal_slug_published
  ON journal_articles(slug)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_journal_created_desc
  ON journal_articles(created_at DESC)
  WHERE is_published = true;

-- Orders: add user_id index (not in migration 003)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Full-text search on products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
      setweight(to_tsvector('english', coalesce(fabric,'')), 'B') ||
      setweight(to_tsvector('english', coalesce(description,'')), 'C')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);
```

---

### FIX-DB-03 — Cart Items Table
**Severity:** 🟠 HIGH (prerequisite for FIX-FE-01)  
**File:** New migration `supabase/migrations/021_cart_items.sql`

```sql
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  TEXT,
  variant_id  UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (user_id, variant_id),
  UNIQUE NULLS NOT DISTINCT (session_id, variant_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart_owner_all" ON cart_items FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id    ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
```

---

## Section 4: Frontend Fixes

### FIX-FE-01 — Cart and Wishlist DB Sync
**Severity:** 🟠 HIGH  
**Files:** `lib/store/cartStore.ts`, `lib/store/wishlistStore.ts`, new `app/api/cart/route.ts`

**Cart sync logic:**
1. Create `app/api/cart/route.ts` — GET to fetch cart items, POST to upsert, DELETE to remove
2. In `cartStore.addItem`: if user is authenticated (check via `useSession`), POST to `/api/cart` after local state update
3. On app boot (in `app/layout.tsx` or a cart hydration component): if session exists, GET `/api/cart` and merge with localStorage items — DB wins on conflict

**Wishlist sync logic:**
1. In `wishlistStore.addToWishlist`: if authenticated, `supabase.from('wishlists').upsert({ user_id, product_id })`
2. In `wishlistStore.removeFromWishlist`: if authenticated, `supabase.from('wishlists').delete().eq('user_id').eq('product_id')`
3. On boot: if session, fetch wishlists from DB and hydrate store

---

### FIX-FE-02 — Add `loading.tsx` for All Major Routes
**Severity:** 🟠 HIGH  
**Files (all new):**

- `app/(shop)/loading.tsx`
- `app/(shop)/shop/[category]/loading.tsx` — 12-card skeleton grid
- `app/(shop)/shop/[category]/[slug]/loading.tsx` — gallery + product info skeleton
- `app/(shop)/cart/loading.tsx`
- `app/(shop)/account/loading.tsx`
- `app/admin/loading.tsx`

Each skeleton must use the same layout dimensions as the real page to prevent cumulative layout shift (CLS) when content loads.

---

### FIX-FE-03 — Add `error.tsx` for All Major Routes
**Severity:** 🟠 HIGH  
**Files (all new):**

- `app/(shop)/error.tsx`
- `app/(shop)/shop/[category]/error.tsx`
- `app/(shop)/shop/[category]/[slug]/error.tsx`
- `app/(shop)/checkout/error.tsx`
- `app/admin/error.tsx`

**Template for each:**
```tsx
'use client'
import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Log to Sentry once integrated
    console.error(error)
  }, [error])

  return (
    <div style={{ /* brand styling */ }}>
      <h2>Something went wrong</h2>
      <p>We had trouble loading this page. Your cart and account are safe.</p>
      <button onClick={reset}>Try again</button>
      <Link href="/">Return to home</Link>
    </div>
  )
}
```

---

### FIX-FE-04 — `generateStaticParams` + `revalidate` on PDP and Shop Pages
**Severity:** 🟡 MEDIUM  
**Files:** `app/(shop)/shop/[category]/[slug]/page.tsx`, `app/(shop)/shop/[category]/page.tsx`

**PDP (`[slug]/page.tsx`):**
```ts
export const revalidate = 3600  // ISR — rebuild every hour

export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('products')
    .select('slug, categories(slug)')
    .eq('is_active', true)
  return (data ?? []).map((p) => ({
    category: (p.categories as { slug: string } | null)?.slug ?? '',
    slug: p.slug,
  }))
}
```

**Category page:**
```ts
export const revalidate = 60  // refresh every minute
```

---

### FIX-FE-05 — Fix PDP Sequential Supabase Queries
**Severity:** 🟡 MEDIUM  
**File:** `app/(shop)/shop/[category]/[slug]/page.tsx`

Find the data-fetching section (likely uses `await` sequentially on 4–5 queries). Replace with `Promise.all`:
```ts
const [productResult, variantsResult, reviewsResult, relatedResult] = await Promise.all([
  supabase.from('products').select('...').eq('slug', slug).single(),
  supabase.from('product_variants').select('...').eq('product_id', productId),
  supabase.from('reviews').select('...').eq('product_id', productId).eq('status', 'approved'),
  supabase.from('products').select('...').eq('category_id', categoryId).neq('id', productId).limit(4),
])
```

---

### FIX-FE-06 — State Field → Indian States Dropdown
**Severity:** 🟡 MEDIUM  
**File:** `app/(shop)/checkout/CheckoutForm.tsx`

Replace the state `<input type="text">` with a `<select>` populated with all 36 Indian states and UTs:

```ts
const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]
```

Update Zod schema to validate against this list:
```ts
state: z.enum(INDIAN_STATES as [string, ...string[]], { errorMap: () => ({ message: 'Select your state' }) }),
```

---

### FIX-FE-07 — GA4 Script and Events
**Severity:** 🟡 MEDIUM  
**Files:** `app/layout.tsx`, `lib/store/cartStore.ts`, `app/(shop)/shop/[category]/[slug]/page.tsx`, `app/(shop)/checkout/CheckoutForm.tsx`

**`app/layout.tsx` — add inside `<head>`:**
```tsx
import Script from 'next/script'

{process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
  <>
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
      strategy="afterInteractive"
    />
    <Script id="ga4" strategy="afterInteractive">
      {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');`}
    </Script>
  </>
)}
```

**Events to fire (in order of priority):**
1. `view_item` — PDP server component: fire via `gtag('event', 'view_item', { items: [{ item_id, item_name, price, item_category }] })`
2. `add_to_cart` — `cartStore.addItem`: `gtag('event', 'add_to_cart', { currency: 'INR', value: price * qty, items: [...] })`
3. `begin_checkout` — `CheckoutForm` mount: `gtag('event', 'begin_checkout', { currency: 'INR', value: total, items: [...] })`
4. `purchase` — after `verifyPayment` succeeds: `gtag('event', 'purchase', { transaction_id: order_number, value: total, currency: 'INR', items: [...] })`

---

### FIX-FE-08 — SEO: Canonical Tags on Shop/Category Pages
**Severity:** 🟡 MEDIUM  
**File:** `app/(shop)/shop/[category]/page.tsx`

In `generateMetadata`:
```ts
return {
  // ...existing metadata...
  alternates: {
    canonical: `https://thepossah.com/shop/${params.category}`,
  },
}
```

---

### FIX-FE-09 — SEO: Breadcrumb JSON-LD Uses Real Category
**Severity:** 🟡 MEDIUM  
**File:** `app/(shop)/shop/[category]/[slug]/page.tsx`

Find the JSON-LD breadcrumb generation and replace the hardcoded `/shop/sarees` with:
```ts
item: `https://thepossah.com/shop/${product.category_slug ?? params.category}`
```

---

### FIX-FE-10 — Reduced Motion CSS
**Severity:** 🟡 MEDIUM  
**File:** `styles/globals.css`

Append:
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

## Section 5: Infrastructure Fixes

### FIX-INFRA-01 — CI/CD Pipeline
**Severity:** 🔴 CRITICAL  
**File:** New `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
```

Add test jobs once tests exist (FIX-TEST-01 → FIX-TEST-04). Enable GitHub branch protection on `main` requiring this check to pass before merge.

---

### FIX-INFRA-02 — Health Check Endpoint
**Severity:** 🔵 LOW  
**File:** New `app/api/health/route.ts`

```ts
import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createPublicClient()
    await supabase.from('categories').select('id').limit(1)
    return NextResponse.json({
      status: 'ok',
      timestamp: Date.now(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    })
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 })
  }
}
```

---

### FIX-INFRA-03 — Sentry Error Monitoring
**Severity:** 🟠 HIGH

```bash
npx @sentry/wizard@latest -i nextjs
```

Wrap all API route `catch` blocks:
```ts
import * as Sentry from '@sentry/nextjs'

} catch (err) {
  Sentry.captureException(err, { extra: { order_number, route: 'orders/create' } })
  return NextResponse.json({ message: 'Internal error' }, { status: 500 })
}
```

Add `SENTRY_DSN` to env vars.

---

### FIX-INFRA-04 — `next.config.mjs` Package Import Optimization
**Severity:** 🔵 LOW  
**File:** `next.config.mjs`

```js
experimental: {
  optimizePackageImports: [
    'swiper',
    '@radix-ui/react-accordion',
    '@radix-ui/react-dialog',
    '@radix-ui/react-select',
    '@radix-ui/react-slot',
  ],
},
```

---

## Section 6: Testing

### FIX-TEST-01 — Install Test Infrastructure
**Severity:** 🔴 CRITICAL (prerequisite for all others)

```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event jsdom
npm install -D @playwright/test
npx playwright install chromium
```

Create `vitest.config.ts` and `playwright.config.ts` per `TESTING_PLAN.md` Section 1.

---

### FIX-TEST-02 — Unit Tests (Minimum Viable)
**Severity:** 🔴 CRITICAL  
**Files:** `tests/unit/razorpay.test.ts`, `tests/unit/utils.test.ts`

Full test specs are in `TESTING_PLAN.md` Sections 1.1 and 1.2. These two files provide the minimum safety net before go-live:
- All `verifyRazorpayWebhookSignature` edge cases (valid, wrong, empty, length mismatch, malformed hex)
- All `verifyRazorpayPaymentSignature` edge cases (same)
- `generateOrderNumber` uniqueness and format
- `formatPrice` INR formatting

---

### FIX-TEST-03 — Integration Tests (Minimum Viable)
**Severity:** 🔴 CRITICAL  
**Files:** `tests/integration/payment-webhook.test.ts`, `tests/integration/orders-create.test.ts`

Full specs in `TESTING_PLAN.md` Sections 2.1 and 2.2. Must test:
- Webhook rejects invalid signature → 400
- Webhook processes `payment.captured` → stock decremented
- Webhook is idempotent (duplicate replay does NOT double-decrement)
- `orders/create` rejects price spoofing → 422
- `orders/create` rejects out-of-stock → 409

---

### FIX-TEST-04 — E2E Checkout Flow
**Severity:** 🟠 HIGH  
**File:** `tests/e2e/checkout.spec.ts`

Full spec in `TESTING_PLAN.md` Section 3.3. Uses Playwright route interception to mock Razorpay and payment verify. Covers: add-to-cart → checkout form → payment → order confirmation.

---

## Section 7: Operations

### FIX-OPS-01 — Vercel Deployment Config
**Severity:** 🟠 HIGH  
**File:** New `vercel.json`

Remove `build:cf` from `package.json`. Uninstall `@cloudflare/next-on-pages`.

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["bom1"]
}
```

---

### FIX-OPS-02 — Supabase Package Migration
**Severity:** 🟡 MEDIUM

```bash
npm uninstall @supabase/auth-helpers-nextjs
npm install @supabase/ssr
```

Update `lib/supabase/server.ts` to use `createServerClient` from `@supabase/ssr`. Bundle with Phase 3 auth work to avoid two separate auth-layer changes.

---

## Complete Fix Inventory

| ID | Severity | File(s) | Description |
|---|---|---|---|
| FIX-SEC-01 | 🔴 | `middleware.ts` | Remove dev admin bypass |
| FIX-SEC-02 | 🔴 | `next.config.mjs` | Add security headers |
| FIX-SEC-03 | 🔴 | `018_rls_policies.sql` | RLS on all 16 unprotected tables |
| FIX-SEC-04 | 🔴 | `018b_admin_users_fix.sql` | Fix `password_hash NOT NULL` — admin seeding fails |
| FIX-SEC-05 | 🟠 | `lib/auth.ts` | Add `is_active` filter to admin check |
| FIX-SEC-06 | REMOVED | — | Rate limiting removed — not needed at current scale |
| FIX-SEC-07 | 🟡 | `CheckoutForm.tsx` | Remove coupon code from URL |
| FIX-SEC-08 | 🟠 | `lib/env.ts` | Env var validation at startup |
| FIX-PAY-01 | 🟠 | `CheckoutForm.tsx` | Razorpay `payment.failed` client handler |
| FIX-PAY-02 | 🟠 | `webhook/route.ts` | Customer email on `payment.failed` |
| FIX-PAY-03 | 🟠 | `webhook/route.ts` + `lib/email.ts` | Admin order notification on capture |
| FIX-DB-01 | 🟡 | `019_categories_updated_at.sql` | `updated_at` column + trigger on categories |
| FIX-DB-02 | 🟡 | `020_performance_indexes.sql` | Indexes + full-text search vector |
| FIX-DB-03 | 🟠 | `021_cart_items.sql` | Cart persistence table |
| FIX-FE-01 | 🟠 | `cartStore.ts`, `wishlistStore.ts` | DB sync for cart and wishlist |
| FIX-FE-02 | 🟠 | 6× `loading.tsx` files | Loading skeletons |
| FIX-FE-03 | 🟠 | 5× `error.tsx` files | Error boundaries |
| FIX-FE-04 | 🟡 | `[slug]/page.tsx`, `[category]/page.tsx` | Static generation + revalidate |
| FIX-FE-05 | 🟡 | `[slug]/page.tsx` | Parallel PDP data fetching |
| FIX-FE-06 | 🟡 | `CheckoutForm.tsx` | Indian states dropdown |
| FIX-FE-07 | 🟡 | `layout.tsx`, stores, `CheckoutForm` | GA4 script + 4 events |
| FIX-FE-08 | 🟡 | `[category]/page.tsx` | Canonical tags |
| FIX-FE-09 | 🟡 | `[slug]/page.tsx` | Breadcrumb JSON-LD fix |
| FIX-FE-10 | 🟡 | `styles/globals.css` | Reduced motion CSS |
| FIX-INFRA-01 | 🔴 | `.github/workflows/ci.yml` | CI/CD pipeline |
| FIX-INFRA-02 | 🔵 | `app/api/health/route.ts` | Health check endpoint |
| FIX-INFRA-03 | 🟠 | Sentry SDK | Error monitoring |
| FIX-INFRA-04 | 🔵 | `next.config.mjs` | Radix UI package optimization |
| FIX-TEST-01 | 🔴 | config files | Test infrastructure |
| FIX-TEST-02 | 🔴 | `tests/unit/` | Razorpay + utils unit tests |
| FIX-TEST-03 | 🔴 | `tests/integration/` | Webhook + order create integration tests |
| FIX-TEST-04 | 🟠 | `tests/e2e/` | Playwright checkout E2E |
| FIX-OPS-01 | 🟠 | `vercel.json`, `package.json` | Vercel deployment config |
| FIX-OPS-02 | 🟡 | `lib/supabase/server.ts` | Supabase SSR package migration |

**Total:** 34 fixes | 🔴 8 critical | 🟠 13 high | 🟡 10 medium | 🔵 3 low
