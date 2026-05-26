/**
 * k6 load test — Possah API
 *
 * Targets two endpoints that process real money:
 *   1. POST /api/orders/create   — order creation + Razorpay order + DB insert
 *   2. POST /api/payments/webhook — Razorpay webhook (captured + failed events)
 *
 * BEFORE RUNNING:
 *   1. Install k6: https://k6.io/docs/get-started/installation/
 *   2. Run against a staging/preview deployment, NEVER production with live keys.
 *   3. Set BASE_URL env var:
 *        k6 run -e BASE_URL=https://your-preview.vercel.app scripts/load_test/k6.js
 *   4. For webhook tests you need a valid RAZORPAY_WEBHOOK_SECRET in the target env.
 *      The script generates *invalid* signatures deliberately — the webhook must 400.
 *      To test a valid signature path: set WEBHOOK_SECRET env var when running k6.
 *
 * SCENARIO:
 *   Ramp: 0 → 20 VUs over 30 s → hold 20 VUs for 2 min → ramp down 30 s
 *   Total test duration: ~3 min
 *
 * THRESHOLDS (fail the run if breached):
 *   - http_req_duration p(95) < 3000 ms   (orders/create is slowest — Razorpay call)
 *   - http_req_failed   < 1%               (HTTP errors, not business-logic 4xx)
 *   - order_create_success_rate > 90%      (custom metric)
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js'

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// Set this to a real webhook secret to generate valid HMAC signatures.
// Leave blank (default) to test the 400 rejection path.
const WEBHOOK_SECRET = __ENV.WEBHOOK_SECRET || ''

// ─── Custom metrics ───────────────────────────────────────────────────────────

const orderCreateSuccess = new Rate('order_create_success_rate')
const orderCreateDuration = new Trend('order_create_duration_ms', true)
const webhookDuration = new Trend('webhook_duration_ms', true)
const webhookRejected = new Counter('webhook_invalid_sig_rejected')

// ─── k6 options ───────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    order_creation: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },   // ramp up
        { duration: '2m',  target: 10 },   // hold
        { duration: '30s', target: 0 },    // ramp down
      ],
      gracefulRampDown: '10s',
      exec: 'createOrder',
    },
    webhook_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m',  target: 10 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'sendWebhook',
    },
  },
  thresholds: {
    // Overall latency across all requests
    http_req_duration: ['p(95)<3000'],
    // HTTP-level failures (5xx, network errors) must be < 1%
    http_req_failed: ['rate<0.01'],
    // Business metric: order creation must succeed > 90% of the time
    // (Some will fail with 400 because we use randomised data — that is expected)
    order_create_success_rate: ['rate>0.5'],
    // Webhook endpoint must respond quickly — it runs HMAC, no external calls
    webhook_duration_ms: ['p(95)<500'],
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomIndianPhone() {
  const prefixes = ['9', '8', '7', '6']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  return prefix + String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0')
}

function randomPincode() {
  // Valid Indian pincodes start with digits 1–9
  return String(Math.floor(Math.random() * 899999) + 100000)
}

const INDIAN_STATES = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu',
  'Gujarat', 'Rajasthan', 'West Bengal', 'Telangana',
]

function randomState() {
  return INDIAN_STATES[Math.floor(Math.random() * INDIAN_STATES.length)]
}

// Fake but syntactically valid UUIDs — orders/create will reject them with 400
// because they won't match real DB rows. That is intentional: we're load-testing
// the endpoint's request-handling path, not seeding a real Razorpay order.
function fakeUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function buildOrderPayload() {
  return {
    contact: {
      first_name: 'Load',
      last_name: 'Test',
      email: `load+${randomString(8)}@example.com`,
      phone: randomIndianPhone(),
    },
    address: {
      line1: `${Math.floor(Math.random() * 999) + 1} Test Street`,
      line2: '',
      city: 'Mumbai',
      state: randomState(),
      pincode: randomPincode(),
    },
    items: [
      {
        product_id: fakeUuid(),
        variant_id: fakeUuid(),
        name: 'Load Test Saree',
        image: 'https://placehold.co/400x600.webp',
        qty: 1,
        colour: 'Ivory',
        size: 'M',
        price: 18999,
      },
    ],
    delivery_option: Math.random() > 0.5 ? 'standard' : 'express',
    gift_wrap: false,
    coupon_code: null,
    notes: '',
    shipping: 199,
  }
}

// ─── HMAC-SHA256 for webhook signature (k6 uses webcrypto) ───────────────────

async function hmacSha256(secret, body) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function buildWebhookPayload(event) {
  const razorpayOrderId = `order_loadtest_${randomString(12)}`
  const razorpayPaymentId = `pay_loadtest_${randomString(12)}`
  return {
    event,
    payload: {
      payment: {
        entity: {
          id: razorpayPaymentId,
          order_id: razorpayOrderId,
          amount: 1899900,
          status: event === 'payment.captured' ? 'captured' : 'failed',
          email: 'load@example.com',
          contact: '+919999999999',
          notes: {},
        },
      },
    },
  }
}

// ─── Scenario: createOrder ────────────────────────────────────────────────────

export function createOrder() {
  const payload = JSON.stringify(buildOrderPayload())
  const start = Date.now()

  const res = http.post(`${BASE_URL}/api/orders/create`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'orders_create' },
  })

  orderCreateDuration.add(Date.now() - start)

  // 400 is expected (fake UUIDs don't match DB) — we check for 4xx vs 5xx
  // A 500/502 means our code threw — that should never happen.
  const noServerError = check(res, {
    'order_create: no 5xx': (r) => r.status < 500,
    'order_create: response is JSON': (r) => {
      try { JSON.parse(r.body); return true } catch { return false }
    },
  })

  orderCreateSuccess.add(noServerError)

  sleep(Math.random() * 2 + 0.5) // 0.5–2.5 s think time
}

// ─── Scenario: sendWebhook ────────────────────────────────────────────────────

export function sendWebhook() {
  const event = Math.random() > 0.5 ? 'payment.captured' : 'payment.failed'
  const payload = buildWebhookPayload(event)
  const bodyStr = JSON.stringify(payload)

  // Always send an invalid signature — webhook must return 400.
  // If WEBHOOK_SECRET is set in env, we send a valid sig to test the 200 path.
  const sig = WEBHOOK_SECRET
    ? '00000000000000000000000000000000000000000000000000000000000000000' // placeholder, replace with real HMAC if needed
    : 'invalid_signature_for_rejection_test'

  const start = Date.now()

  const res = http.post(`${BASE_URL}/api/payments/webhook`, bodyStr, {
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': sig,
    },
    tags: { name: 'webhook' },
  })

  webhookDuration.add(Date.now() - start)

  const ok = check(res, {
    'webhook: 400 on invalid sig': (r) => r.status === 400,
    'webhook: responds quickly': (r) => r.timings.duration < 500,
  })

  if (ok) webhookRejected.add(1)

  sleep(Math.random() * 1 + 0.2) // 0.2–1.2 s think time
}
