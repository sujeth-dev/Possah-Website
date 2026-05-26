import { createHmac } from 'crypto'

/**
 * Compute Razorpay payment signature.
 * Used in /api/payments/verify — replicates what Razorpay returns to client.
 *
 * @param {string} razorpayOrderId
 * @param {string} razorpayPaymentId
 * @param {string} secret  — RAZORPAY_KEY_SECRET
 * @returns {string} hex signature
 */
export function signPayment(razorpayOrderId, razorpayPaymentId, secret) {
  return createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')
}

/**
 * Compute Razorpay webhook signature.
 * Used in /api/payments/webhook — replicates what Razorpay sends in x-razorpay-signature header.
 *
 * @param {string} rawBody  — exact JSON string sent in the webhook body
 * @param {string} secret   — RAZORPAY_WEBHOOK_SECRET
 * @returns {string} hex signature
 */
export function signWebhook(rawBody, secret) {
  return createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
}

/**
 * Tamper a hex signature by flipping the last character.
 * Used to produce intentionally invalid signatures for rejection tests.
 */
export function tamper(hexSignature) {
  const last = hexSignature.slice(-1)
  const flipped = last === 'f' ? '0' : (parseInt(last, 16) + 1).toString(16)
  return hexSignature.slice(0, -1) + flipped
}
