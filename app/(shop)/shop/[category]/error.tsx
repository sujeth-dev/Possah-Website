'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error('[CategoryError]', error) }, [error])

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', backgroundColor: 'var(--color-bg)' }}>
      <div style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--color-rose)', margin: 0 }}>
          Could not load collection
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 400, color: 'var(--color-text)', margin: 0 }}>
          This collection is temporarily unavailable
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={reset} style={{ padding: '12px 24px', backgroundColor: 'var(--color-green)', color: 'var(--color-bg)', border: 'none', borderRadius: 'var(--radius-btn)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Try again
          </button>
          <Link href="/shop" style={{ padding: '12px 24px', border: '1px solid var(--color-text)', color: 'var(--color-text)', textDecoration: 'none', borderRadius: 'var(--radius-btn)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            All collections
          </Link>
        </div>
      </div>
    </div>
  )
}
