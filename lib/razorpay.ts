import crypto from 'crypto'

/** Validate Razorpay webhook signature — server-side only, never trust client */
export function verifyRazorpayWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    const a = Buffer.from(expectedSignature, 'hex')
    const b = Buffer.from(signature, 'hex')
    // timingSafeEqual throws RangeError if buffers differ in length
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** Verify Razorpay payment signature (post-payment client callback) */
export function verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature,
  secret,
}: {
  orderId: string
  paymentId: string
  signature: string
  secret: string
}): boolean {
  try {
    const body = `${orderId}|${paymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    const a = Buffer.from(expectedSignature, 'hex')
    const b = Buffer.from(signature, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * Fetch a Razorpay order by id. Used by the webhook (audit H-2) to reconcile a
 * captured payment back to our order via the order's `receipt` (= our
 * order_number) when the local row's gateway_order_id has since been rotated by
 * a retry/reuse and no longer matches.
 */
export async function fetchRazorpayOrder(
  orderId: string,
): Promise<{ id: string; receipt: string | null } | null> {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) return null

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: `Basic ${auth}` },
  })
  if (!res.ok) return null
  return res.json() as Promise<{ id: string; receipt: string | null }>
}

/** Create Razorpay order via the Orders API */
export async function createRazorpayOrder({
  amount,
  currency = 'INR',
  receipt,
}: {
  amount: number // in paise (₹1 = 100 paise)
  currency?: string
  receipt: string
}): Promise<{ id: string; amount: number; currency: string }> {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys not configured')
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({ amount, currency, receipt }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Razorpay order creation failed: ${error}`)
  }

  return response.json() as Promise<{ id: string; amount: number; currency: string }>
}
