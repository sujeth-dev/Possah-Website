import crypto from 'crypto'

/** Validate Razorpay webhook signature — server-side only, never trust client */
export function verifyRazorpayWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  )
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
  const body = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  )
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
