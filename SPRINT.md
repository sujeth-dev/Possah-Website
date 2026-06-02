# The Possah — Go-Live Sprint

**Last Updated:** May 2026
**Status:** Phase 1 ✅ Phase 2 ✅ — This sprint is everything between current state and production.
**Go-live target:** End of Sprint 4
**Rule:** Nothing ships to production until the Go-Live Gate (end of Sprint 4) passes. Staging runs continuous deployment from `main`. Production is a manual promote after the gate.

> RLS and rate limiting are intentionally excluded. Not needed at current scale.
> Vercel CDN handles DDoS. Razorpay handles payment fraud. No Upstash Redis required.

---

## Fix Registry

| Fix ID | Severity | Summary |
|---|---|---|
| FIX-SEC-01 | 🔴 CRITICAL | Remove dev admin bypass in middleware.ts |
| FIX-SEC-02 | 🔴 CRITICAL | Add security response headers to next.config.mjs |
| FIX-SEC-04 | 🔴 CRITICAL | Drop `password_hash NOT NULL` from admin_users |
| FIX-SEC-05 | 🔴 CRITICAL | Filter `is_active=true` in auth.ts JWT callback |
| FIX-SEC-07 | 🟠 HIGH | Migrate from @supabase/auth-helpers-nextjs to @supabase/ssr |
| FIX-SEC-08 | 🟠 HIGH | Add Database generic to all Supabase client calls |
| FIX-PAY-01 | 🔴 CRITICAL | Add payment.failed handler in CheckoutForm.tsx |
| FIX-PAY-02 | 🟠 HIGH | Send customer email on payment.failed webhook event |
| FIX-PAY-03 | 🟡 MEDIUM | Move coupon code out of URL query params |
| FIX-DB-01 | 🟠 HIGH | Add updated_at column + trigger to categories table |
| FIX-DB-02 | 🟠 HIGH | Add updated_at trigger to all remaining tables missing it |
| FIX-DB-03 | 🟡 MEDIUM | Add composite indexes for common query patterns |
| FIX-FE-01 | 🟠 HIGH | Add loading.tsx to all major route segments |
| FIX-FE-02 | 🟠 HIGH | Add error.tsx to all major route segments |
| FIX-FE-03 | 🟠 HIGH | Add generateStaticParams + revalidate to product/category pages |
| FIX-FE-04 | 🟡 MEDIUM | Add Radix + Swiper to optimizePackageImports in next.config.mjs |
| FIX-FE-05 | 🟡 MEDIUM | Wire GA4 — env var exists but zero gtag calls fire |
| FIX-FE-06 | 🟡 MEDIUM | Sitemap: fix categories.updated_at (depends on FIX-DB-01) |
| FIX-FE-07 | 🟡 MEDIUM | Add JSON-LD Product structured data to PDP |
| FIX-FE-08 | 🟡 MEDIUM | Add Open Graph image meta to PDP generateMetadata |
| FIX-INFRA-01 | 🔴 CRITICAL | GitHub Actions CI — lint + typecheck + test gate |
| FIX-INFRA-02 | ❌ Removed | Sentry — removed from project (June 2026) |
| FIX-INFRA-03 | 🟠 HIGH | Set up Vercel project — env vars, bom1 region, branch protection |
| FIX-INFRA-04 | 🟡 MEDIUM | Add /api/health endpoint |
| FIX-TEST-01 | 🔴 CRITICAL | Install Vitest + unit tests for razorpay.ts, auth.ts, coupon calc |
| FIX-TEST-02 | 🔴 CRITICAL | Integration tests for all 7 API route groups |
| FIX-TEST-03 | 🟠 HIGH | Playwright E2E — checkout, auth, admin flows |
| FIX-TEST-04 | 🟡 MEDIUM | k6 load test for /api/orders/create |
| FIX-OPS-01 | 🟠 HIGH | Admin seeding runbook — exact SQL for staging + production |
| FIX-OPS-02 | 🟡 MEDIUM | Razorpay webhook registration steps for production |

---

## Sprint 1 — Critical Security + Payment (Days 1–4)

**Goal:** All CRITICAL security bugs removed. payment.failed handled. CI exists.
**Dependency:** Local dev running. `npm run dev` starts. `/` renders.

---

### FIX-SEC-04 — Fix admin_users schema ← Do this FIRST, blocks seeding

**File:** `supabase/migrations/018_fix_admin_users.sql`

```sql
ALTER TABLE admin_users DROP COLUMN IF EXISTS password_hash;
```

Apply locally:
```bash
supabase db reset
```

Verify: `INSERT INTO admin_users (email, is_active) VALUES ('your@email.com', true);` must succeed without errors.

---

### FIX-OPS-01 — Seed admin user (do immediately after FIX-SEC-04)

Run in local Supabase SQL editor:
```sql
INSERT INTO admin_users (email, is_active, role)
VALUES ('your-google-email@gmail.com', true, 'super_admin')
ON CONFLICT (email) DO UPDATE SET is_active = true;
```

Staging — run same SQL in staging Supabase SQL editor after FIX-INFRA-03.

Verify: sign in with that Google account → `/admin` loads → any other Google account is redirected to `/auth/signin`.

---

### FIX-SEC-01 — Remove dev admin bypass

**File:** `middleware.ts`

Delete lines 17–19 (the `isDev && isAdminRoute` bypass block). Remove the `isDev` variable if it is only used for that bypass.

After the delete, the relevant section should read:
```ts
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  if (isAdminRoute) {
    const token = await getToken({ req: request })
    if (!token?.isAdmin) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

Verify locally: navigate to `/admin` without a session → redirects to `/auth/signin`. Sign in with seeded admin → loads `/admin`.

---

### FIX-SEC-05 — Filter is_active in JWT callback

**File:** `lib/auth.ts`

In the `jwt` callback where `admin_users` is queried, add `.eq('is_active', true)`:

```ts
// Before
const { data } = await supabase
  .from('admin_users')
  .select('email')
  .eq('email', token.email)
  .single()

// After
const { data } = await supabase
  .from('admin_users')
  .select('email')
  .eq('email', token.email)
  .eq('is_active', true)
  .single()
```

Verify: set `is_active = false` for an admin in DB → sign out → sign back in → `/admin` redirects to `/auth/signin`.

---

### FIX-SEC-02 — Security response headers

**File:** `next.config.mjs`

Add a `headers()` export:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

Verify on staging: `curl -I https://[staging-url] | grep -E "X-Frame|X-Content|Referrer|Permissions"`

---

### FIX-PAY-01 — payment.failed client listener

**File:** `app/(shop)/checkout/CheckoutForm.tsx`

Inside the `initRazorpay` function where the Razorpay instance is created, add the failure handler alongside the existing success handler:

```ts
const rz = new (window as any).Razorpay({
  key: data.key_id,
  amount: data.amount,
  currency: 'INR',
  order_id: data.razorpay_order_id,
  name: 'The Possah',
  description: 'Your order',
  handler: async (response: any) => {
    // existing success handler — do not change
  },
  modal: {
    ondismiss: () => {
      setPaymentError('Payment cancelled. Your cart is saved.')
      setIsSubmitting(false)
    },
  },
})

// ADD THIS — failure handler
rz.on('payment.failed', async (response: any) => {
  const errorDesc = response.error?.description ?? 'Payment failed'
  const errorCode = response.error?.code ?? 'UNKNOWN'

  setPaymentError(`Payment failed: ${errorDesc} (${errorCode}). Please try again.`)
  setIsSubmitting(false)

  // Update order to failed status
  try {
    await fetch('/api/orders/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: response.error?.metadata?.order_id,
        status: 'failed',
      }),
    })
  } catch {
    // non-critical — webhook will handle it
  }
})

rz.open()
```

Also ensure `paymentError` state and display exist in the component — add below the submit button if not present:
```tsx
{paymentError && (
  <p className="text-red-600 text-sm mt-2">{paymentError}</p>
)}
```

---

### FIX-PAY-02 — payment.failed webhook email

**File:** `app/api/payments/webhook/route.ts`

In the webhook handler, add the `payment.failed` branch:

```ts
if (event.event === 'payment.captured') {
  // existing handler — do not change
}

if (event.event === 'payment.failed') {
  const paymentEntity = event.payload.payment.entity
  const razorpayOrderId = paymentEntity.order_id

  // Find the order
  const { data: order } = await supabase
    .from('orders')
    .select('id, customer_email, customer_name, order_number')
    .eq('razorpay_order_id', razorpayOrderId)
    .single()

  if (order) {
    // Update order status
    await supabase
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('id', order.id)

    // Send failure email
    await sendPaymentFailedEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      orderNumber: order.order_number,
      errorDescription: paymentEntity.error_description ?? 'Payment could not be processed',
    })
  }
}
```

Add `sendPaymentFailedEmail` to `lib/email.ts`:
```ts
export async function sendPaymentFailedEmail({
  to,
  customerName,
  orderNumber,
  errorDescription,
}: {
  to: string
  customerName: string
  orderNumber: string
  errorDescription: string
}) {
  await resend.emails.send({
    from: 'The Possah <orders@thepossah.com>',
    to,
    subject: `Payment issue with order ${orderNumber}`,
    html: `
      <p>Hi ${customerName},</p>
      <p>We weren't able to process your payment for order <strong>${orderNumber}</strong>.</p>
      <p>Reason: ${errorDescription}</p>
      <p>Your cart items are still saved. Please try again at
        <a href="https://thepossah.com/checkout">thepossah.com/checkout</a>.
      </p>
      <p>If you need help, reply to this email or reach us on WhatsApp.</p>
      <p>— The Possah</p>
    `,
  })
}
```

---

### FIX-INFRA-01 — GitHub Actions CI

**File:** `.github/workflows/ci.yml` (create this file)

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Test
        run: npm test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NEXTAUTH_SECRET: test_secret
          NEXTAUTH_URL: http://localhost:3000
          RAZORPAY_KEY_SECRET: test_secret
          RAZORPAY_WEBHOOK_SECRET: test_webhook_secret
          RESEND_API_KEY: test_key
```

Also add `typecheck` script to `package.json` if not present:
```json
"typecheck": "tsc --noEmit"
```

**Sprint 1 exit criteria:**
- [ ] Admin bypass removed — `/admin` without session → redirects on local
- [ ] `is_active=false` admin → loses access on next sign-in
- [ ] 4 security headers on all responses (verified with curl)
- [ ] `payment.failed` — client shows error message, order updates to failed
- [ ] `payment.failed` webhook — customer receives failure email
- [ ] CI workflow runs on every push

---

## Sprint 2 — Test Suite + Database (Days 5–8)

**Goal:** Real test coverage exists. DB timestamps fixed. Indexes added. CI actually passes.

---

### FIX-TEST-01 — Vitest + unit tests

Install:
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom msw
```

**File: `vitest.config.ts`**
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 70,
        functions: 70,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

**File: `vitest.setup.ts`**
```ts
import '@testing-library/jest-dom'
```

Add to `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Unit tests to write** in `__tests__/unit/`:

`razorpay.test.ts` — 100% coverage required:
- `verifyRazorpayWebhookSignature`: valid signature returns true, tampered payload returns false, mismatched secret returns false
- `verifyRazorpayPaymentSignature`: valid returns true, tampered order_id returns false

`auth.test.ts`:
- JWT callback with active admin email → `token.isAdmin = true`
- JWT callback with inactive admin → `token.isAdmin = false`
- JWT callback with non-admin email → `token.isAdmin = false`

`coupon.test.ts`:
- `percent` type: 10% on ₹1000 → discount = ₹100
- `flat` type: ₹200 off on ₹1000 → discount = ₹200
- `free_shipping` type: shipping becomes ₹0
- `min_order_value` not met → coupon rejected
- Expired coupon → rejected
- `usage_count >= usage_limit` → rejected

---

### FIX-TEST-02 — API route integration tests

Use `msw` to mock Supabase and Razorpay. Write in `__tests__/integration/`:

`orders-create.test.ts`:
- Valid order → 200, order created in DB
- Price spoofing (client sends lower price) → 400, order not created
- Insufficient stock → 400 with stock error message
- Invalid coupon code → 400 with coupon error

`payments-webhook.test.ts`:
- `payment.captured` with valid signature → order marked paid
- `payment.captured` duplicate (already paid) → idempotent, no double email
- `payment.failed` → order marked failed, email sent
- Invalid webhook signature → 400

`payments-verify.test.ts`:
- Valid HMAC signature → order updated, 200
- Tampered signature → 400
- Duplicate verify call → idempotent

`coupons-validate.test.ts`:
- Valid active coupon → correct discount returned
- Expired coupon → 400
- Usage exhausted → 400
- Below min_order_value → 400

`admin-auth.test.ts`:
- Request without token → 401
- Request with non-admin token → 403
- Request with valid admin token → 200

---

### FIX-TEST-03 — Playwright E2E (first 3 flows)

Install:
```bash
npm install -D @playwright/test
npx playwright install chromium
```

**File: `playwright.config.ts`**
```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

Write in `e2e/`:

`catalog.spec.ts`:
- Homepage loads → click category → product grid renders
- Click product card → PDP loads with correct title
- Add to bag → cart count in header increments

`auth.spec.ts`:
- `/account` in dev mode → loads with mock user (no redirect)
- Sign-out link → clears session

`admin.spec.ts`:
- In dev mode → `/admin` loads
- `/admin/orders` → table renders
- Click first order row → detail page opens

---

### FIX-DB-01 — categories updated_at

**File:** `supabase/migrations/019_categories_timestamps.sql`

```sql
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Apply: `supabase db reset` locally, then push to staging.

---

### FIX-DB-02 — updated_at on all remaining tables

**File:** `supabase/migrations/020_missing_timestamps.sql`

Run this query on your local DB first to find which tables are missing `updated_at`:
```sql
SELECT table_name FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'updated_at'
ORDER BY table_name;
```

For each table that is missing it (typically: `orders`, `products`, `users`, `coupons`, `reviews`, `journal_articles`):
```sql
ALTER TABLE [table_name]
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER [table_name]_updated_at
  BEFORE UPDATE ON [table_name]
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### FIX-DB-03 — Composite indexes

**File:** `supabase/migrations/021_indexes.sql`

```sql
-- Orders: most common admin queries
CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON orders (payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status
  ON orders (fulfillment_status, created_at DESC);

-- Products: storefront listing
CREATE INDEX IF NOT EXISTS idx_products_active_category
  ON products (is_active, category_id);

CREATE INDEX IF NOT EXISTS idx_products_active_slug
  ON products (is_active, slug);

-- Product variants: PDP + stock checks
CREATE INDEX IF NOT EXISTS idx_variants_product
  ON product_variants (product_id);

-- Reviews: PDP approved reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_status
  ON reviews (product_id, status);

-- Wishlists: user lookup
CREATE INDEX IF NOT EXISTS idx_wishlists_user
  ON wishlists (user_id);
```

**Sprint 2 exit criteria:**
- [ ] `npm test` passes — all unit + integration green
- [ ] Playwright 3 flows green on local
- [ ] `categories.updated_at` exists and updates on edit
- [ ] All core tables have `updated_at` with working trigger
- [ ] Composite indexes applied to staging DB
- [ ] CI workflow runs tests and passes

---

## Sprint 3 — Frontend Quality + SEO (Days 9–12)

**Goal:** Loading states, error boundaries, ISR, GA4, Open Graph, JSON-LD. Supabase client migrated.

---

### FIX-FE-01 — loading.tsx on all route segments

Create these files. Each is a skeleton with matching layout dimensions — no spinners floating in void.

`app/(shop)/loading.tsx` — full page skeleton
`app/(shop)/shop/[category]/loading.tsx` — 12-card product grid skeleton
`app/(shop)/shop/[category]/[slug]/loading.tsx` — gallery skeleton left + info skeleton right
`app/(shop)/cart/loading.tsx` — line items skeleton + summary skeleton
`app/(shop)/account/loading.tsx` — profile info skeleton
`app/admin/loading.tsx` — stat cards skeleton + table skeleton
`app/admin/orders/loading.tsx` — table rows skeleton
`app/admin/products/loading.tsx` — table rows skeleton

Example pattern for all of them:
```tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* skeleton divs matching the real layout */}
      <div className="h-8 bg-[var(--color-border)] rounded w-1/3 mb-4" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-[var(--color-border)] rounded" />
        ))}
      </div>
    </div>
  )
}
```

---

### FIX-FE-02 — error.tsx on all route segments

Create error boundaries alongside each loading.tsx above.

All error files follow this pattern:
```tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-4">
      <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-widest">
        Something went wrong
      </p>
      <p className="text-[var(--color-text-muted)]">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-[var(--color-green)] text-[var(--color-bg)] text-xs font-mono uppercase tracking-widest"
      >
        Try Again
      </button>
    </div>
  )
}
```

Checkout error should also have: "Your cart is safe — no payment was taken."

---

### FIX-FE-03 — ISR with generateStaticParams

**PDP** `app/(shop)/shop/[category]/[slug]/page.tsx`:
```ts
import { createPublicClient } from '@/lib/supabase/public'

export const revalidate = 3600 // 1 hour

export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('products')
    .select('slug, categories(slug)')
    .eq('is_active', true)
  return (data ?? []).map((p) => ({
    category: (p.categories as any)?.slug ?? 'all',
    slug: p.slug,
  }))
}
```

**Category listing** `app/(shop)/shop/[category]/page.tsx`:
```ts
export const revalidate = 1800 // 30 min

export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data } = await supabase.from('categories').select('slug')
  return (data ?? []).map((c) => ({ category: c.slug }))
}
```

**Homepage** `app/(shop)/page.tsx`:
```ts
export const revalidate = 900 // 15 min
```

---

### FIX-FE-04 — optimizePackageImports

**File:** `next.config.mjs`

Add to `experimental`:
```js
experimental: {
  optimizePackageImports: [
    'swiper',
    '@radix-ui/react-accordion',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-select',
    '@radix-ui/react-tabs',
    'lucide-react',
  ],
},
```

---

### FIX-FE-05 — Wire GA4

Install:
```bash
npm install @next/third-parties
```

**File:** `app/layout.tsx`
```tsx
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  )
}
```

Add GA4 events in these files:

`app/(shop)/shop/[category]/[slug]/page.tsx` — view_item:
```ts
import { sendGAEvent } from '@next/third-parties/google'
// inside useEffect or on page load
sendGAEvent('event', 'view_item', { item_id: product.id, item_name: product.name, value: product.price })
```

`components/cart/CartDrawer.tsx` — add_to_cart:
```ts
sendGAEvent('event', 'add_to_cart', { item_id: product.id, item_name: product.name, value: product.price })
```

`app/(shop)/checkout/CheckoutForm.tsx` — begin_checkout:
```ts
sendGAEvent('event', 'begin_checkout', { value: cartTotal, currency: 'INR' })
```

`app/(shop)/checkout/CheckoutForm.tsx` — purchase (inside payment success handler):
```ts
sendGAEvent('event', 'purchase', {
  transaction_id: orderNumber,
  value: total,
  currency: 'INR',
})
```

Verify: GA4 Dashboard → Reports → Realtime → Events. Complete a test checkout on staging and confirm purchase event appears.

---

### FIX-FE-06 — Sitemap categories.updated_at

No code change needed. After FIX-DB-01 applies the `updated_at` column to categories, the sitemap will read it correctly.

Verify: `curl https://[staging-url]/sitemap.xml` — every `<url>` for a category has a valid `<lastmod>` date, not `undefined`.

---

### FIX-FE-07 — JSON-LD structured data on PDP

**File:** `app/(shop)/shop/[category]/[slug]/page.tsx`

Add inside the returned JSX, after the main content:
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      sku: product.sku ?? product.id,
      brand: {
        '@type': 'Brand',
        name: 'The Possah',
      },
      image: product.images?.map((img: any) => img.url) ?? [],
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: product.price,
        availability:
          product.is_active
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        url: `https://thepossah.com/shop/${params.category}/${params.slug}`,
      },
    }),
  }}
/>
```

---

### FIX-FE-08 — Open Graph images on PDP

**File:** `app/(shop)/shop/[category]/[slug]/page.tsx` — inside `generateMetadata`:

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug)

  return {
    title: `${product.name} — The Possah`,
    description: product.description,
    openGraph: {
      title: `${product.name} — The Possah`,
      description: product.description,
      images: product.images?.[0]?.url
        ? [{ url: product.images[0].url, width: 1200, height: 630, alt: product.name }]
        : [],
      type: 'website',
    },
    alternates: {
      canonical: `https://thepossah.com/shop/${params.category}/${params.slug}`,
    },
  }
}
```

---

### FIX-PAY-03 — Coupon code out of URL

**File:** `app/(shop)/checkout/CheckoutForm.tsx`

Find: `searchParams.get('coupon')` (approximately line 118).

Replace with reading from cart store:
```ts
// Remove
const couponFromUrl = searchParams.get('coupon')

// Add — read from Zustand cart store instead
const { appliedCoupon } = useCartStore()
const [couponCode, setCouponCode] = useState(appliedCoupon?.code ?? '')
```

Verify: apply a coupon on `/cart` → navigate to `/checkout` → coupon is still applied but the URL bar shows no `?coupon=` param.

---

### FIX-SEC-07 — Migrate Supabase client library

```bash
npm uninstall @supabase/auth-helpers-nextjs
npm install @supabase/ssr
```

**File: `lib/supabase/server.ts`** — rewrite using `@supabase/ssr`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )
}
```

Update `middleware.ts` to use the new SSR cookie pattern if needed (check `@supabase/ssr` docs for middleware example).

Run `npm run typecheck` — must pass after migration.

---

### Complete remaining Playwright E2E (3 more flows)

`e2e/checkout.spec.ts`:
- Add to cart → `/checkout` → fill form → Razorpay test modal opens
- Apply coupon on cart → discount reflected in total

`e2e/admin-orders.spec.ts`:
- Admin sign-in (dev mode) → `/admin/orders` → update order status to Shipped → status badge updates

**Sprint 3 exit criteria:**
- [ ] Every listed route segment has `loading.tsx` and `error.tsx`
- [ ] Product/category/homepage pages use ISR with correct `revalidate` value
- [ ] GA4 events fire in staging Realtime dashboard
- [ ] JSON-LD `Product` schema present on PDP (verify in page source)
- [ ] `sitemap.xml` has valid `<lastmod>` for all categories
- [ ] `@supabase/ssr` in use — `@supabase/auth-helpers-nextjs` uninstalled
- [ ] Coupon code not in URL bar at checkout
- [ ] Full Playwright suite (6 flows) green

---

## Sprint 4 — Infrastructure + Go-Live Gate (Days 13–16)

**Goal:** Sentry live, Vercel configured, health check added, production deploy.

---

### FIX-INFRA-03 — Vercel project setup

1. Install Vercel CLI: `npm i -g vercel`
2. `vercel` in repo root — link to project, select existing or create new
3. In Vercel Dashboard → Project Settings:
   - Region: `bom1` (Mumbai) — lowest latency for Indian customers
   - Add all 14 env vars from `.env.local.example` with staging values
   - Framework: Next.js (auto-detected)
4. Branch protection:
   - GitHub → Repo Settings → Branches → Add rule for `main`
   - Require CI status check to pass before merge
   - Require 1 approval

Staging URL will be auto-assigned. Every push to `main` deploys to staging automatically.

**DNS (Cloudflare + Vercel):**
```
Cloudflare DNS → thepossah.com

Type   Name   Value                  Proxy
CNAME  @      cname.vercel-dns.com   OFF (grey cloud)
CNAME  www    cname.vercel-dns.com   OFF (grey cloud)
```

Vercel Dashboard → Project → Settings → Domains → Add `thepossah.com` → SSL auto-provisions.

---

### FIX-INFRA-02 — Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

The wizard creates `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and patches `next.config.mjs`.

Set in Vercel env vars: `SENTRY_DSN=https://...@sentry.io/...`

Test: throw a deliberate error in a server component on staging → check Sentry dashboard → event appears within 30 seconds.

---

### FIX-INFRA-04 — Health check endpoint

**File:** `app/api/health/route.ts` (create new)

```ts
import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

export async function GET() {
  const supabase = createPublicClient()
  const { error } = await supabase
    .from('store_settings')
    .select('id')
    .limit(1)
    .single()

  if (error) {
    return NextResponse.json(
      { status: 'degraded', db: 'error', message: error.message },
      { status: 503 }
    )
  }

  return NextResponse.json({
    status: 'ok',
    db: 'connected',
    timestamp: new Date().toISOString(),
  })
}
```

Add to Vercel: Project → Settings → Health Checks → `/api/health`.
Set up UptimeRobot (free): monitor `https://thepossah.com/api/health` every 5 minutes, alert on non-200.

---

### FIX-SEC-08 — Database type generic

Generate Supabase types:
```bash
npx supabase gen types typescript --project-id [your-project-ref] > types/supabase.ts
```

Update all three Supabase clients to use the `Database` generic:
```ts
import type { Database } from '@/types/supabase'

createClient<Database>(url, key, options)
```

Run `npm run typecheck` — must pass.

---

### FIX-OPS-02 — Razorpay webhook registration

**Staging:**
1. Razorpay Dashboard → Settings → Webhooks → Add new webhook
2. URL: `https://[staging-url]/api/payments/webhook`
3. Secret: generate a random string → copy into `RAZORPAY_WEBHOOK_SECRET` env var on Vercel (staging)
4. Events: check `payment.captured` and `payment.failed`
5. Test: use Razorpay "Test webhook" button → confirm order updates in staging DB

**Production:** Same steps with `https://thepossah.com/api/payments/webhook` and production Vercel env.

---

### FIX-TEST-04 — k6 load test

Install k6 locally (not in CI).

**File:** `scripts/load-test.js`
```js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 50,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
}

export default function () {
  const payload = JSON.stringify({
    items: [{ productId: 'test-id', variantId: 'test-variant', qty: 1 }],
    shippingAddress: {
      name: 'Test User',
      phone: '9999999999',
      line1: '123 Test St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
  })

  const res = http.post(
    'https://[staging-url]/api/orders/create',
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  )

  check(res, { 'status is 200 or 400': (r) => r.status === 200 || r.status === 400 })
  sleep(1)
}
```

Run: `k6 run scripts/load-test.js`

Acceptable result: p95 < 2000ms, error rate < 1%. Document results.

---

## Go-Live Gate Checklist

**Every item must be ✅ before production deploy.**

### Security
- [ ] FIX-SEC-01: Dev bypass removed — `curl -I [staging]/admin` confirms redirect for unauthenticated request
- [ ] FIX-SEC-02: Security headers — `curl -I [staging]` shows all 4 headers
- [ ] FIX-SEC-04: `admin_users` schema fixed — `password_hash` column gone, seeding works
- [ ] FIX-SEC-05: `is_active` filter in JWT — deactivated admin loses access on next sign-in
- [ ] FIX-SEC-07: `@supabase/ssr` in use, `@supabase/auth-helpers-nextjs` not in `package.json`
- [ ] FIX-PAY-01: `payment.failed` client listener — test with Razorpay failure test card → error message shows
- [ ] FIX-PAY-02: `payment.failed` webhook — failure email received in inbox

### Testing
- [ ] `npm run lint` — 0 errors, 0 warnings
- [ ] `npm run typecheck` — 0 errors
- [ ] `npm test` — all unit + integration pass
- [ ] `npm run test:coverage` — `razorpay.ts` at 100%, global ≥ 70%
- [ ] Playwright E2E — all 6 flows green
- [ ] Manual checkout with Razorpay test card `4111 1111 1111 1111` → confirmation email received

### Infrastructure
- [ ] Vercel project configured — region `bom1`, all 14 env vars set
- [ ] GitHub Actions CI green on `main`
- [ ] Branch protection on `main` enforced (CI green required + 1 review)
- [ ] Sentry receiving errors from staging
- [ ] `/api/health` returns `{"status":"ok"}` on staging
- [ ] UptimeRobot monitor configured

### Database
- [ ] Migrations 018–021 applied to production Supabase
- [ ] Admin user seeded in production `admin_users`
- [ ] Razorpay production webhook registered with production URL

### Business Readiness
- [ ] Razorpay KYC complete — live keys obtained
- [ ] `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` switched to `rzp_live_` keys in Vercel production env
- [ ] Test purchase end-to-end with live keys (₹1 product)
- [ ] Confirmation email received by buyer
- [ ] Order appears in `/admin/orders`
- [ ] Custom domain DNS pointing to Vercel
- [ ] SSL certificate active (Vercel auto-provisions, takes ~2 min)

---

## Production Deploy Sequence

Run in order. No skips.

```bash
# 1. Staging smoke test
curl https://[staging-url]/api/health
# Expected: {"status":"ok","db":"connected"}

# 2. Apply all pending migrations to production Supabase
npx supabase db push --project-ref [prod-project-ref]

# 3. Seed production admin user — run in Supabase SQL editor (production project)
INSERT INTO admin_users (email, is_active, role)
VALUES ('admin@thepossah.com', true, 'super_admin')
ON CONFLICT (email) DO NOTHING;

# 4. Register Razorpay production webhook
# Dashboard → Settings → Webhooks → Add
# URL: https://thepossah.com/api/payments/webhook
# Events: payment.captured, payment.failed
# Copy secret → Vercel production env RAZORPAY_WEBHOOK_SECRET

# 5. Switch Razorpay to live keys in Vercel production env
# RAZORPAY_KEY_ID=rzp_live_...
# NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
# RAZORPAY_KEY_SECRET=...

# 6. Promote staging → production in Vercel Dashboard
# Deployments → latest → Promote to Production

# 7. DNS cutover (if not already done)
# Cloudflare → DNS → CNAME @ → cname.vercel-dns.com (proxy OFF)

# 8. Post-deploy smoke test
curl https://thepossah.com/api/health
# Open https://thepossah.com → homepage loads
# Place ₹1 test purchase → confirm payment in Razorpay dashboard
# Confirm order in /admin/orders
# Confirm confirmation email in inbox

# 9. Watch Sentry for 15 minutes — zero new errors
```

**Rollback:** Vercel Dashboard → Deployments → previous deployment → Promote to Production. Takes < 60 seconds.

---

## Post-Launch Backlog (after first stable week)

These do not block go-live.

| Priority | Item |
|---|---|
| 1 | Customer-facing order tracking — surface `tracking_number` + `courier` on `/account/orders` |
| 2 | Cart + wishlist DB sync — merge localStorage into DB on sign-in |
| 3 | Saved address auto-fill at checkout from `user_addresses` |
| 4 | Made-to-measure consultation form — save to `user_measurements`, notify admin |
| 5 | `/admin/customers` page — look up customer by email, see order history |
| 6 | State dropdown at checkout (replace free-text with 28 states + UTs) |
| 7 | `prefers-reduced-motion` CSS rule in `styles/globals.css` |
| 8 | Preload hero images with `priority={true}` on homepage |
| 9 | GST invoice generation on order confirmation email |
| 10 | UPI intent / QR flow for mobile (higher conversion than redirect) |
| 11 | `/admin/analytics` — top 10 products, low stock alerts |
| 12 | CSP header — catalogue all third-party origins, add in report-only mode first |
| 13 | Shiprocket integration — automated tracking updates |

---

## Sprint Summary

| Sprint | Days | Focus | Gate |
|---|---|---|---|
| Sprint 1 | 1–4 | Critical security + payment.failed + CI | Zero critical open, CI running |
| Sprint 2 | 5–8 | Test suite + DB timestamps + indexes | Tests green, CI passes |
| Sprint 3 | 9–12 | Loading/error states + ISR + GA4 + SEO + Supabase migration | Lighthouse ≥ 85, full E2E |
| Sprint 4 | 13–16 | Sentry + Vercel + health check + go-live gate | All gate items ✅ |

**Total:** 16 working days solo (~10 days with 2 devs running Sprint 2+3 in parallel).

---

---

# REALITY-CHECKED PLAN — Sprint 3 + 4 Remaining Work

**Verified against live DB on 2026-05-26 and actual file system.**
Sprint 1 ✅ fully done. Sprint 2 DB ✅ done, tests ❌ not written. Below is what remains.

---

## Pre-Sprint 3 Gate: Run Migration 022 First

Before writing any test or code that touches `orders.updated_at`, `coupons.updated_at`, etc., run this in Supabase SQL Editor (both staging and production when ready):

```
supabase/migrations/022_missing_updated_at.sql
```

Verify with:
```sql
SELECT table_name FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'updated_at'
ORDER BY table_name;
```
Must include: `cart_items, categories, coupons, homepage_config, journal_articles, orders, product_variants, products, reviews, store_settings, user_addresses, user_measurements, users`

---

## ⚠️ Schema Drift — Audit Before Tests

Two columns in the live DB do NOT match what the old docs (and possibly the code) assume. **Check these files before writing any tests that mock the DB:**

### reviews.is_approved (not status)

Live DB: `is_approved BOOLEAN` — no `status` TEXT column.

Check `app/api/admin/reviews/route.ts` and `app/admin/reviews/ReviewManager.tsx`. Any query using `.eq('status', 'pending')` is silently failing. The correct queries are:
```ts
// Pending (not yet reviewed)
.eq('is_approved', false)   // or IS NULL depending on your default

// Approved
.eq('is_approved', true)

// Rejected — no rejected state in current schema. 
// Either add a status column or handle reject as delete.
```

If the admin UI shows 3 states (pending/approve/reject) but the DB only has a boolean, a migration is needed to add a `status` column OR the UI needs to be simplified to approve/remove only.

### coupons.expiry_date (not expires_at)

Live DB: `expiry_date DATE` — not `expires_at TIMESTAMPTZ`.

Check `app/api/coupons/validate/route.ts`. The expiry check must compare against `expiry_date`, not `expires_at`:
```ts
// Correct
.gte('expiry_date', new Date().toISOString().split('T')[0])  // date comparison
// or in SQL:
WHERE expiry_date >= CURRENT_DATE OR expiry_date IS NULL
```

---

## Sprint 3 — Remaining Tasks (8 tasks)

### S3-A: FIX-SEC-07 — Migrate @supabase/auth-helpers-nextjs → @supabase/ssr

**Do this first. Everything else (typecheck, build, CI) depends on a clean client.**

```bash
npm uninstall @supabase/auth-helpers-nextjs
npm install @supabase/ssr
```

**Rewrite `lib/supabase/server.ts`:**
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

Rename export from `createServerClient` to `createClient` OR update all call sites — whichever is less churn. Check with grep:
```bash
grep -rn "createServerClient\|auth-helpers-nextjs" app/ lib/ --include="*.ts" --include="*.tsx"
```

After rewrite: `npm run typecheck` must pass, `npm run build` must pass.

**Gate:** `@supabase/auth-helpers-nextjs` no longer in `package.json`.

---

### S3-B: FIX-FE-01 + FIX-FE-02 — Missing loading.tsx + error.tsx

Files that exist: `(shop)/loading.tsx`, `(shop)/shop/[category]/loading.tsx`, `(shop)/shop/[category]/[slug]/loading.tsx`, `(shop)/cart/loading.tsx`, `(shop)/account/loading.tsx`, `admin/loading.tsx`, all matching error.tsx files.

**Still missing — create these 6 files:**

`app/admin/orders/loading.tsx`:
```tsx
export default function Loading() {
  return (
    <div className="animate-pulse space-y-3 p-6">
      <div className="h-8 bg-[var(--color-border)] rounded w-48 mb-6" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-[var(--color-border)] rounded" />
      ))}
    </div>
  )
}
```

`app/admin/products/loading.tsx` — same pattern, 10 rows.

`app/(shop)/cart/error.tsx`:
```tsx
'use client'
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-4">
      <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-widest">Something went wrong</p>
      <p className="text-[var(--color-text-muted)] text-sm">Your cart is safe — no payment was taken.</p>
      <button onClick={reset} className="px-6 py-3 bg-[var(--color-green)] text-[var(--color-bg)] text-xs font-mono uppercase tracking-widest">Try Again</button>
    </div>
  )
}
```

`app/(shop)/account/error.tsx` — same pattern, message: "Could not load your account."

`app/admin/orders/error.tsx` — same pattern, message: "Could not load orders."

`app/admin/products/error.tsx` — same pattern, message: "Could not load products."

---

### S3-C: FIX-FE-05 — Wire GA4 Events

Base `gtag` script is in `app/layout.tsx`. Use the raw `window.gtag` pattern (not `@next/third-parties` — not installed).

Add a shared helper `lib/analytics.ts`:
```ts
export function trackEvent(
  name: string,
  params: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    ;(window as any).gtag('event', name, params)
  }
}
```

Wire 4 calls:

**1. view_item** — `app/(shop)/shop/[category]/[slug]/page.tsx` — inside the client component or useEffect after product data is available:
```ts
import { trackEvent } from '@/lib/analytics'
// inside useEffect or after product loads:
trackEvent('view_item', { item_id: product.id, item_name: product.name, value: product.price, currency: 'INR' })
```

**2. add_to_cart** — find where add-to-cart action fires (likely `components/pdp/ProductInfo.tsx` or similar). Add:
```ts
trackEvent('add_to_cart', { item_id: productId, item_name: productName, value: price, currency: 'INR' })
```

**3. begin_checkout** — `app/(shop)/checkout/CheckoutForm.tsx` — at top of `onSubmit` before the fetch:
```ts
trackEvent('begin_checkout', { value: total, currency: 'INR' })
```

**4. purchase** — `CheckoutForm.tsx` — inside `onSuccess` handler, after `clearCart()`:
```ts
trackEvent('purchase', { transaction_id: order_number, value: total, currency: 'INR' })
```

Verify: GA4 Dashboard → Reports → Realtime → Events. Run a test checkout on staging, confirm `purchase` event appears.

---

### S3-D: FIX-TEST-01 — Write Vitest Unit Tests

Vitest config exists. `vitest.setup.ts` — check if it exists:
```bash
ls vitest.setup.ts
```
If missing, create:
```ts
import '@testing-library/jest-dom'
```

Create `__tests__/unit/razorpay.test.ts` — **must hit 100% coverage on `lib/razorpay.ts`:**
```ts
import { describe, it, expect } from 'vitest'
import { verifyRazorpayWebhookSignature, verifyRazorpayPaymentSignature } from '@/lib/razorpay'

describe('verifyRazorpayWebhookSignature', () => {
  it('returns true for valid signature', () => { /* ... */ })
  it('returns false for tampered payload', () => { /* ... */ })
  it('returns false for wrong secret', () => { /* ... */ })
})

describe('verifyRazorpayPaymentSignature', () => {
  it('returns true for valid HMAC', () => { /* ... */ })
  it('returns false for tampered order_id', () => { /* ... */ })
})
```

Create `__tests__/unit/auth.test.ts`:
- JWT callback: active admin email → `token.isAdmin = true`
- JWT callback: `is_active = false` → `token.isAdmin = false`
- JWT callback: unknown email → `token.isAdmin = false`

Create `__tests__/unit/coupon.test.ts`:
- `percent` type: 10% on ₹1000 → ₹100 discount
- `flat` type: ₹200 on ₹1000 → ₹200 discount
- `free_shipping` type → shipping = 0
- min_order_value not met → rejected
- `expiry_date` past → rejected ← **use `expiry_date DATE`, not `expires_at`**
- `usage_count >= usage_limit` → rejected

Run: `npm test` → all green.

---

### S3-E: FIX-TEST-02 — Write Integration Tests

Create `__tests__/integration/` — use `msw` to mock Supabase HTTP and Razorpay.

`orders-create.test.ts`:
- Valid cart → 200, order row in DB
- Price spoofed by client → 400, order not created
- Insufficient stock → 400 with stock message
- Invalid coupon → 400 with coupon message

`payments-webhook.test.ts`:
- `payment.captured` valid sig → order marked paid, stock decremented
- `payment.captured` already paid → idempotent, no double email
- `payment.failed` → order marked failed, email sent
- Invalid webhook signature → 400

`payments-verify.test.ts`:
- Valid HMAC → 200, order updated
- Tampered signature → 400
- Duplicate verify → idempotent

`coupons-validate.test.ts`:
- Active coupon + above min → discount returned
- Expired (`expiry_date < today`) → 400 ← **use `expiry_date`**
- usage_count = usage_limit → 400
- Below min_order_value → 400

`admin-auth.test.ts`:
- No token → 401
- Non-admin token → 403
- Valid admin token → 200

---

### S3-F: FIX-TEST-03 — Write Playwright E2E Tests

`playwright.config.ts` exists. Create `e2e/` folder with 5 files:

`e2e/catalog.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

test('homepage → category → PDP → add to bag', async ({ page }) => {
  await page.goto('/')
  // click first category link
  // expect product grid
  // click first product card
  // expect PDP title present
  // click add to bag
  // expect cart count header badge increments
})
```

`e2e/auth.spec.ts`:
- `/account` loads (dev mode mock or sign-in redirect)
- Sign-out clears session

`e2e/admin.spec.ts`:
- `/admin` loads
- `/admin/orders` table renders
- Click order row → detail page

`e2e/checkout.spec.ts`:
- Add to cart → `/checkout` → fill form → Razorpay modal opens
- Apply coupon on cart → discount reflected

`e2e/admin-orders.spec.ts`:
- Admin sign-in → `/admin/orders` → update status → badge updates

Run: `npm run test:e2e` → all 5 specs green.

**Sprint 3 gate:**
- [ ] `@supabase/auth-helpers-nextjs` gone from `package.json`
- [ ] `npm run typecheck` → 0 errors
- [ ] `npm run build` → passes
- [ ] 6 loading/error files exist for admin/orders and admin/products, cart, account
- [ ] GA4 purchase event visible in Realtime on staging test checkout
- [ ] `npm test` → all unit + integration green, razorpay.ts at 100% coverage
- [ ] `npm run test:e2e` → all 5 specs green

---

## Sprint 4 — Remaining Tasks (4 code + 2 external)

### S4-A: FIX-INFRA-02 — Install Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Wizard creates:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- patches `next.config.mjs`

Add to Vercel env: `SENTRY_DSN=https://...@sentry.io/...`

Add to `.env.local.example`: `SENTRY_DSN=`

Test: throw deliberate error in any server component on staging → Sentry dashboard event within 30s.

---

### S4-B: FIX-SEC-08 — Generate Supabase Type Generic

```bash
npx supabase gen types typescript --project-id [your-supabase-project-ref] > types/supabase.ts
```

Update all 3 Supabase client files to use the `Database` generic:
```ts
import type { Database } from '@/types/supabase'
// ...
createServerClient<Database>(url, key, options)
createBrowserClient<Database>(url, key)
// etc.
```

Run `npm run typecheck` — must pass with 0 errors.

Note: `lib/supabase/server.ts` currently has a comment "Database generic intentionally omitted" — this task removes that intentional omission now that the type file will exist.

---

### S4-C: FIX-TEST-04 — k6 Load Test Script

Install k6 locally (not in CI): https://k6.io/docs/get-started/installation/

Create `scripts/load-test.js`:
```js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 50,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
}

export default function () {
  const payload = JSON.stringify({
    items: [{ product_id: 'test-id', variant_id: 'test-variant', name: 'Test', image: '', price: 1000, qty: 1, colour: 'Red', size: 'S' }],
    contact: { first_name: 'Test', last_name: 'User', email: 'test@test.com', phone: '9999999999' },
    address: { line1: '123 Test St', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    delivery_option: 'standard',
    gift_wrap: false,
    coupon_code: null,
    subtotal: 1000,
    shipping: 199,
    coupon_discount: 0,
    gift_wrap_cost: 0,
    total: 1199,
  })

  const res = http.post(
    `${__ENV.BASE_URL}/api/orders/create`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  )

  check(res, { 'status 200 or 400': (r) => r.status === 200 || r.status === 400 })
  sleep(1)
}
```

Run against staging:
```bash
k6 run -e BASE_URL=https://[staging-url] scripts/load-test.js
```

Acceptable: p95 < 2000ms, error rate < 1%.

---

### S4-D: Go-Live Gate — Full Checklist Sweep

Run every item in the Go-Live Gate Checklist (above in this doc). Do it on staging before touching production. Nothing goes to production until every box is ticked.

---

### S4-EXT-1: Vercel Setup *(you do this in Vercel Dashboard)*

1. `npm i -g vercel` → `vercel` in repo root → link project
2. Dashboard → Project Settings → Region: `bom1` (Mumbai)
3. Add all env vars from `.env.local.example` (14 vars) with staging values
4. GitHub → Repo Settings → Branches → protect `main`: require CI + 1 review
5. DNS (Cloudflare): CNAME `@` → `cname.vercel-dns.com` proxy OFF, same for `www`
6. Vercel → Domains → Add `thepossah.com` → SSL auto-provisions

---

### S4-EXT-2: Razorpay Webhook Registration *(you do this in Razorpay Dashboard)*

**Staging:**
Razorpay Dashboard → Settings → Webhooks → Add
- URL: `https://[staging-url]/api/payments/webhook`
- Secret: generate random string → paste into Vercel env `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured` ✓ `payment.failed` ✓
- Use "Test webhook" button → verify order updates in staging DB

**Production:** Same steps with `https://thepossah.com/api/payments/webhook`

---

## Sprint 4 Execution Order

```
Run 022 migration in Supabase SQL Editor (staging)
  ↓
S3-A: Supabase SSR migration → typecheck + build green
  ↓
S3-B: 6 missing loading/error files (30 min)
  ↓
S3-C: GA4 events wired (lib/analytics.ts + 4 call sites)
  ↓
S3-D → S3-E → S3-F: Tests (unit → integration → E2E)
  ↓
S4-EXT-1: Vercel setup (you) ← do in parallel during test writing
  ↓
S4-A: Sentry install
  ↓
S4-B: Supabase type gen
  ↓
S4-C: k6 load test script
  ↓
S4-EXT-2: Razorpay webhook (staging, then prod)
  ↓
S4-D: Go-live gate checklist sweep → promote to production
```
