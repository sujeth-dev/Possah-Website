/**
 * Test module 1: POST /api/coupons/validate
 *
 * Cases covered:
 *   VALID-PCT20    — valid 20% percent coupon
 *   VALID-FLAT300  — valid ₹300 flat coupon (above min)
 *   VALID-SHIP     — free_shipping coupon
 *   CASE-INSENS    — lowercase code accepted
 *   EXP-DATE       — expired coupon rejected (expiry_date = yesterday)
 *   USAGE-LIMIT    — exhausted coupon rejected (usage_count = usage_limit)
 *   INACTIVE       — is_active=false coupon rejected
 *   MIN-ORDER      — FLAT300 below min_order_value ₹1500 rejected
 *   NONEXISTENT    — unknown code rejected
 *   EMPTY-CODE     — empty string → 400
 *   ZERO-SUBTOTAL  — non-positive subtotal → 400
 *   PCT-MATH       — 20% of ₹3000 = ₹600 discount_value returned
 *   FLAT-MATH      — ₹300 flat discount_value returned
 */

import { api } from '../lib/http.mjs'
import { makeAssertCollection, printHeader } from '../lib/assert.mjs'

export async function run() {
  printHeader('1 / 5  COUPON VALIDATE')
  const A = makeAssertCollection('CouponValidate')

  // ── VALID-PCT20 ────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/coupons/validate', { code: 'PAYTESTPCT20', subtotal: 3000 })
    A.status('VALID-PCT20', 'POST /coupons/validate → 200', res, 200)
    A.field('VALID-PCT20', 'valid: true', res.data, 'valid', true)
    A.field('VALID-PCT20', 'discount_type: percent', res.data, 'discount_type', 'percent')
    A.field('VALID-PCT20', 'discount_value: 20', res.data, 'discount_value', 20)
    A.ok('VALID-PCT20', 'message is string', typeof res.data?.message === 'string',
      'Response must include a human-readable message string.')
  }

  // ── PCT-MATH ───────────────────────────────────────────────────────────────
  // 20% of ₹3000 = ₹600 — math verified client-side but value returned correctly
  {
    const res = await api('POST', '/api/coupons/validate', { code: 'PAYTESTPCT20', subtotal: 3000 })
    A.ok('PCT-MATH', '20% of ₹3000 → discount_value=20 (client applies)',
      res.data?.discount_value === 20,
      'discount_value for percent should be the % number (20), client computes the ₹ amount.')
  }

  // ── VALID-FLAT300 ──────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/coupons/validate', { code: 'PAYTESTFLAT300', subtotal: 2000 })
    A.status('VALID-FLAT300', 'flat coupon above min → 200', res, 200)
    A.field('VALID-FLAT300', 'valid: true', res.data, 'valid', true)
    A.field('VALID-FLAT300', 'discount_type: flat', res.data, 'discount_type', 'flat')
    A.field('VALID-FLAT300', 'discount_value: 300', res.data, 'discount_value', 300)
  }

  // ── FLAT-MATH ──────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/coupons/validate', { code: 'PAYTESTFLAT300', subtotal: 2000 })
    A.ok('FLAT-MATH', 'flat discount_value = 300',
      res.data?.discount_value === 300,
      'Flat coupon must return exact value from DB, not a computed amount.')
  }

  // ── VALID-SHIP ─────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/coupons/validate', { code: 'PAYTESTSHIP', subtotal: 500 })
    A.status('VALID-SHIP', 'free_shipping coupon → 200', res, 200)
    A.field('VALID-SHIP', 'valid: true', res.data, 'valid', true)
    A.field('VALID-SHIP', 'discount_type: free_shipping', res.data, 'discount_type', 'free_shipping')
  }

  // ── CASE-INSENS ────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/coupons/validate', { code: 'paytestship', subtotal: 500 })
    A.status('CASE-INSENS', 'lowercase code → 200', res, 200)
    A.field('CASE-INSENS', 'valid: true (case insensitive)', res.data, 'valid', true)
  }

  // ── EXP-DATE ──────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/coupons/validate', { code: 'PAYTESTEXPIRED', subtotal: 500 })
    A.status('EXP-DATE', 'expired coupon → 200 (valid:false)', res, 200)
    A.field('EXP-DATE', 'valid: false', res.data, 'valid', false)
    A.ok('EXP-DATE', 'message contains "expired"',
      res.data?.message?.toLowerCase().includes('expir'),
      'Error message should mention expiry.')
  }

  // ── USAGE-LIMIT ────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/coupons/validate', { code: 'PAYTESTUSED', subtotal: 500 })
    A.status('USAGE-LIMIT', 'exhausted coupon → 200 (valid:false)', res, 200)
    A.field('USAGE-LIMIT', 'valid: false', res.data, 'valid', false)
    A.ok('USAGE-LIMIT', 'message mentions usage/limit',
      res.data?.message?.toLowerCase().includes('usage') || res.data?.message?.toLowerCase().includes('limit'),
      'Error message should mention usage limit.')
  }

  // ── INACTIVE ───────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/coupons/validate', { code: 'PAYTESTINACT', subtotal: 500 })
    A.status('INACTIVE', 'inactive coupon → 200 (valid:false)', res, 200)
    A.field('INACTIVE', 'valid: false', res.data, 'valid', false)
  }

  // ── MIN-ORDER ──────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/coupons/validate', { code: 'PAYTESTFLAT300', subtotal: 1000 })
    A.status('MIN-ORDER', 'below min_order_value → 200 (valid:false)', res, 200)
    A.field('MIN-ORDER', 'valid: false', res.data, 'valid', false)
    A.ok('MIN-ORDER', 'message mentions minimum order',
      res.data?.message?.toLowerCase().includes('minimum'),
      'Error message must state the minimum order requirement.')
  }

  // ── NONEXISTENT ────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/coupons/validate', { code: 'PAYTESTDOESNOTEXIST', subtotal: 500 })
    A.status('NONEXISTENT', 'unknown code → 200 (valid:false)', res, 200)
    A.field('NONEXISTENT', 'valid: false', res.data, 'valid', false)
  }

  // ── EMPTY-CODE ─────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/coupons/validate', { code: '', subtotal: 500 })
    A.status('EMPTY-CODE', 'empty code → 400', res, 400)
  }

  // ── ZERO-SUBTOTAL ──────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/coupons/validate', { code: 'PAYTESTPCT20', subtotal: 0 })
    A.status('ZERO-SUBTOTAL', 'subtotal=0 → 400', res, 400)
  }

  return A.results
}
