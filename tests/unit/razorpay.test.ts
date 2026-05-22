// FIX-TEST-02: Unit tests for lib/razorpay.ts
// Target: 100% coverage — all signature verification edge cases

import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'
import {
  verifyRazorpayWebhookSignature,
  verifyRazorpayPaymentSignature,
  createRazorpayOrder,
} from '@/lib/razorpay'

// ─── Helper: generate a valid HMAC-SHA256 signature ──────────────────────────

function hmac(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

// ─── verifyRazorpayWebhookSignature ──────────────────────────────────────────

describe('verifyRazorpayWebhookSignature', () => {
  const secret = 'test_webhook_secret_abc123'
  const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_abc' } } } })

  it('returns true for a valid signature', () => {
    const sig = hmac(body, secret)
    expect(verifyRazorpayWebhookSignature(body, sig, secret)).toBe(true)
  })

  it('returns false for a wrong signature', () => {
    expect(verifyRazorpayWebhookSignature(body, hmac(body, 'wrong_secret'), secret)).toBe(false)
  })

  it('returns false for a tampered body', () => {
    const sig = hmac(body, secret)
    expect(verifyRazorpayWebhookSignature(body + ' ', sig, secret)).toBe(false)
  })

  it('returns false for an empty signature', () => {
    expect(verifyRazorpayWebhookSignature(body, '', secret)).toBe(false)
  })

  it('returns false for a non-hex signature (throws internally)', () => {
    expect(verifyRazorpayWebhookSignature(body, 'not-valid-hex!!', secret)).toBe(false)
  })

  it('returns false when signature is shorter than expected (length mismatch)', () => {
    const sig = hmac(body, secret)
    expect(verifyRazorpayWebhookSignature(body, sig.slice(0, 32), secret)).toBe(false)
  })

  it('returns false when signature is longer than expected', () => {
    const sig = hmac(body, secret)
    expect(verifyRazorpayWebhookSignature(body, sig + 'aa', secret)).toBe(false)
  })

  it('returns false for empty body', () => {
    const sig = hmac('', secret)
    expect(verifyRazorpayWebhookSignature('', sig, 'different_secret')).toBe(false)
  })

  it('returns true for empty body with correct signature', () => {
    const sig = hmac('', secret)
    expect(verifyRazorpayWebhookSignature('', sig, secret)).toBe(true)
  })
})

// ─── verifyRazorpayPaymentSignature ──────────────────────────────────────────

describe('verifyRazorpayPaymentSignature', () => {
  const secret = 'test_payment_secret_xyz'
  const orderId = 'order_test_123'
  const paymentId = 'pay_test_456'

  function makeSignature(oId: string, pId: string, s: string) {
    return hmac(`${oId}|${pId}`, s)
  }

  it('returns true for a valid payment signature', () => {
    const signature = makeSignature(orderId, paymentId, secret)
    expect(verifyRazorpayPaymentSignature({ orderId, paymentId, signature, secret })).toBe(true)
  })

  it('returns false for wrong secret', () => {
    const signature = makeSignature(orderId, paymentId, 'wrong')
    expect(verifyRazorpayPaymentSignature({ orderId, paymentId, signature, secret })).toBe(false)
  })

  it('returns false for mismatched orderId', () => {
    const signature = makeSignature('order_different', paymentId, secret)
    expect(verifyRazorpayPaymentSignature({ orderId, paymentId, signature, secret })).toBe(false)
  })

  it('returns false for mismatched paymentId', () => {
    const signature = makeSignature(orderId, 'pay_different', secret)
    expect(verifyRazorpayPaymentSignature({ orderId, paymentId, signature, secret })).toBe(false)
  })

  it('returns false for empty signature', () => {
    expect(verifyRazorpayPaymentSignature({ orderId, paymentId, signature: '', secret })).toBe(false)
  })

  it('returns false for invalid hex', () => {
    expect(verifyRazorpayPaymentSignature({ orderId, paymentId, signature: 'ZZZZ', secret })).toBe(false)
  })
})

// ─── createRazorpayOrder ─────────────────────────────────────────────────────

describe('createRazorpayOrder', () => {
  beforeEach(() => {
    vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test_abc')
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'test_secret_xyz')
  })

  it('throws when Razorpay keys are missing', async () => {
    vi.stubEnv('RAZORPAY_KEY_ID', '')
    vi.stubEnv('RAZORPAY_KEY_SECRET', '')
    await expect(
      createRazorpayOrder({ amount: 100000, receipt: 'rcpt_001' })
    ).rejects.toThrow('Razorpay keys not configured')
  })

  it('returns order object on successful API response', async () => {
    const mockOrder = { id: 'order_test_001', amount: 100000, currency: 'INR' }
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrder,
    } as Response)

    const result = await createRazorpayOrder({ amount: 100000, receipt: 'rcpt_001' })
    expect(result).toEqual(mockOrder)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.razorpay.com/v1/orders',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws on Razorpay API error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => 'Bad Request',
    } as Response)

    await expect(
      createRazorpayOrder({ amount: 100000, receipt: 'rcpt_001' })
    ).rejects.toThrow('Razorpay order creation failed')
  })

  it('sends amount in paise with INR currency by default', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'order_001', amount: 50000, currency: 'INR' }),
    } as Response)

    await createRazorpayOrder({ amount: 50000, receipt: 'rcpt_002' })

    const callBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(callBody.currency).toBe('INR')
    expect(callBody.amount).toBe(50000)
    expect(callBody.receipt).toBe('rcpt_002')
  })
})
