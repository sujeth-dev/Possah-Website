/**
 * Shared application constants — single source of truth.
 *
 * Extracted (audit tech-debt) from duplicated definitions that previously lived
 * in app/(shop)/checkout/CheckoutForm.tsx, app/api/account/addresses/route.ts,
 * app/api/account/addresses/[id]/route.ts and app/api/orders/create/route.ts.
 *
 * Pricing constants are duplicated no more: the checkout UI and the server-side
 * order calculation MUST read the same numbers, otherwise the displayed total
 * and the charged total can drift (a pricing bug).
 */

// ─── Indian states / union territories ──────────────────────────────────────
// Used by every shipping-address form + zod schema for validation.
export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
] as const

export type IndianState = (typeof INDIAN_STATES)[number]

// ─── Checkout pricing ───────────────────────────────────────────────────────
// Free shipping at/above this subtotal (rupees).
export const SHIPPING_THRESHOLD = 2500
export const STANDARD_SHIPPING_COST = 199
export const EXPRESS_SHIPPING_COST = 399
export const GIFT_WRAP_COST = 150
