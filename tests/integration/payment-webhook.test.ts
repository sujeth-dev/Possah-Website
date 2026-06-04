// FIX-TEST-03: Integration tests for /api/payments/webhook
// Tests the webhook route handler with mocked Supabase and email.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'

// ─── Mock external dependencies before imports ────────────────────────────────

const mockSupabaseFrom = vi.fn()
const mockSupabaseUpdate = vi.fn()
const mockSupabaseSelect = vi.fn()
const mockSupabaseEq = vi.fn()
const mockSupabaseSingle = vi.fn()
const mockRPC = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mockSupabaseFrom,
    rpc: mockRPC,
  }),
}))

vi.mock('@/lib/email', () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendPaymentFailureEmail: vi.fn().mockResolvedValue(undefined),
  sendAdminOrderNotification: vi.fn().mockResolvedValue(undefined),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeWebhookBody(event: string, paymentId = 'pay_001', orderId = 'order_rz_001') {
  return JSON.stringify({
    event,
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: 100000,
          status: event === 'payment.captured' ? 'captured' : 'failed',
          email: 'customer@example.com',
          contact: '+919999999999',
          error_description: event === 'payment.failed' ? 'Insufficient funds' : undefined,
          notes: {},
        },
      },
    },
  })
}

function makeSignature(body: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

async function callWebhook(body: string, signature: string) {
  const { POST } = await import('@/app/api/payments/webhook/route')
  const req = new Request('http://localhost/api/payments/webhook', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature,
    },
  })
  return POST(req as unknown as Parameters<typeof POST>[0])
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /api/payments/webhook', () => {
  const secret = 'test_webhook_secret'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', secret)
    vi.stubEnv('ADMIN_EMAIL', 'admin@thepossah.com')
  })

  it('returns 400 for invalid signature', async () => {
    const body = makeWebhookBody('payment.captured')
    const response = await callWebhook(body, 'invalid_signature_xxxx')
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.received).toBe(false)
  })

  it('returns 500 when webhook secret env var is missing', async () => {
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', '')
    const body = makeWebhookBody('payment.captured')
    const response = await callWebhook(body, 'anything')
    expect(response.status).toBe(500)
  })

  it('returns 200 and skips processing when order already paid (idempotency)', async () => {
    const body = makeWebhookBody('payment.captured')
    const sig = makeSignature(body, secret)

    const mockOrder = {
      id: 'order_db_001',
      order_number: 'PSH-2026-0001',
      payment_status: 'paid', // already paid
      customer_name: 'Test User',
      customer_email: 'customer@example.com',
      line_items: [],
      subtotal: 100000,
      shipping_fee: 0,
      discount_amount: 0,
      total: 100000,
    }

    mockSupabaseFrom.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => ({ data: mockOrder, error: null }) }) }),
    })

    const response = await callWebhook(body, sig)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.received).toBe(true)
  })

  it('returns 200 and processes payment.failed event', async () => {
    const body = makeWebhookBody('payment.failed')
    const sig = makeSignature(body, secret)

    const mockFailedOrder = {
      id: 'order_db_001',
      customer_email: 'customer@example.com',
      customer_name: 'Test User',
      order_number: 'PSH-2026-0001',
      payment_status: 'pending',
      total: 100000,
    }

    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => ({ data: mockFailedOrder, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({ error: null }),
      }),
    })

    const { sendPaymentFailureEmail } = await import('@/lib/email')
    const response = await callWebhook(body, sig)
    expect(response.status).toBe(200)
    expect(sendPaymentFailureEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer@example.com',
        orderNumber: 'PSH-2026-0001',
      })
    )
  })

  it('returns 400 for malformed JSON body', async () => {
    const badBody = 'not-json{'
    const sig = makeSignature(badBody, secret)
    const response = await callWebhook(badBody, sig)
    expect(response.status).toBe(400)
  })
})
