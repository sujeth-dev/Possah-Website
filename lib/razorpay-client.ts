'use client'

// =============================================================================
// Razorpay client-side helper — shared between checkout (first attempt) and
// the retry-payment flow on /account/orders.
//
// Loads the Razorpay checkout script lazily, then opens the modal with the
// supplied order id. Callbacks fire on success / payment-failure / dismiss.
//
// IMPORTANT: NEXT_PUBLIC_RAZORPAY_KEY_ID must equal RAZORPAY_KEY_ID server-side.
// =============================================================================

const RZP_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

interface RzpInstance {
  open: () => void
  on: (event: string, handler: (resp: Record<string, unknown>) => void) => void
}

interface RzpConstructor {
  new (opts: Record<string, unknown>): RzpInstance
}

type WindowWithRazorpay = Window & typeof globalThis & {
  Razorpay?: RzpConstructor
}

export interface OpenRazorpayOptions {
  /** Razorpay order id returned from the server (`razorpay_order_id`). */
  orderId: string
  /** Order amount in PAISE (server already returns this). */
  amount: number
  /** Possah-side order number, shown in the modal as the description. */
  orderNumber: string
  /** Display name in the Razorpay modal (full customer name). */
  name: string
  /** Customer email — used for Razorpay prefill. */
  email: string
  /** Customer phone (10-digit). */
  phone: string
  /** Hex theme colour. Defaults to brand green. */
  themeColour?: string
  /**
   * Extra Razorpay modal config merged on top of the default `{ ondismiss }`.
   * Checkout uses stricter options (backdropclose, escape, handleback, confirm_close);
   * the retry flow on /account/orders uses the defaults.
   */
  modalOptions?: Record<string, unknown>

  onSuccess: (paymentId: string, signature: string) => void
  onPaymentFailed: (code: string, description: string) => void
  onDismiss: () => void
}

let scriptPromise: Promise<void> | null = null

/**
 * Lazy-loads the Razorpay checkout script exactly once per page load.
 * Subsequent calls return the same promise.
 */
export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay script can only load in the browser.'))
  }
  const w = window as WindowWithRazorpay
  if (w.Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RZP_SCRIPT_SRC}"]`,
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed to load.')), { once: true })
      if ((window as WindowWithRazorpay).Razorpay) resolve()
      return
    }

    const script = document.createElement('script')
    script.src = RZP_SCRIPT_SRC
    script.async = true
    script.onload  = () => resolve()
    script.onerror = () => reject(new Error('Razorpay script failed to load.'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

/**
 * Opens the Razorpay modal. Resolves only on `open()`; subsequent events run
 * via the supplied callbacks. The script is loaded on demand if needed.
 */
export async function openRazorpayCheckout(opts: OpenRazorpayOptions): Promise<void> {
  await loadRazorpayScript()
  const w = window as WindowWithRazorpay
  const Ctor = w.Razorpay
  if (!Ctor) throw new Error('Razorpay constructor not available after script load.')

  const themeColour = opts.themeColour ?? '#1F3A2D'

  const rz = new Ctor({
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    order_id: opts.orderId,
    amount: opts.amount,
    currency: 'INR',
    name: 'The Possah',
    description: `Order #${opts.orderNumber}`,
    image: 'https://thepossah.com/images/logo-rp.png',
    prefill: { name: opts.name, email: opts.email, contact: opts.phone },
    theme: { color: themeColour },
    handler: (response: Record<string, unknown>) => {
      opts.onSuccess(
        String(response.razorpay_payment_id ?? ''),
        String(response.razorpay_signature ?? ''),
      )
    },
    modal: { ondismiss: () => opts.onDismiss(), ...opts.modalOptions },
  })

  rz.on('payment.failed', (response: Record<string, unknown>) => {
    const err = (response.error ?? {}) as Record<string, string>
    opts.onPaymentFailed(err.code ?? 'UNKNOWN', err.description ?? 'Payment failed')
  })

  rz.open()
}
