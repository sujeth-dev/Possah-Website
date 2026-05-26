/**
 * GA4 analytics helpers — typed wrappers around window.gtag.
 *
 * All functions are no-ops if:
 *   - window is not defined (SSR)
 *   - window.gtag is not loaded (NEXT_PUBLIC_GA_MEASUREMENT_ID not set, or script blocked)
 *
 * Events follow GA4 e-commerce schema exactly so they appear in
 * Reports → Monetisation → E-commerce purchases without extra configuration.
 */

declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'js' | 'set',
      target: string,
      params?: Record<string, unknown>
    ) => void
  }
}

function ga(event: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', event, params)
}

// ─── Shared item type ─────────────────────────────────────────────────────────

export interface GA4Item {
  item_id: string
  item_name: string
  item_category?: string
  item_variant?: string
  price: number
  quantity: number
}

// ─── Events ──────────────────────────────────────────────────────────────────

/**
 * view_item — fire when PDP mounts.
 */
export function trackViewItem(params: {
  id: string
  name: string
  category: string
  price: number
}) {
  ga('view_item', {
    currency: 'INR',
    value: params.price,
    items: [
      {
        item_id: params.id,
        item_name: params.name,
        item_category: params.category,
        price: params.price,
        quantity: 1,
      } satisfies GA4Item,
    ],
  })
}

/**
 * add_to_cart — fire when item successfully added to bag.
 */
export function trackAddToCart(params: {
  id: string
  name: string
  category: string
  colour: string
  size: string
  price: number
  qty: number
}) {
  ga('add_to_cart', {
    currency: 'INR',
    value: params.price * params.qty,
    items: [
      {
        item_id: params.id,
        item_name: params.name,
        item_category: params.category,
        item_variant: `${params.colour} / ${params.size}`,
        price: params.price,
        quantity: params.qty,
      } satisfies GA4Item,
    ],
  })
}

/**
 * begin_checkout — fire when CheckoutForm mounts with items in cart.
 */
export function trackBeginCheckout(params: {
  value: number
  items: GA4Item[]
}) {
  ga('begin_checkout', {
    currency: 'INR',
    value: params.value,
    items: params.items,
  })
}

/**
 * purchase — fire immediately after payment verify succeeds.
 * transaction_id must be the human-readable order number (e.g. PSH-20260526-XXXX),
 * not the Razorpay order ID, so it is consistent across webhook / verify paths.
 */
export function trackPurchase(params: {
  transactionId: string
  value: number
  items: GA4Item[]
}) {
  ga('purchase', {
    transaction_id: params.transactionId,
    currency: 'INR',
    value: params.value,
    items: params.items,
  })
}
