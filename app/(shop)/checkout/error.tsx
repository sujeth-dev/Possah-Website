'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error('[CheckoutError]', error) }, [error])

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', backgroundColor: 'var(--color-bg)' }}>
      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--color-rose)', margin: 0 }}>
          Checkout error
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 400, color: 'var(--color-text)', margin: 0 }}>
          We couldn&apos;t load checkout
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
          Your cart is safe — nothing was charged. Refresh the page or go back to your cart.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={reset} style={{ padding: '12px 28px', backgroundColor: 'var(--color-green)', color: 'var(--color-bg)', border: 'none', borderRadius: 'var(--radius-btn)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Try again
          </button>
          <Link href="/cart" style={{ padding: '12px 28px', border: '1px solid var(--color-text)', color: 'var(--color-text)', textDecoration: 'none', borderRadius: 'var(--radius-btn)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Back to cart
          </Link>
        </div>
      </div>
    </div>
  )
}
