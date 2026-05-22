'use client'

// FIX-FE-03: Shop segment error boundary

import { useEffect } from 'react'
import Link from 'next/link'

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Will log to Sentry once FIX-INFRA-03 is complete
    console.error('[ShopError]', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--color-rose)',
          }}
        >
          Something went wrong
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 400,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          We had trouble loading this page
        </h1>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
          Your cart and account are safe. This is a temporary issue.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '12px 28px',
              backgroundColor: 'var(--color-green)',
              color: 'var(--color-bg)',
              border: 'none',
              borderRadius: 'var(--radius-btn)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>

          <Link
            href="/"
            style={{
              padding: '12px 28px',
              border: '1px solid var(--color-text)',
              color: 'var(--color-text)',
              textDecoration: 'none',
              borderRadius: 'var(--radius-btn)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  )
}
