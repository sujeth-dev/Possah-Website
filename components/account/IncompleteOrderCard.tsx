'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { openRazorpayCheckout } from '@/lib/razorpay-client'

// =============================================================================
// IncompleteOrderCard
//
// Renders a single card in the "Payment incomplete" section of /account/orders.
// Handles the full retry-payment flow client-side:
//   1. POST /api/orders/:n/retry-payment      → fresh razorpay_order_id
//   2. openRazorpayCheckout(...)              → Razorpay modal
//   3. POST /api/payments/verify              → HMAC-verified server update
//   4. router.refresh()                       → row moves to the Paid section
//
// Also handles the inline cancel action (POST /api/orders/:n/cancel followed
// by /api/orders/hide so the row drops out of the list).
//
// The component never trusts client-side amount/total — all numeric values
// come from the server-rendered props which were fetched by the parent page.
// =============================================================================

interface IncompleteOrderCardProps {
  orderNumber: string
  createdAt: string
  itemsPreview: string
  total: number
  paymentStatus: 'pending' | 'failed' | string
  customerName: string
  customerEmail: string
  customerPhone: string
}

export function IncompleteOrderCard({
  orderNumber,
  createdAt,
  itemsPreview,
  total,
  paymentStatus,
  customerName,
  customerEmail,
  customerPhone,
}: IncompleteOrderCardProps) {
  const router = useRouter()
  const [busy, setBusy] = useState<'idle' | 'retrying' | 'cancelling'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [, startTransition] = useTransition()

  async function handleRetry() {
    if (busy !== 'idle') return
    setError(null)
    setInfo(null)
    setBusy('retrying')

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/retry-payment`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setError(data.message ?? 'Could not start payment. Try again.')
        setBusy('idle')
        return
      }

      await openRazorpayCheckout({
        orderId: data.razorpay_order_id,
        amount: data.amount,
        orderNumber: data.order_number,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        onPaymentFailed: (code, description) => {
          setError(
            code === 'BAD_REQUEST_ERROR'
              ? 'Payment failed due to a technical issue. Please try again.'
              : `Payment declined: ${description}. Try a different card or UPI.`,
          )
          setBusy('idle')
        },
        onSuccess: async (paymentId, signature) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: data.razorpay_order_id,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature,
                order_number: data.order_number,
              }),
            })
            if (!verifyRes.ok) {
              console.error('[retry] verify endpoint error — webhook will reconcile')
            }
          } catch {
            // Network blip — webhook reconciles
          }
          setInfo('Payment received. Updating your orders…')
          startTransition(() => {
            router.refresh()
            setBusy('idle')
          })
        },
        onDismiss: () => {
          setBusy('idle')
          setInfo('Payment was cancelled. Your order is saved — retry to complete it.')
        },
      })
    } catch (err) {
      console.error('[retry] unexpected:', err)
      setError('Network error. Try again.')
      setBusy('idle')
    }
  }

  async function performCancel() {
    if (busy !== 'idle') return
    setError(null)
    setInfo(null)
    setBusy('cancelling')

    try {
      const cancelRes = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/cancel`, {
        method: 'POST',
      })
      const cancelData = await cancelRes.json().catch(() => ({}))
      if (!cancelRes.ok || !cancelData.success) {
        setError(cancelData.message ?? 'Could not cancel. Try again.')
        setBusy('idle')
        return
      }

      // Follow with soft-hide so the row drops out of the customer's list.
      const hideRes = await fetch('/api/orders/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderNumber }),
      })
      // Hide errors are non-fatal — order will still show with Cancelled state.
      if (!hideRes.ok) {
        console.warn('[retry-cancel] hide step failed; order will show as Cancelled')
      }

      startTransition(() => {
        router.refresh()
        setBusy('idle')
        setConfirmingCancel(false)
      })
    } catch (err) {
      console.error('[retry-cancel] unexpected:', err)
      setError('Network error. Try again.')
      setBusy('idle')
    }
  }

  const failedLabel = paymentStatus === 'failed' ? 'Payment failed' : 'Awaiting payment'
  const labelColour = paymentStatus === 'failed' ? 'var(--color-orange)' : 'var(--color-text-muted)'

  return (
    <div
      className="flex flex-col gap-3 p-5"
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        backgroundColor: paymentStatus === 'failed' ? 'rgba(179, 90, 43, 0.04)' : 'transparent',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.08em', color: 'var(--color-text)' }}>
              {orderNumber}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: labelColour,
              }}
            >
              {failedLabel}
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {itemsPreview}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {createdAt}
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1">
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
            {formatPrice(total)}
          </span>
          <Link
            href={`/account/orders/${encodeURIComponent(orderNumber)}`}
            className="hover:opacity-60 transition-opacity duration-200"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              textDecoration: 'underline',
            }}
          >
            View
          </Link>
        </div>
      </div>

      {(error || info) && (
        <p
          role={error ? 'alert' : 'status'}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: error ? 'var(--color-error)' : 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}
        >
          {error ?? info}
        </p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleRetry}
          disabled={busy !== 'idle'}
          style={{
            padding: '10px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            backgroundColor: 'var(--color-green)',
            color: 'var(--color-bg)',
            border: 'none',
            borderRadius: 'var(--radius-btn)',
            cursor: busy === 'retrying' ? 'wait' : 'pointer',
            opacity: busy === 'idle' ? 1 : 0.6,
          }}
        >
          {busy === 'retrying' ? 'Opening…' : 'Retry payment'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmingCancel(true)}
          disabled={busy !== 'idle'}
          style={{
            padding: '10px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-btn)',
            color: 'var(--color-text-muted)',
            cursor: busy === 'cancelling' ? 'wait' : 'pointer',
            opacity: busy === 'idle' ? 1 : 0.6,
          }}
        >
          Cancel
        </button>
      </div>

      {confirmingCancel && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm cancel"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'var(--color-overlay)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget && busy === 'idle') setConfirmingCancel(false)
          }}
        >
          <div
            className="w-full max-w-md p-6"
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
            }}
          >
            <h2
              className="mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 400,
                color: 'var(--color-text)',
              }}
            >
              Cancel order #{orderNumber}?
            </h2>
            <p
              className="mb-5"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'var(--color-text-muted)',
              }}
            >
              This closes the unpaid order and removes it from your list. You can place a fresh order any time.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingCancel(false)}
                disabled={busy !== 'idle'}
                style={{
                  padding: '10px 18px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-btn)',
                  color: 'var(--color-text)',
                  cursor: busy === 'idle' ? 'pointer' : 'wait',
                }}
              >
                Keep order
              </button>
              <button
                type="button"
                onClick={performCancel}
                disabled={busy !== 'idle'}
                style={{
                  padding: '10px 18px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  backgroundColor: 'var(--color-orange)',
                  border: '1px solid var(--color-orange)',
                  borderRadius: 'var(--radius-btn)',
                  color: 'var(--color-bg)',
                  cursor: busy === 'idle' ? 'pointer' : 'wait',
                  opacity: busy === 'cancelling' ? 0.6 : 1,
                }}
              >
                {busy === 'cancelling' ? 'Cancelling…' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
