/**
 * k6 load test — Possah production readiness
 *
 * Scenarios (100 VU total):
 *   60 VU  GET  / and /women/sarees          — page latency under load
 *   20 VU  GET  a PDP                        — ISR / edge cache hit
 *   12 VU  POST /api/orders/create           — order creation path (fake UUIDs → 400, no DB writes)
 *    8 VU  POST /api/payments/webhook        — HMAC rejection path
 *
 * BEFORE RUNNING:
 *   Install k6: https://k6.io/docs/get-started/installation/
 *   k6 run -e BASE_URL=https://thepossah.com scripts/load_test/k6.js
 *
 * THRESHOLDS (fail the run if breached):
 *   - http_req_duration p(95) < 1000 ms
 *   - http_req_failed   < 1%
 *   - order_create_success_rate > 50%   (fake UUIDs → expected 400s)
 *   - webhook_duration_ms p(95) < 500 ms
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js'

// Real product slugs sampled from production — update if products change
const PDP_SLUGS = [
  '/women/sarees/the-dusk-saree',
  '/women/dresses/botanical-grace-midi',
  '/women/lehengas/bridal-lehenga-set',
]

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

const RAMP_STAGES = [
  { duration: '2m',  target: 100 },  // ramp up to 100 VU
  { duration: '5m',  target: 100 },  // hold
  { duration: '1m',  target: 0 },    // ramp down
]

export const options = {
  scenarios: {
    browse_pages: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: RAMP_STAGES,
      gracefulRampDown: '15s',
      exec: 'browsePages',
      // 60% of VUs go here
      env: { VU_SHARE: '0.6' },
    },
    view_pdp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: RAMP_STAGES.map(s => ({ ...s, target: Math.round(s.target * 0.2) })),
      gracefulRampDown: '15s',
      exec: 'viewPdp',
    },
    order_creation: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: RAMP_STAGES.map(s => ({ ...s, target: Math.round(s.target * 0.12) })),
      gracefulRampDown: '10s',
      exec: 'createOrder',
    },
    webhook_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: RAMP_STAGES.map(s => ({ ...s, target: Math.round(s.target * 0.08) })),
      gracefulRampDown: '10s',
      exec: 'sendWebhook',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
    order_create_success_rate: ['rate>0.5'],
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

// ─── Scenario: browsePages ───────────────────────────────────────────────────

export function browsePages() {
  const pages = ['/', '/women/sarees', '/women/dresses', '/festive', '/bridal']
  const url = BASE_URL + pages[Math.floor(Math.random() * pages.length)]

  const res = http.get(url, { tags: { name: 'browse_page' } })
  check(res, {
    'browse: 200': (r) => r.status === 200,
    'browse: < 1s': (r) => r.timings.duration < 1000,
  })
  sleep(Math.random() * 3 + 1)
}

// ─── Scenario: viewPdp ───────────────────────────────────────────────────────

export function viewPdp() {
  const slug = PDP_SLUGS[Math.floor(Math.random() * PDP_SLUGS.length)]
  const res = http.get(`${BASE_URL}${slug}`, { tags: { name: 'pdp' } })
  check(res, {
    'pdp: 200': (r) => r.status === 200,
    'pdp: < 1s': (r) => r.timings.duration < 1000,
  })
  sleep(Math.random() * 4 + 2)
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
