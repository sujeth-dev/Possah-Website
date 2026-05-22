# Possah 1.0 — Complete Testing Plan

**Stack:** Next.js 14 App Router · Supabase (PostgreSQL) · NextAuth · Razorpay · Resend · Zustand · TypeScript  
**Last Updated:** May 2026  
**Status:** Test infrastructure does not yet exist. This document is the authoritative plan to build it from zero.

---

## Testing Philosophy

Every rupee that enters this system goes through code. Code that has never been tested in isolation is code that will fail at the worst possible moment — on launch day, under real customer load, with real money. This plan is structured in four layers:

1. **Unit tests** — pure functions, helpers, crypto
2. **Integration tests** — API routes against a real local Supabase instance
3. **End-to-end tests** — browser-driven user flows via Playwright
4. **Non-functional tests** — load, security, performance, SEO

---

## Test Tooling Stack

| Layer | Tool | Reason |
|---|---|---|
| Unit + Integration | Vitest | Native ESM, zero config, fast, TypeScript first |
| React component | @testing-library/react + vitest | Standard, no Enzyme |
| API integration | Vitest + `undici` fetch | Tests Next.js route handlers directly |
| E2E | Playwright | Multi-browser, real browser, intercept network |
| Load | k6 | Scriptable in JS, CI-friendly, generates reports |
| Security scanning | OWASP ZAP (CLI) + npm audit | Automated in CI |
| Coverage | `@vitest/coverage-v8` | Native V8 coverage, no babel |

### Install commands

```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom undici
npm install -D @playwright/test
npx playwright install chromium firefox
npm install -D k6  # or install k6 binary globally
```

### Vitest config (`vitest.config.ts`)

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules', '.next', 'tests', '**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

### Playwright config (`playwright.config.ts`)

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['github']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## 1. Unit Tests

### 1.1 `lib/razorpay.ts` — Crypto & Payment Verification

**Critical.** This code controls whether a payment is accepted as genuine. A bug here = either rejected real payments or accepted fraudulent ones.

**File:** `tests/unit/razorpay.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import {
  createRazorpayOrder,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from '@/lib/razorpay'
import crypto from 'crypto'

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? 'test_secret'
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? 'webhook_secret'

describe('verifyRazorpayPaymentSignature', () => {
  it('returns true for a correctly signed payload', () => {
    const orderId = 'order_test123'
    const paymentId = 'pay_test456'
    const signature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    expect(verifyRazorpayPaymentSignature(orderId, paymentId, signature)).toBe(true)
  })

  it('returns false for a wrong signature', () => {
    expect(verifyRazorpayPaymentSignature('order_1', 'pay_1', 'deadbeef')).toBe(false)
  })

  it('returns false (not throws) when signature is empty string', () => {
    expect(verifyRazorpayPaymentSignature('order_1', 'pay_1', '')).toBe(false)
  })

  it('returns false (not throws) when signature is invalid hex of different length', () => {
    // This previously threw RangeError — regression guard
    expect(verifyRazorpayPaymentSignature('order_1', 'pay_1', 'abc')).toBe(false)
  })

  it('returns false when orderId is empty', () => {
    expect(verifyRazorpayPaymentSignature('', 'pay_1', 'anything')).toBe(false)
  })
})

describe('verifyRazorpayWebhookSignature', () => {
  it('returns true for a correct webhook signature', () => {
    const body = JSON.stringify({ event: 'payment.captured' })
    const sig = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    expect(verifyRazorpayWebhookSignature(body, sig)).toBe(true)
  })

  it('returns false for wrong webhook signature', () => {
    expect(verifyRazorpayWebhookSignature('{"event":"test"}', 'badsig')).toBe(false)
  })

  it('returns false (not throws) for malformed hex signature', () => {
    expect(verifyRazorpayWebhookSignature('body', 'xyz')).toBe(false)
  })
})
```

**Test cases to cover:**
- Valid signature → true
- Wrong signature → false
- Empty signature → false (not RangeError)
- Length-mismatched hex → false (not RangeError)
- Empty body → false
- Tampered body → false

---

### 1.2 `lib/utils.ts` — Formatting and Order Number Generation

**File:** `tests/unit/utils.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { formatPrice, generateOrderNumber } from '@/lib/utils'

describe('formatPrice', () => {
  it('formats integers as INR with ₹ symbol', () => {
    expect(formatPrice(1000)).toBe('₹1,000')
  })

  it('formats decimal amounts correctly', () => {
    expect(formatPrice(1499.5)).toBe('₹1,499.50')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('₹0')
  })

  it('formats large amounts with Indian comma grouping', () => {
    expect(formatPrice(100000)).toBe('₹1,00,000')
  })
})

describe('generateOrderNumber', () => {
  it('returns a string', () => {
    expect(typeof generateOrderNumber()).toBe('string')
  })

  it('starts with POS prefix', () => {
    expect(generateOrderNumber()).toMatch(/^POS/)
  })

  it('generates unique values on repeated calls', () => {
    const ids = new Set(Array.from({ length: 100 }, generateOrderNumber))
    expect(ids.size).toBe(100)
  })

  it('is URL-safe (no spaces or special chars)', () => {
    expect(generateOrderNumber()).toMatch(/^[A-Z0-9-]+$/)
  })
})
```

---

### 1.3 Coupon Discount Calculation Logic

Business logic for discount application must be correct before any order is processed.

**File:** `tests/unit/coupon-calc.test.ts`

```ts
import { describe, it, expect } from 'vitest'

// Extract the calculation logic from CheckoutForm into a testable pure function
// lib/coupon.ts — create this file
import {
  applyCouponDiscount,
  calculateShipping,
  calculateOrderTotal,
} from '@/lib/coupon'

describe('applyCouponDiscount — percent', () => {
  it('applies correct percentage discount', () => {
    const result = applyCouponDiscount(10000, { discount_type: 'percent', discount_value: 10 })
    expect(result).toBe(1000)
  })

  it('caps percent discount if max_discount_value exists', () => {
    const result = applyCouponDiscount(100000, {
      discount_type: 'percent',
      discount_value: 10,
      max_discount_value: 500,
    })
    expect(result).toBe(500)
  })
})

describe('applyCouponDiscount — fixed', () => {
  it('applies fixed discount', () => {
    const result = applyCouponDiscount(5000, { discount_type: 'fixed', discount_value: 500 })
    expect(result).toBe(500)
  })

  it('does not produce negative discount greater than subtotal', () => {
    const result = applyCouponDiscount(100, { discount_type: 'fixed', discount_value: 500 })
    expect(result).toBeLessThanOrEqual(100)
  })
})

describe('applyCouponDiscount — free_shipping', () => {
  it('returns 0 item discount (shipping handled separately)', () => {
    const result = applyCouponDiscount(5000, { discount_type: 'free_shipping', discount_value: 0 })
    expect(result).toBe(0)
  })
})

describe('calculateShipping', () => {
  it('returns 0 when free_shipping coupon applied', () => {
    expect(calculateShipping(5000, true)).toBe(0)
  })

  it('returns 0 when subtotal exceeds free shipping threshold', () => {
    expect(calculateShipping(5001, false)).toBe(0)
  })

  it('returns shipping cost below threshold', () => {
    expect(calculateShipping(999, false)).toBeGreaterThan(0)
  })
})

describe('calculateOrderTotal', () => {
  it('correctly sums subtotal + shipping - discount', () => {
    const total = calculateOrderTotal({
      subtotal: 5000,
      shipping: 200,
      discount: 500,
      giftWrap: 0,
      tax: 0,
    })
    expect(total).toBe(4700)
  })

  it('never produces a negative total', () => {
    const total = calculateOrderTotal({
      subtotal: 100,
      shipping: 0,
      discount: 1000,
      giftWrap: 0,
      tax: 0,
    })
    expect(total).toBeGreaterThanOrEqual(0)
  })
})
```

---

### 1.4 `lib/auth.ts` — Admin Allowlist Logic

**File:** `tests/unit/auth.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest'

// Mock supabase admin client
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
              .mockResolvedValueOnce({ data: { id: '123' }, error: null })  // admin user
              .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }),  // not admin
          })),
        })),
      })),
    })),
  })),
}))

import { isAdminEmail } from '@/lib/auth'

describe('isAdminEmail', () => {
  it('returns true when email exists in admin_users with is_active = true', async () => {
    expect(await isAdminEmail('admin@possah.com')).toBe(true)
  })

  it('returns false when email not in admin_users', async () => {
    expect(await isAdminEmail('random@gmail.com')).toBe(false)
  })

  it('returns false on Supabase error (fail closed)', async () => {
    expect(await isAdminEmail('error@test.com')).toBe(false)
  })
})
```

---

## 2. API Route Integration Tests

These tests run against a **real local Supabase instance** (`supabase start`). They test the full request→response→database cycle without a browser.

**Setup file:** `tests/setup.ts`

```ts
import { afterAll, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

beforeAll(async () => {
  // Seed a test product variant for order tests
  await supabase.from('product_variants').insert({
    id: 'test-variant-001',
    product_id: 'test-product-001',
    size: 'M',
    color: 'Green',
    price: 10000,
    stock_qty: 10,
    is_active: true,
  })
})

afterAll(async () => {
  // Clean up test data
  await supabase.from('orders').delete().like('order_number', 'TEST-%')
  await supabase.from('product_variants').delete().eq('id', 'test-variant-001')
})
```

---

### 2.1 `POST /api/orders/create`

**File:** `tests/integration/orders-create.test.ts`

**Test matrix:**

| Test | Input | Expected |
|---|---|---|
| Valid order, real prices | Correct variant IDs, quantities | 200, order_id returned |
| Price spoofing attempt | Client sends `price: 1` for ₹10,000 item | 422 — price mismatch rejected |
| Out-of-stock variant | `stock_qty = 0` test variant | 409 — variant out of stock |
| Invalid coupon | Expired coupon code | 400 — coupon invalid |
| Coupon limit reached | Coupon at `usage_count = usage_limit` | 400 — coupon exhausted |
| Missing required fields | No `items`, no `address` | 400 — validation error |
| Negative quantity | `qty: -1` | 400 — validation error |
| Zero quantity | `qty: 0` | 400 — validation error |
| Authenticated user | Valid session cookie | 200, user_id set on order |
| Guest order | No session | 200, user_id null |
| Razorpay order created | Valid order | `razorpay_order_id` in response |

```ts
import { describe, it, expect, beforeAll } from 'vitest'

const BASE = 'http://localhost:3000'

describe('POST /api/orders/create', () => {
  it('rejects price spoofing', async () => {
    const res = await fetch(`${BASE}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ variant_id: 'test-variant-001', qty: 1, price: 1 }],
        subtotal: 1,
        shipping: 0,
        discount: 0,
        giftWrap: 0,
        total: 1,
        address: validAddress(),
      }),
    })
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toMatch(/price/i)
  })

  it('rejects order when variant is out of stock', async () => {
    // Set stock to 0 first
    await setVariantStock('test-variant-001', 0)
    const res = await fetch(`${BASE}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validOrderPayload()),
    })
    expect(res.status).toBe(409)
    await setVariantStock('test-variant-001', 10)  // restore
  })

  it('creates a valid order and returns razorpay_order_id', async () => {
    const res = await fetch(`${BASE}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validOrderPayload()),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.razorpay_order_id).toBeTruthy()
    expect(body.order_number).toMatch(/^POS/)
  })
})
```

---

### 2.2 `POST /api/payments/webhook`

**This is the most critical route.** A bug here = money lost or inventory not decremented.

**File:** `tests/integration/payment-webhook.test.ts`

**Test matrix:**

| Test | Input | Expected |
|---|---|---|
| Valid `payment.captured` | Correct HMAC signature | 200, order marked `paid`, stock decremented |
| Invalid signature | Wrong HMAC | 400 rejected immediately |
| Missing signature header | No `X-Razorpay-Signature` | 400 |
| Unknown event type | `payment.failed` | 200 (acknowledged, no-op) |
| Duplicate webhook replay | Same event twice | 200, idempotent — stock not double-decremented |
| Order not found | Unknown `order_id` | 404 |
| Already paid order | Re-delivery of captured event | 200, idempotent |

```ts
import { describe, it, expect } from 'vitest'
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!

function signedWebhook(body: object) {
  const raw = JSON.stringify(body)
  const sig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex')
  return { raw, sig }
}

describe('POST /api/payments/webhook', () => {
  it('rejects requests with missing signature', async () => {
    const res = await fetch('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'payment.captured' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects requests with wrong signature', async () => {
    const res = await fetch('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': 'deadsignature',
      },
      body: JSON.stringify({ event: 'payment.captured' }),
    })
    expect(res.status).toBe(400)
  })

  it('processes payment.captured and decrements stock', async () => {
    // Pre-state: create a test pending order in DB
    const orderId = await createTestPendingOrder('test-variant-001', 2)
    const initialStock = await getVariantStock('test-variant-001')

    const payload = buildCapturedPayload(orderId)
    const { raw, sig } = signedWebhook(payload)

    const res = await fetch('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': sig,
      },
      body: raw,
    })

    expect(res.status).toBe(200)
    const finalStock = await getVariantStock('test-variant-001')
    expect(finalStock).toBe(initialStock - 2)  // stock decremented by order quantity
  })
})
```

---

### 2.3 `POST /api/coupons/validate`

**File:** `tests/integration/coupons.test.ts`

| Test | Input | Expected |
|---|---|---|
| Valid percent coupon | Active coupon, code matches | 200, `discount_type: percent` |
| Valid fixed coupon | Active coupon | 200, `discount_type: fixed` |
| Valid free_shipping coupon | Active coupon | 200, `discount_type: free_shipping`, shipping not applied to item discount |
| Expired coupon | `expires_at` in past | 400 |
| Usage limit reached | `usage_count >= usage_limit` | 400 |
| Wrong coupon code | Typo | 404 |
| Inactive coupon | `is_active = false` | 400 |
| Below minimum order | Subtotal below `min_order_value` | 400 with minimum amount message |
| Code is case-sensitive/insensitive | Uppercase vs lowercase | Consistent behavior |

---

### 2.4 `POST /api/contact`

| Test | Input | Expected |
|---|---|---|
| Valid form submission | Name, email, message | 200, Resend called |
| Missing required field | No email | 400 |
| Invalid email format | `not-an-email` | 400 |
| XSS payload in message | `<script>alert(1)</script>` | 200 accepted, stored sanitized or as-is (not executed) |
| Rate limiting (when implemented) | 6 requests in 1 minute from same IP | 429 |

---

### 2.5 Admin Routes Auth Guard

**File:** `tests/integration/admin-auth.test.ts`

Every admin API route must be tested for auth enforcement.

| Route | Test | Expected |
|---|---|---|
| `GET /api/admin/products` | No session cookie | 401 |
| `GET /api/admin/products` | Valid session, not in `admin_users` | 403 |
| `GET /api/admin/products` | Valid admin session | 200 |
| `POST /api/admin/products` | Non-admin session | 403 |
| `DELETE /api/admin/products/[id]` | Non-admin session | 403 |
| `GET /api/admin/orders` | No session | 401 |
| `PATCH /api/admin/orders/[id]` | Valid admin | 200 |

---

### 2.6 `GET /api/search`

| Test | Input | Expected |
|---|---|---|
| Valid query | `q=saree` | 200, array of products |
| Empty query | `q=` | 200, empty array or all products |
| Special characters | `q=<script>` | 200, sanitized results |
| Long query | 1000-char string | 200 or 400, no server crash |
| No `q` param | No query string | Defined behavior, not 500 |

---

### 2.7 Supabase RPC Functions

**File:** `tests/integration/rpc.test.ts`

Test the atomic RPCs directly against the database.

```ts
import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

describe('decrement_variant_stock RPC', () => {
  it('decrements stock correctly', async () => {
    await supabase.from('product_variants').update({ stock_qty: 5 }).eq('id', 'test-variant-001')
    const { data } = await supabase.rpc('decrement_variant_stock', {
      p_variant_id: 'test-variant-001',
      p_qty: 2,
    })
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock_qty')
      .eq('id', 'test-variant-001')
      .single()
    expect(variant?.stock_qty).toBe(3)
  })

  it('does not go below zero', async () => {
    await supabase.from('product_variants').update({ stock_qty: 1 }).eq('id', 'test-variant-001')
    const { data } = await supabase.rpc('decrement_variant_stock', {
      p_variant_id: 'test-variant-001',
      p_qty: 5,  // more than available
    })
    // Expect the RPC to return false/fail — not silently go to -4
    expect(data).toBeFalsy()
  })
})

describe('increment_coupon_usage RPC', () => {
  it('increments usage_count', async () => {
    // Create test coupon at usage_count = 0, usage_limit = 2
    const couponId = await createTestCoupon(0, 2)
    await supabase.rpc('increment_coupon_usage', { p_coupon_id: couponId })
    const { data } = await supabase.from('coupons').select('usage_count').eq('id', couponId).single()
    expect(data?.usage_count).toBe(1)
  })

  it('returns false and does NOT increment when limit is reached', async () => {
    const couponId = await createTestCoupon(2, 2)  // already at limit
    const { data } = await supabase.rpc('increment_coupon_usage', { p_coupon_id: couponId })
    expect(data).toBe(false)
    const { data: coupon } = await supabase.from('coupons').select('usage_count').eq('id', couponId).single()
    expect(coupon?.usage_count).toBe(2)  // not incremented
  })
})
```

---

## 3. End-to-End Tests (Playwright)

These tests drive a real browser against a running development server with a seeded test database. They cover the complete customer journey.

### 3.1 Homepage + Navigation

**File:** `tests/e2e/homepage.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test('homepage loads with hero slider', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Possah/i)
  await expect(page.locator('[data-testid="hero-slider"]')).toBeVisible()
})

test('announcement bar is visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-testid="announcement-bar"]')).toBeVisible()
})

test('header nav links navigate correctly', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /women/i }).click()
  await expect(page).toHaveURL('/women')
})

test('mobile nav opens on small screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await page.getByRole('button', { name: /menu/i }).click()
  await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
})
```

---

### 3.2 Shop + PDP Flow

**File:** `tests/e2e/shop.spec.ts`

```ts
test('category page lists products', async ({ page }) => {
  await page.goto('/shop/sarees')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
})

test('filters update product list', async ({ page }) => {
  await page.goto('/shop/sarees')
  await page.getByLabel('Size').selectOption('S')
  await expect(page.locator('[data-testid="product-card"]')).toBeDefined()
})

test('PDP loads with gallery and add to cart button', async ({ page }) => {
  await page.goto('/shop/sarees/test-saree-slug')
  await expect(page.locator('[data-testid="product-gallery"]')).toBeVisible()
  await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible()
})

test('add to cart increments cart count', async ({ page }) => {
  await page.goto('/shop/sarees/test-saree-slug')
  const cartCount = page.locator('[data-testid="cart-count"]')
  const before = Number(await cartCount.textContent() ?? '0')
  await page.getByRole('button', { name: /add to cart/i }).click()
  await expect(cartCount).toHaveText(String(before + 1))
})
```

---

### 3.3 Cart + Checkout Flow (Full Purchase Journey)

**File:** `tests/e2e/checkout.spec.ts`

This is the most important E2E suite. It must pass before every deployment.

```ts
test('complete checkout flow with Razorpay (test mode)', async ({ page }) => {
  // 1. Add product to cart
  await page.goto('/shop/sarees/test-saree-slug')
  await page.getByRole('button', { name: /add to cart/i }).click()

  // 2. Go to cart
  await page.goto('/cart')
  await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1)
  await page.getByRole('button', { name: /checkout/i }).click()

  // 3. Fill checkout form
  await page.fill('[name="fullName"]', 'Test Customer')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="phone"]', '9999999999')
  await page.fill('[name="address"]', '123 Test Street')
  await page.fill('[name="city"]', 'Mumbai')
  await page.selectOption('[name="state"]', 'Maharashtra')
  await page.fill('[name="pincode"]', '400001')

  // 4. Intercept Razorpay (mock payment in test)
  await page.route('**/api/orders/create', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        razorpay_order_id: 'order_test_mock',
        order_number: 'POS-TEST-001',
        amount: 10000,
      }),
    })
  })

  await page.route('**/api/payments/verify', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
  })

  await page.getByRole('button', { name: /pay/i }).click()

  // 5. Confirm redirect to order confirmation
  await expect(page).toHaveURL(/\/order\/confirmation/)
  await expect(page.getByText(/order confirmed/i)).toBeVisible()
})

test('invalid coupon shows error message', async ({ page }) => {
  await addItemToCart(page)
  await page.goto('/checkout')
  await page.fill('[name="couponCode"]', 'INVALIDCODE')
  await page.getByRole('button', { name: /apply/i }).click()
  await expect(page.getByText(/invalid|not found|expired/i)).toBeVisible()
})

test('valid percent coupon applies discount', async ({ page }) => {
  await addItemToCart(page)
  await page.goto('/checkout')
  await page.fill('[name="couponCode"]', 'TESTPERCENT10')
  await page.getByRole('button', { name: /apply/i }).click()
  await expect(page.getByText(/discount applied/i)).toBeVisible()
  // Verify the total decreased
})

test('free shipping coupon zeroes shipping cost', async ({ page }) => {
  await addItemToCart(page)
  await page.goto('/checkout')
  await page.fill('[name="couponCode"]', 'FREESHIP')
  await page.getByRole('button', { name: /apply/i }).click()
  await expect(page.getByText(/free shipping/i)).toBeVisible()
  // Shipping line should show ₹0
  await expect(page.locator('[data-testid="shipping-cost"]')).toHaveText('₹0')
})
```

---

### 3.4 Auth Flow

**File:** `tests/e2e/auth.spec.ts`

```ts
test('unauthenticated user is redirected to sign-in from /admin', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/auth\/signin/)
})

test('sign-in page has Google login button', async ({ page }) => {
  await page.goto('/auth/signin')
  await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
})

test('/account redirects unauthenticated users', async ({ page }) => {
  await page.goto('/account')
  await expect(page).toHaveURL(/\/auth\/signin/)
})
```

---

### 3.5 Search

**File:** `tests/e2e/search.spec.ts`

```ts
test('search returns results for a known product name', async ({ page }) => {
  await page.goto('/search?q=saree')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
})

test('search shows empty state for no results', async ({ page }) => {
  await page.goto('/search?q=zzznoresults999')
  await expect(page.getByText(/no results|nothing found/i)).toBeVisible()
})

test('search input on header triggers navigation to search page', async ({ page }) => {
  await page.goto('/')
  await page.fill('[data-testid="search-input"]', 'lehenga')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/search\?q=lehenga/)
})
```

---

### 3.6 Admin Dashboard (Admin User Session Required)

**File:** `tests/e2e/admin.spec.ts`

Run with a seeded admin session cookie.

```ts
test('admin dashboard loads stat cards', async ({ page, context }) => {
  await loginAsAdmin(context)
  await page.goto('/admin')
  await expect(page.locator('[data-testid="stat-card"]')).toHaveCount(4)
})

test('admin products list renders', async ({ page, context }) => {
  await loginAsAdmin(context)
  await page.goto('/admin/products')
  await expect(page.locator('table')).toBeVisible()
})

test('non-admin Google account is blocked from admin', async ({ page, context }) => {
  await loginAsNonAdmin(context)
  await page.goto('/admin')
  await expect(page).not.toHaveURL('/admin')
})
```

---

## 4. Non-Functional Tests

### 4.1 Load Testing (k6)

Run these against a staging environment. Not against production. Not against a local DB with 10 rows.

**File:** `tests/load/checkout-load.js`

```js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // ramp up to 20 users
    { duration: '1m', target: 50 },    // hold at 50 users (launch day estimate)
    { duration: '30s', target: 100 },  // spike to 100
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],  // 95% of requests < 2s
    'http_req_failed': ['rate<0.01'],     // < 1% error rate
  },
}

export default function () {
  // Homepage load
  const home = http.get('https://staging.thepossah.com/')
  check(home, { 'homepage 200': (r) => r.status === 200 })

  // Shop page load
  const shop = http.get('https://staging.thepossah.com/shop/sarees')
  check(shop, { 'shop page 200': (r) => r.status === 200 })

  // PDP
  const pdp = http.get('https://staging.thepossah.com/shop/sarees/test-slug')
  check(pdp, { 'pdp 200': (r) => r.status === 200, 'pdp < 1.5s': (r) => r.timings.duration < 1500 })

  sleep(1)
}
```

**Targets to hit:**
- Homepage P95 < 1.5s
- Shop/category page P95 < 2s
- PDP P95 < 2s
- Search API P95 < 500ms
- Order create API P95 < 3s
- Zero 5xx under 50 concurrent users

---

### 4.2 Load Test — Order Endpoint Stress

```js
// tests/load/order-stress.js
// Tests that concurrent orders don't race on stock or coupons

export const options = {
  vus: 20,
  duration: '30s',
}

export default function () {
  const payload = JSON.stringify({
    items: [{ variant_id: 'load-test-variant', qty: 1, price: 5000 }],
    // ...rest of valid payload
    coupon_code: 'ONEUSE',  // usage_limit = 1 — only 1 VU should succeed
  })

  const res = http.post('https://staging.thepossah.com/api/orders/create', payload, {
    headers: { 'Content-Type': 'application/json' },
  })

  // Most will get 400 (coupon exhausted) — that is correct behavior
  check(res, {
    'is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'not 500': (r) => r.status !== 500,
  })
}
```

**Pass criteria:** Exactly 1 order succeeds with `ONEUSE` coupon. All others get 400. Zero 500s.

---

### 4.3 Security Tests

**A. Signature forgery (automated)**

```bash
# Run against staging
curl -X POST https://staging.thepossah.com/api/payments/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Razorpay-Signature: aaabbbccc' \
  -d '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_fake"}}}}' \
  -w "\nHTTP: %{http_code}\n"
# Must return 400. Not 200, not 500.
```

**B. Price spoofing (automated)**

```bash
curl -X POST https://staging.thepossah.com/api/orders/create \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"variant_id":"real-variant","qty":1,"price":1}],"subtotal":1,"shipping":0,"discount":0,"total":1,"address":{...}}' \
  -w "\nHTTP: %{http_code}\n"
# Must return 422 (price mismatch) — never 200
```

**C. Admin route bypass**

```bash
# No cookie at all
curl https://staging.thepossah.com/api/admin/products -w "\nHTTP: %{http_code}\n"
# Must return 401

# Tampered JWT (invalid signature)
curl https://staging.thepossah.com/api/admin/products \
  -H 'Cookie: next-auth.session-token=tampered.jwt.token' \
  -w "\nHTTP: %{http_code}\n"
# Must return 401 or 403
```

**D. SQL Injection probe**

```bash
curl "https://staging.thepossah.com/api/search?q=saree'%20OR%201=1--" \
  -w "\nHTTP: %{http_code}\n"
# Must return 200 with normal results or 400 — never a database error dump
```

**E. OWASP ZAP automated scan**

```bash
# Run ZAP baseline scan against staging
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://staging.thepossah.com \
  -r zap-report.html
```

**F. Security headers check**

```bash
curl -I https://thepossah.com | grep -E "X-Frame|X-Content|Strict|Referrer|Content-Security"
# Must show all four headers
```

---

### 4.4 SEO and Metadata Tests

**File:** `tests/e2e/seo.spec.ts`

```ts
test('homepage has correct title and OG image', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Possah/i)
  const ogImage = await page.getAttribute('meta[property="og:image"]', 'content')
  expect(ogImage).toBeTruthy()
  expect(ogImage).not.toContain('undefined')
})

test('PDP has product name in title and description', async ({ page }) => {
  await page.goto('/shop/sarees/test-slug')
  const title = await page.title()
  expect(title.length).toBeGreaterThan(10)
  const desc = await page.getAttribute('meta[name="description"]', 'content')
  expect(desc?.length).toBeLessThanOrEqual(160)
})

test('sitemap.xml is accessible and contains product URLs', async ({ page }) => {
  const res = await page.request.get('/sitemap.xml')
  expect(res.status()).toBe(200)
  const body = await res.text()
  expect(body).toContain('<url>')
  expect(body).toContain('thepossah.com')
})

test('robots.txt exists and does not block all crawlers', async ({ page }) => {
  const res = await page.request.get('/robots.txt')
  expect(res.status()).toBe(200)
  const body = await res.text()
  expect(body).not.toContain('Disallow: /')
})

test('OG default image file returns 200', async ({ page }) => {
  const res = await page.request.get('/images/og-default.jpg')
  expect(res.status()).toBe(200)
})
```

---

### 4.5 Accessibility Tests

```ts
// Install: npm install -D axe-playwright
import { test, expect } from '@playwright/test'
import { checkA11y, injectAxe } from 'axe-playwright'

test('homepage has no critical accessibility violations', async ({ page }) => {
  await page.goto('/')
  await injectAxe(page)
  await checkA11y(page, undefined, {
    axeOptions: { runOnly: ['wcag2a', 'wcag2aa'] },
    detailedReport: true,
  })
})

test('checkout form has no critical a11y violations', async ({ page }) => {
  await addItemToCart(page)
  await page.goto('/checkout')
  await injectAxe(page)
  await checkA11y(page)
})
```

---

## 5. CI/CD Integration

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

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
      - run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4

  integration:
    runs-on: ubuntu-latest
    services:
      supabase:
        image: supabase/postgres:15.1.0.117
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: npm ci
      - run: supabase start
      - run: supabase db reset
      - run: npm run test:integration
      - run: supabase stop

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

**package.json scripts:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:load": "k6 run tests/load/checkout-load.js"
  }
}
```

---

## 6. Test Data Management

### Fixtures

```ts
// tests/fixtures/orders.ts
export function validAddress() {
  return {
    fullName: 'Test User',
    email: 'test@possah.com',
    phone: '9999999999',
    address: '1 Test Lane',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India',
  }
}

export function validOrderPayload(variantId = 'test-variant-001') {
  return {
    items: [{ variant_id: variantId, qty: 1, price: 10000 }],
    subtotal: 10000,
    shipping: 200,
    discount: 0,
    giftWrap: 0,
    total: 10200,
    address: validAddress(),
  }
}
```

### Database helpers

```ts
// tests/helpers/db.ts
import { createClient } from '@supabase/supabase-js'

export const testDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getVariantStock(variantId: string) {
  const { data } = await testDb
    .from('product_variants')
    .select('stock_qty')
    .eq('id', variantId)
    .single()
  return data?.stock_qty ?? 0
}

export async function setVariantStock(variantId: string, qty: number) {
  await testDb.from('product_variants').update({ stock_qty: qty }).eq('id', variantId)
}

export async function createTestCoupon(usageCount: number, usageLimit: number) {
  const { data } = await testDb.from('coupons').insert({
    code: `TEST-${Date.now()}`,
    discount_type: 'percent',
    discount_value: 10,
    usage_count: usageCount,
    usage_limit: usageLimit,
    is_active: true,
  }).select('id').single()
  return data!.id
}
```

---

## 7. Coverage Targets

| Layer | Target | Priority |
|---|---|---|
| `lib/razorpay.ts` | 100% | CRITICAL — crypto |
| `lib/utils.ts` | 100% | High |
| `lib/auth.ts` | 90% | High — security |
| `app/api/orders/create/route.ts` | 85% | High — money |
| `app/api/payments/webhook/route.ts` | 90% | CRITICAL — money |
| `app/api/coupons/validate/route.ts` | 85% | High |
| Admin API routes | 75% | Medium |
| UI components | 60% | Low (E2E covers) |
| **Global minimum** | **75%** | CI blocks merge below this |

---

## 8. Pre-Launch Test Checklist

Before DNS cutover to production, every item must be checked.

- [ ] All unit tests passing
- [ ] All integration tests passing against seeded local DB
- [ ] Playwright E2E full checkout flow passing (Razorpay test mode)
- [ ] Webhook signature rejection test passing
- [ ] Price spoofing rejection test passing
- [ ] Admin non-auth bypass test passing
- [ ] Security headers present on staging (curl check)
- [ ] OG image returns 200
- [ ] Sitemap accessible and valid XML
- [ ] robots.txt not blocking crawlers
- [ ] k6 load test: homepage, shop, PDP all P95 < 2s at 50 concurrent users
- [ ] Zero 5xx errors in k6 run
- [ ] OWASP ZAP scan: zero High or Critical findings
- [ ] Coupon race condition test: only 1 success on `usage_limit = 1` under 20 concurrent requests
- [ ] Stock not double-decremented on webhook replay

---

*This document is owned by QA. Every new API route added must add corresponding test cases to sections 2 and 3 before the PR merges.*
