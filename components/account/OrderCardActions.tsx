'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface OrderCardActionsProps {
  orderNumber: string
  /**
   * Whether the X button should be rendered. Computed server-side from
   * payment_status + fulfillment_status so paid in-progress orders cannot be
   * hidden.
   */
  isHideable: boolean
}

export function OrderCardActions({ orderNumber, isHideable }: OrderCardActionsProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isHideable) return null

  async function performHide() {
    setError(null)
    try {
      const res = await fetch('/api/orders/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderNumber }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message ?? 'Could not hide order. Try again.')
        return
      }
      setConfirming(false)
      startTransition(() => {
        router.refresh()
      })
    } catch {
      setError('Network error. Try again.')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Hide order ${orderNumber}`}
        title="Hide this order"
        className="hover:opacity-100 transition-opacity duration-150"
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          opacity: 0.7,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M1 1l8 8M9 1L1 9" />
        </svg>
      </button>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm hide order"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'var(--color-overlay)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirming(false)
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
              Hide order #{orderNumber}?
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
              The order will move out of your list. The record is kept — contact us if you need it back.
            </p>

            {error && (
              <p
                role="alert"
                className="mb-4"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--color-error)',
                }}
              >
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={isPending}
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
                  cursor: isPending ? 'wait' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performHide}
                disabled={isPending}
                style={{
                  padding: '10px 18px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  backgroundColor: 'var(--color-green)',
                  border: '1px solid var(--color-green)',
                  borderRadius: 'var(--radius-btn)',
                  color: 'var(--color-bg)',
                  cursor: isPending ? 'wait' : 'pointer',
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                {isPending ? 'Hiding…' : 'Hide order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
