import crypto from 'crypto'

/**
 * Cart-fingerprint helper.
 *
 * Used by `app/api/orders/create/route.ts` and the retry-payment endpoint to
 * decide whether a fresh checkout attempt from a returning customer can REUSE
 * an existing open pending order (same intent) or must UPDATE it (different
 * cart / coupon / delivery / total).
 *
 * The fingerprint is deterministic: same intent → same hash, every time.
 * Order-of-items in the cart doesn't matter — the helper sorts variant ids
 * before hashing.
 *
 * NEVER trust a fingerprint from the client: always recompute server-side
 * from values that have already been validated against the DB.
 */

export interface FingerprintItem {
  variant_id: string
  qty: number
}

export interface FingerprintInput {
  items: FingerprintItem[]
  delivery_option: 'standard' | 'express'
  coupon_code: string | null | undefined
  gift_wrap: boolean
  /** Final server-computed total in paise (or rupees — must be consistent). */
  total: number
}

/**
 * Returns a stable 64-character lowercase hex SHA-256 hash of the canonical
 * representation of a cart intent.
 */
export function computeCartFingerprint(input: FingerprintInput): string {
  const canonical = canonicalize(input)
  return crypto.createHash('sha256').update(canonical).digest('hex')
}

/**
 * Builds the canonical string used as the SHA-256 input.
 *
 * Exposed for tests and for logging — not for direct comparison.
 */
export function canonicalize(input: FingerprintInput): string {
  const itemsSorted = [...input.items]
    .map((it) => ({ variant_id: it.variant_id.trim(), qty: it.qty }))
    .sort((a, b) => a.variant_id.localeCompare(b.variant_id))

  const itemsToken = itemsSorted
    .map((it) => `${it.variant_id}:${it.qty}`)
    .join('|')

  const couponToken = (input.coupon_code ?? '').trim().toUpperCase()
  const giftToken   = input.gift_wrap ? '1' : '0'
  const totalToken  = String(input.total)

  return [
    itemsToken,
    input.delivery_option,
    couponToken,
    giftToken,
    totalToken,
  ].join('||')
}
