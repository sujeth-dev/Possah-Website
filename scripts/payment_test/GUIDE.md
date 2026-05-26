# Payment API Test Suite — Guide

Self-contained, runnable test suite for the full Possah payment flow:
coupon validation → order creation → payment verification → webhook handling.

Any agent can follow this guide end-to-end, produce a full pass/fail report, and propose fixes for anything that fails.

---

## Folder map

```
scripts/payment_test/
  GUIDE.md                ← this file
  run.mjs                 ← orchestrator (seed → test → report → cleanup)
  seed.mjs                ← inserts test products, coupons, orders into Supabase
  cleanup.mjs             ← removes all seeded test rows
  lib/
    env.mjs               ← parses .env.local, validates required vars
    db.mjs                ← Supabase client (service role, bypasses RLS)
    http.mjs              ← fetch wrapper (api + webhook special handler)
    crypto.mjs            ← HMAC signing helpers (signPayment, signWebhook, tamper)
    assert.mjs            ← assertion helpers + result collector
    report.mjs            ← writes markdown report to reports/
  tests/
    01-coupon-validate.mjs  ← 13 cases: valid types, expiry, usage, min order, math
    02-order-create.mjs     ← 18 cases: pricing, stock, coupons, validation errors
    03-payment-verify.mjs   ← 9 cases: HMAC verify, idempotency, tamper, missing fields
    04-webhook-captured.mjs ← 8 cases: captured event, idempotency, bad sig, unknown order
    05-webhook-failed.mjs   ← 8 cases: failed event, no downgrade of paid, unknown event
  reports/
    payment-results-{ts}.md ← generated on each run
```

---

## Prerequisites

### 1. Node version
Requires Node 18+ (native fetch, top-level await in `.mjs` files).

```bash
node --version   # must be >= v18.0.0
```

### 2. Dev server running

```bash
# Terminal 1 — keep running during tests
NODE_ENV=development npm run dev
```

Wait for `✓ Ready in ...ms` before running tests.

The payment API routes do not have a dev-mode auth bypass (unlike admin routes).
They hit Razorpay and Supabase normally — only credentials differ between test/live.

### 3. Environment variables in `.env.local`

All five must be set:

```
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

Check:
```bash
cat .env.local | grep -E '(SUPABASE_URL|SERVICE_ROLE|RAZORPAY)'
```

### 4. Razorpay keys must be test keys

`RAZORPAY_KEY_ID` **must** start with `rzp_test_`.
The orchestrator exits with a fatal error if a live key is detected.
Module 02 (order create) calls the real Razorpay API to create test orders —
this has no financial impact but requires valid test credentials.

Modules 03–05 (verify + webhooks) compute HMAC signatures locally and never
call Razorpay directly. They work as long as `RAZORPAY_KEY_SECRET` and
`RAZORPAY_WEBHOOK_SECRET` are correct.

### 5. No additional installs needed
`@supabase/supabase-js` is already in `node_modules`.
Scripts run directly with `node` — no `tsx`, no transpiler, no build step.

---

## Running the tests

### Full run (recommended)

```bash
npm run test:payment
```

Equivalent to:
```bash
NODE_ENV=development node scripts/payment_test/run.mjs
```

This runs: preflight → seed → 5 test modules → report → cleanup.
Exit code `0` = all pass. Exit code `1` = at least one failure (CI-safe).

### Keep seed data after run (debug mode)

```bash
npm run test:payment:keep
# or
SKIP_CLEANUP=1 NODE_ENV=development node scripts/payment_test/run.mjs
```

Useful when you want to inspect rows in Supabase after a failure.
Removes manually with:
```bash
npm run cleanup:payment
```

### Skip seed (data already in DB)

```bash
SKIP_SEED=1 NODE_ENV=development node scripts/payment_test/run.mjs
```

### Seed only (no tests)

```bash
npm run seed:payment
# or
node scripts/payment_test/seed.mjs
```

### Cleanup only

```bash
npm run cleanup:payment
# or
node scripts/payment_test/cleanup.mjs
```

### Run a single module manually (for iteration)

```bash
# Seed first so data exists
node scripts/payment_test/seed.mjs

# Run one module in isolation (you need to provide a ctx object)
node -e "
import('./tests/01-coupon-validate.mjs').then(m => m.run({}).then(r => {
  const failed = r.filter(x => !x.passed)
  console.log(failed.length ? failed : 'All passed')
}))
"
```

---

## Seed data reference

The seed inserts stable, idempotent test rows using upsert.
All markers are prefixed so cleanup can delete them precisely.

### Products

| Order number | Slug | Price | Stock | Notes |
|---|---|---|---|---|
| — | `test-pay-product-alpha` | ₹2500 | 20 | Used in most order tests |
| — | `test-pay-product-beta` | ₹1000 | 1 | Used for stock limit tests |

### Coupons

| Code | Type | Value | Min order | Expiry | Active | Notes |
|---|---|---|---|---|---|---|
| `PAYTESTPCT20` | percent | 20% | — | none | yes | 20% off |
| `PAYTESTFLAT300` | flat | ₹300 | ₹1500 | none | yes | ₹300 flat off |
| `PAYTESTSHIP` | free_shipping | — | — | none | yes | free shipping |
| `PAYTESTMIN2000` | flat | ₹200 | ₹2000 | none | yes | tests min order guard |
| `PAYTESTEXPIRED` | percent | 10% | — | yesterday | yes | tests expiry guard |
| `PAYTESTUSED` | flat | ₹100 | — | none | yes | `usage_count = usage_limit` |
| `PAYTESTINACT` | flat | ₹50 | — | none | no | `is_active = false` |

### Orders (pre-seeded for webhook + verify tests)

| order_number | razorpay_order_id | payment_status |
|---|---|---|
| `PAY-TEST-PENDING` | `order_paytest_pending_001` | pending |
| `PAY-TEST-PAID` | `order_paytest_paid_001` | paid |

`PAY-TEST-PENDING` is reset to `pending` at the start of modules 03, 04, and 05.
`PAY-TEST-PAID` is never mutated — it only tests the "no downgrade" guard.

---

## Test case matrix

### Module 01 — Coupon Validate (`POST /api/coupons/validate`)

| ID | What | Expected |
|---|---|---|
| VALID-PCT20 | Valid 20% coupon, ₹3000 subtotal | 200, valid:true, discount_type:percent |
| PCT-MATH | Same call, verify discount_value=20 | discount_value === 20 |
| VALID-FLAT300 | Valid ₹300 flat coupon, ₹2000 subtotal | 200, valid:true, discount_type:flat |
| FLAT-MATH | Same call, verify discount_value=300 | discount_value === 300 |
| VALID-SHIP | Free shipping coupon | 200, valid:true, discount_type:free_shipping |
| CASE-INSENS | Lowercase `paytestship` | 200, valid:true |
| EXP-DATE | Expired coupon | 200, valid:false, message contains "expir" |
| USAGE-LIMIT | Exhausted coupon | 200, valid:false, message contains "usage"/"limit" |
| INACTIVE | is_active=false coupon | 200, valid:false |
| MIN-ORDER | FLAT300 with ₹1000 (below ₹1500 min) | 200, valid:false, message contains "minimum" |
| NONEXISTENT | Unknown code | 200, valid:false |
| EMPTY-CODE | code="" | 400 |
| ZERO-SUBTOTAL | subtotal=0 | 400 |

### Module 02 — Order Create (`POST /api/orders/create`)

Requires valid `rzp_test_` keys. Creates real test Razorpay orders (no financial impact).

| ID | What | Expected |
|---|---|---|
| VALID-STD | Valid order, standard delivery, ₹2500 product | 200, 250000 paise |
| VALID-EXPRESS | Express delivery, same product (at threshold → free ship) | 200, 250000 paise |
| VALID-GIFT | gift_wrap=true | 200, 265000 paise (₹2500 + ₹150) |
| PRICE-SPOOF | Client sends price:1, real price is ₹2500 | 200, 250000 paise (server ignores client price) |
| NO-STOCK | qty=2, beta variant has stock=1 | 400, message mentions stock |
| INVALID-VARIANT | Non-existent variant UUID | 400 |
| COUPON-PCT | PAYTESTPCT20 on ₹2500 | 200, 200000 paise |
| COUPON-FLAT | PAYTESTFLAT300 on ₹2500 | 200, 220000 paise |
| COUPON-SHIP | PAYTESTSHIP on ₹1000 beta (below threshold) | 200, 100000 paise |
| COUPON-EXP | PAYTESTEXPIRED | 400 |
| COUPON-USED | PAYTESTUSED | 400 |
| COUPON-MIN | PAYTESTMIN2000 on ₹1000 order | 400 |
| COUPON-INVALID | NOTACOUPON99 | 400 |
| MISSING-ITEMS | items=[] | 400 |
| MISSING-PHONE | phone="12345" (4 digits) | 400 |
| MISSING-EMAIL | email="notanemail" | 400 |
| MISSING-PIN | pincode="1234" (4 digits) | 400 |

### Module 03 — Payment Verify (`POST /api/payments/verify`)

Signatures computed locally with `lib/crypto.mjs` using `RAZORPAY_KEY_SECRET`.

| ID | What | Expected |
|---|---|---|
| VALID-SIG | Correct HMAC for PAY-TEST-PENDING | 200, success:true |
| DB-VERIFY | DB check after valid verify | payment_status="paid", gateway_payment_id set |
| IDEMPOTENT | Same verify again | 200, success:true |
| DB-IDEMPOTENT | DB check after double verify | still paid, not corrupted |
| TAMPERED-PAY | payment_id changed after signing | 400, success:false |
| TAMPERED-ORD | order_id changed after signing | 400, success:false |
| WRONG-SECRET | Signature from wrong secret | 400, success:false |
| EMPTY-SIG | razorpay_signature="" | 400 |
| MISSING-FIELDS | Missing razorpay_payment_id | 400 |

### Module 04 — Webhook Captured (`POST /api/payments/webhook`)

Signatures computed with `lib/crypto.mjs` using `RAZORPAY_WEBHOOK_SECRET`.

| ID | What | Expected |
|---|---|---|
| CAPTURED-OK | Valid payment.captured for PAY-TEST-PENDING | 200, received:true |
| CAPTURED-DB | DB check after captured | payment_status="paid", gateway_payment_id set |
| CAPTURED-IDEM | Duplicate captured event | 200, received:true |
| CAPTURED-DB-IDEM | DB check after duplicate | still paid, not corrupted |
| BAD-SIG | Tampered signature | 400, received:false |
| TAMPERED-BODY | Valid sig, different body | 400, received:false |
| UNKNOWN-ORDER | order_id not in DB | 200 (ack, no retry storm) |
| MISSING-SIG-HDR | Empty x-razorpay-signature | 400 |

### Module 05 — Webhook Failed (`POST /api/payments/webhook`)

| ID | What | Expected |
|---|---|---|
| FAILED-OK | Valid payment.failed for PAY-TEST-PENDING | 200, received:true |
| FAILED-DB | DB check after failed | payment_status="failed" |
| FAILED-IDEM | Duplicate failed event | 200, received:true |
| FAILED-DB-IDEM | DB check after duplicate | still failed, not reset to pending |
| FAILED-BAD-SIG | Tampered signature | 400, received:false |
| FAILED-UNKNOWN | order_id not in DB | 200 (ack gracefully) |
| PAID-NO-DOWNGRADE | Failed event on PAY-TEST-PAID (already paid) | 200, DB still paid |
| UNKNOWN-EVENT | Event type "order.paid" (unrecognised) | 200 (ack and ignore) |

---

## Crypto helpers (`lib/crypto.mjs`)

The server uses HMAC SHA256 for two different things:

**Payment verify** (`/api/payments/verify`):
```
HMAC_SHA256(key=RAZORPAY_KEY_SECRET, data="razorpay_order_id|razorpay_payment_id")
```
This is what Razorpay sends to the client after payment, and what the client POSTs back.
`signPayment(orderId, paymentId, secret)` replicates this.

**Webhook** (`/api/payments/webhook`):
```
HMAC_SHA256(key=RAZORPAY_WEBHOOK_SECRET, data=<raw request body string>)
```
This is in the `x-razorpay-signature` header on every webhook POST.
`signWebhook(rawBodyString, secret)` replicates this.

`tamper(hexSig)` flips the last hex character to produce a valid-format but wrong signature
for rejection tests. It is deterministic — given the same input it always produces the same
wrong output, which is good for reproducible test cases.

---

## Common failure reasons and fixes

### 02 / VALID-STD fails with status 500 or network error
→ RAZORPAY_KEY_ID is not set or is not a `rzp_test_` key.
→ Check `.env.local` and restart the dev server after changes.

### 02 / PRICE-SPOOF — amount is not 250000
→ `POST /api/orders/create` uses client-submitted `price` instead of DB price.
→ In `app/api/orders/create/route.ts`: replace `item.price` with the price fetched
   from the `product_variants` table.

### 02 / NO-STOCK — returns 200 instead of 400
→ Stock check is missing or not enforced before Razorpay order creation.
→ Add: `if (variant.stock < item.qty) return 400`.

### 02 / COUPON-EXP — returns 200 (coupon accepted)
→ Expiry check compares `DATE` column against ISO timestamp string (lexicographic mismatch).
→ Fix: `const today = new Date().toISOString().split('T')[0]` then `coupon.expiry_date < today`.
→ This bug was patched in `app/api/coupons/validate/route.ts` and `app/api/orders/create/route.ts`
   during the May 2026 schema audit.

### 03 / VALID-SIG fails — 400 on a good signature
→ Server's HMAC algorithm or key does not match.
→ In `app/api/payments/verify/route.ts`: confirm you are signing
   `razorpay_order_id + "|" + razorpay_payment_id` with `RAZORPAY_KEY_SECRET`.

### 04–05 / BAD-SIG returns 200 instead of 400
→ Webhook signature verification is disabled or not wired up.
→ `app/api/payments/webhook/route.ts` must call `verifyWebhookSignature(rawBody, header)`.
→ The raw body must be read as a string (`await req.text()`), not parsed to JSON first,
   because JSON re-serialisation changes byte order and invalidates the signature.

### 05 / PAID-NO-DOWNGRADE — paid order status set to "failed"
→ Webhook handler unconditionally updates status on `payment.failed`.
→ Fix: guard with `if (order.payment_status !== 'paid') { ...update... }`.

### 05 / UNKNOWN-EVENT returns non-200
→ Webhook handler throws or returns 400 for unknown event types.
→ Fix: add a default branch that returns `{ received: true }` with status 200.

---

## Report format

Each run writes `scripts/payment_test/reports/payment-results-{timestamp}.md`.

The report contains:
- Summary table: resource, total cases, passed, failed
- Fix plan: failed assertions only, with hint per failure
- Detailed results: every assertion in order

---

## Adding new test cases

1. Pick the relevant module file in `tests/`.
2. Add a block inside `run()` following the existing `{ }` scoping pattern.
3. Use `A.status()`, `A.field()`, `A.ok()`, `A.isArray()`, `A.hasField()` from the assert collection.
4. If the new case needs fresh seed data (new coupon, new order) add it to `seed.mjs` and `cleanup.mjs`.
5. Run the suite — the new case will appear in the report automatically.

---

## Architecture notes

### Why no mocking?
The suite hits the real running Next.js dev server over HTTP.
This tests the full stack: route handler → business logic → Supabase → response.
This catches environment-config bugs that unit tests miss.

### Why compute HMAC locally?
So we can test both valid and invalid signatures without a real Razorpay payment.
The server uses the same algorithm — if our computed signature passes, the server's
verification logic is correct.

### Why upsert in seed?
Re-running seed without cleanup first must not fail. Upsert on stable natural keys
(order_number, slug, code) makes the suite idempotent and safe to re-run.

### Why 200 for unknown orders / unknown events in webhooks?
Razorpay retries any non-2xx response. If we return 400 or 500 for an unknown order,
Razorpay will retry indefinitely. We ack with 200 and log — the operator investigates
via the report, not via Razorpay retry storms.
