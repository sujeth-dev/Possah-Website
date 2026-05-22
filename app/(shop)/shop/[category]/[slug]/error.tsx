'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function PDPError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error('[PDPError]', error) }, [error])

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', backgroundColor: 'var(--color-bg)' }}>
      <div style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--color-rose)', margin: 0 }}>
          Could not load product
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 400, color: 'var(--color-text)', margin: 0 }}>
          This piece is temporarily unavailable
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
          Your cart is safe. This is a temporary issue on our end.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={reset} style={{ padding: '12px 24px', backgroundColor: 'var(--color-green)', color: 'var(--color-bg)', border: 'none', borderRadius: 'var(--radius-btn)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Try again
          </button>
          <Link href="/" style={{ padding: '12px 24px', border: '1px solid var(--color-text)', color: 'var(--color-text)', textDecoration: 'none', borderRadius: 'var(--radius-btn)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
